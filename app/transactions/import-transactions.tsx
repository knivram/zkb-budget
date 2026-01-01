import { db } from "@/db/client";
import { subscriptions, transactions } from "@/db/schema";
import { DetectedSubscription } from "@/lib/api/ai-schemas";
import { fetchLogoAsBase64 } from "@/lib/logo-fetcher";
import { parseXMLTransactions } from "@/lib/xml-parser";
import {
  BottomSheet,
  Button,
  Host,
  HStack,
  Spacer,
  Text as SwiftText,
  VStack,
} from "@expo/ui/swift-ui";
import { frame, padding } from "@expo/ui/swift-ui/modifiers";
import { count, desc, eq } from "drizzle-orm";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { router } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";

interface ImportTransactionsProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

async function insertDetectedSubscriptions(
  detected: DetectedSubscription[]
): Promise<void> {
  if (detected.length === 0) return;

  const subscriptionsToInsert = detected.map((sub) => ({
    name: sub.name,
    price: Math.round(sub.price * 100),
    billingCycle: sub.billingCycle,
    subscribedAt: new Date(sub.subscribedAt),
    url: sub.domain || null,
    icon: null,
  }));

  const insertedSubscriptions = await db
    .insert(subscriptions)
    .values(subscriptionsToInsert)
    .returning();

  insertedSubscriptions.forEach(async (sub) => {
    if (sub.url) {
      try {
        const icon = await fetchLogoAsBase64(sub.url);
        if (icon) {
          await db
            .update(subscriptions)
            .set({ icon })
            .where(eq(subscriptions.id, sub.id));
        }
      } catch (error) {
        console.error(`Failed to fetch logo for ${sub.name}:`, error);
      }
    }
  });
}

export default function ImportTransactions({
  isOpen,
  onOpenChange,
}: ImportTransactionsProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Importing...");

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/xml", "application/xml"],
        copyToCacheDirectory: true,
      });

      const selectedFile = result.assets?.[0];
      if (result.canceled || !selectedFile) {
        return;
      }

      setIsImporting(true);
      setLoadingMessage("Importing...");

      const file = new File(selectedFile.uri);
      const xmlContent = await file.text();
      const parsedTransactions = parseXMLTransactions(xmlContent);

      if (parsedTransactions.length === 0) {
        Alert.alert(
          "No Transactions",
          "No valid transactions found in the file."
        );
        setIsImporting(false);
        return;
      }

      // TODO: #6 - Use imports table to track imports instead of counting before/after
      const beforeCount = await db
        .select({ count: count() })
        .from(transactions);

      await db
        .insert(transactions)
        .values(parsedTransactions)
        .onConflictDoNothing();

      const afterCount = await db.select({ count: count() }).from(transactions);

      const newCount = afterCount[0].count - beforeCount[0].count;

      if (newCount === 0) {
        setIsImporting(false);
        onOpenChange(false);
        Alert.alert(
          "No New Transactions",
          "All transactions in this file already exist."
        );
        return;
      }

      const newTransactions = await db
        .select()
        .from(transactions)
        .orderBy(desc(transactions.createdAt))
        .limit(newCount);

      setLoadingMessage("Analyzing subscriptions...");
      try {
        console.log("Analyzing subscriptions...");
        const response = await fetch("/api/detect-subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transactions: newTransactions }),
        });

        if (response.ok) {
          const { subscriptions: detected } = await response.json();

          if (detected && detected.length > 0) {
            const highConfidence = detected.filter(
              (s: DetectedSubscription) => s.confidence > 0.8
            );
            const mediumConfidence = detected.filter(
              (s: DetectedSubscription) =>
                s.confidence >= 0.0 && s.confidence <= 0.8
            );

            if (highConfidence.length > 0) {
              await insertDetectedSubscriptions(highConfidence);
            }

            if (mediumConfidence.length > 0) {
              setIsImporting(false);
              router.push({
                pathname: "/transactions/review-detected",
                params: {
                  detectedSubscriptions: JSON.stringify(mediumConfidence),
                },
              });
              onOpenChange(false);
              return;
            }

            setIsImporting(false);
            onOpenChange(false);
            Alert.alert(
              "Import Complete",
              `Imported ${newCount} transactions. ${highConfidence.length} subscriptions detected and added.`
            );
            return;
          }
        }
      } catch (error) {
        console.error("AI detection failed:", error);
      }

      setIsImporting(false);
      onOpenChange(false);
      Alert.alert("Import Complete", `Imported ${newCount} new transactions.`);
    } catch (error) {
      console.error("Import error:", error);
      Alert.alert(
        "Import Failed",
        "An error occurred while importing transactions."
      );
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Host>
      <BottomSheet
        isOpened={isOpen}
        onIsOpenedChange={onOpenChange}
        presentationDetents={[0.2]}
      >
        <HStack>
          <VStack alignment="leading" modifiers={[padding({ all: 24 })]}>
            <SwiftText weight="semibold" size={20}>
              Import Transactions
            </SwiftText>
            <SwiftText size={14} color="#71717a">
              Select an XML file exported from your bank
            </SwiftText>
            <Spacer minLength={20} />
            <Button
              onPress={handleImport}
              disabled={isImporting}
              variant="borderedProminent"
              controlSize="large"
              modifiers={[frame({ maxWidth: Infinity })]}
            >
              <SwiftText modifiers={[frame({ maxWidth: Infinity })]}>
                {isImporting ? loadingMessage : "Choose File"}
              </SwiftText>
            </Button>
          </VStack>
          <Spacer />
        </HStack>
      </BottomSheet>
    </Host>
  );
}
