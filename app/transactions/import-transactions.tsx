import { useState } from 'react';
import { Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { eq } from 'drizzle-orm';
import { ActionSheet } from '@/components/ui';
import { db } from '@/db/client';
import { subscriptions, transactions } from '@/db/schema';
import { EnrichedTransaction } from '@/lib/api/ai-schemas';
import { API_URL } from '@/lib/config';
import { parseXMLTransactions } from '@/lib/xml-parser';

interface ImportTransactionsProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function ImportTransactions({ isOpen, onOpenChange }: ImportTransactionsProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Importing...');

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/xml', 'application/xml'],
        copyToCacheDirectory: true,
      });

      const selectedFile = result.assets?.[0];
      if (result.canceled || !selectedFile) {
        return;
      }

      setIsImporting(true);
      setLoadingMessage('Importing...');

      const file = new File(selectedFile.uri);
      const xmlContent = await file.text();
      const parsedTransactions = parseXMLTransactions(xmlContent);

      if (parsedTransactions.length === 0) {
        Alert.alert('No Transactions', 'No valid transactions found in the file.');
        setIsImporting(false);
        return;
      }

      const newTransactions = await db
        .insert(transactions)
        .values(parsedTransactions)
        .onConflictDoNothing()
        .returning();

      const newCount = newTransactions.length;

      if (newCount === 0) {
        setIsImporting(false);
        onOpenChange(false);
        Alert.alert('No New Transactions', 'All transactions in this file already exist.');
        return;
      }

      // Enrich transactions with AI
      setLoadingMessage('Enriching transactions...');
      try {
        // Fetch existing subscriptions for matching
        const existingSubscriptions = await db
          .select({
            id: subscriptions.id,
            name: subscriptions.name,
            price: subscriptions.price,
            billingCycle: subscriptions.billingCycle,
          })
          .from(subscriptions);

        const enrichResponse = await fetch(`${API_URL}/api/enrich-transactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transactions: newTransactions,
            subscriptions: existingSubscriptions,
          }),
        });

        if (enrichResponse.ok) {
          const { transactions: enrichedData } = await enrichResponse.json();

          // Update transactions with enriched data
          if (enrichedData && enrichedData.length > 0) {
            await Promise.all(
              enrichedData.map((enriched: EnrichedTransaction) => {
                const transaction = newTransactions.find((t) => t.id === enriched.id);
                if (!transaction) {
                  return;
                }
                const isTwint = transaction.transactionAdditionalDetails.includes('TWINT');

                return db
                  .update(transactions)
                  .set({
                    category: enriched.category,
                    displayName: enriched.displayName,
                    domain: enriched.domain ?? (isTwint ? 'twint.ch' : null),
                    subscriptionId: enriched.subscriptionId ?? null,
                  })
                  .where(eq(transactions.id, enriched.id));
              })
            );
          }
        }
      } catch (error) {
        console.error('Transaction enrichment failed:', error);
        // Continue - enrichment is non-critical
      }

      setIsImporting(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Import Failed', 'An error occurred while importing transactions.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <ActionSheet
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Import Transactions"
      description="Select an XML file exported from your bank."
      actionLabel="Choose File"
      loadingLabel={loadingMessage}
      isProcessing={isImporting}
      onAction={handleImport}
    />
  );
}
