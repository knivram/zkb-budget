import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { router } from 'expo-router';
import { isNull } from 'drizzle-orm';

import { BottomSheet, Button } from '@/components/ui';
import { db } from '@/db/client';
import { transactions } from '@/db/schema';
import type { SubscriptionDetectionResponse } from '@/lib/api/ai-schemas';
import { API_URL } from '@/lib/config';

interface DetectSubscriptionsProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function DetectSubscriptions({ isOpen, onOpenChange }: DetectSubscriptionsProps) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Detecting...');

  const handleDetect = async () => {
    try {
      setIsDetecting(true);
      setLoadingMessage('Fetching transactions...');

      // Fetch all transactions
      const allTransactions = await db
        .select()
        .from(transactions)
        .where(isNull(transactions.subscriptionId));

      if (allTransactions.length === 0) {
        setIsDetecting(false);
        Alert.alert(
          'No Transactions',
          'Import some transactions first before detecting subscriptions.'
        );
        onOpenChange(false);
        return;
      }

      setLoadingMessage('Analyzing transactions...');

      // Call the detect-subscriptions API
      const response = await fetch(`${API_URL}/api/detect-subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: allTransactions }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to detect subscriptions');
      }

      const result: SubscriptionDetectionResponse = await response.json();

      setIsDetecting(false);
      onOpenChange(false);

      if (result.subscriptions.length === 0) {
        Alert.alert(
          'No Subscriptions Found',
          'No recurring subscriptions were detected in your transactions.'
        );
        return;
      }

      // Navigate to review screen with detected subscriptions
      router.push({
        pathname: '/subscriptions/review-detected',
        params: {
          detectedSubscriptions: JSON.stringify(result.subscriptions),
        },
      });
    } catch (error) {
      console.error('Detection error:', error);
      setIsDetecting(false);
      Alert.alert(
        'Detection Failed',
        error instanceof Error ? error.message : 'An error occurred while detecting subscriptions.'
      );
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange} dismissible={!isDetecting}>
      <View className="gap-4">
        <View>
          <Text className="text-lg font-semibold text-slate-900 dark:text-white">
            Detect Subscriptions
          </Text>
          <Text className="mt-1 text-sm text-slate-500">
            Use AI to analyze your transactions and find recurring subscriptions.
          </Text>
        </View>
        <Button
          onPress={handleDetect}
          disabled={isDetecting}
          label={isDetecting ? loadingMessage : 'Start Detection'}
          className="w-full"
        />
      </View>
    </BottomSheet>
  );
}
