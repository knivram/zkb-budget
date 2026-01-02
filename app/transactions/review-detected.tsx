import { db } from "@/db/client";
import { subscriptions } from "@/db/schema";
import { DetectedSubscription } from "@/lib/api/ai-schemas";
import { fetchLogoAsBase64 } from "@/lib/logo-fetcher";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";

const HIGH_CONFIDENCE_THRESHOLD = 0.8;
const MEDIUM_CONFIDENCE_THRESHOLD = 0.6;

export default function ReviewDetectedSubscriptions() {
  const params = useLocalSearchParams();
  const detectedSubscriptions: DetectedSubscription[] = JSON.parse(
    params.detectedSubscriptions as string
  );

  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    new Set(detectedSubscriptions.map((_, i) => i))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleSelection = (index: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const selected = detectedSubscriptions.filter((_, i) =>
        selectedIds.has(i)
      );

      if (selected.length === 0) {
        router.back();
        return;
      }

      const subscriptionsToInsert = await Promise.all(
        selected.map(async (sub) => ({
          name: sub.name,
          price: Math.round(sub.price * 100), // Convert to cents
          billingCycle: sub.billingCycle,
          subscribedAt: new Date(sub.subscribedAt),
          url: sub.domain || null,
          icon: sub.domain ? await fetchLogoAsBase64(sub.domain) : null,
        }))
      );

      await db.insert(subscriptions).values(subscriptionsToInsert);

      // TODO: find out why the router.back() is needed
      router.back();
      router.push("/subscriptions");
    } catch (error) {
      console.error("Failed to add subscriptions:", error);
      Alert.alert("Error", "Failed to add subscriptions.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= HIGH_CONFIDENCE_THRESHOLD) return "bg-green-500";
    if (confidence >= MEDIUM_CONFIDENCE_THRESHOLD) return "bg-yellow-500";
    return "bg-orange-500";
  };

  const getConfidenceBadgeText = (confidence: number): string => {
    if (confidence >= HIGH_CONFIDENCE_THRESHOLD) return "High";
    if (confidence >= MEDIUM_CONFIDENCE_THRESHOLD) return "Medium";
    return "Low";
  };

  const formatPrice = (price: number): string => {
    return price.toFixed(2);
  };

  const formatBillingCycle = (cycle: string): string => {
    switch (cycle) {
      case "weekly":
        return "Weekly";
      case "monthly":
        return "Monthly";
      case "yearly":
        return "Yearly";
      default:
        return cycle;
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          unstable_headerRightItems: () => [
            {
              type: "button",
              label: "Save",
              icon: {
                name: "checkmark",
                type: "sfSymbol",
              },
              variant: "prominent",
              onPress: handleConfirm,
              disabled: isSubmitting,
            },
          ],
          unstable_headerLeftItems: () => [
            {
              type: "button",
              label: "Cancel",
              icon: {
                name: "xmark",
                type: "sfSymbol",
              },
              onPress: () => router.back(),
            },
          ],
        }}
      />
      <ScrollView
        className="flex-1 bg-white dark:bg-zinc-900"
        contentInsetAdjustmentBehavior="automatic"
      >
        <View className="p-4">
          <Text className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
            Review these detected subscriptions and select which ones to add to
            your account.
          </Text>
          <View className="mt-4 flex-col gap-2">
            {detectedSubscriptions.map((sub, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => toggleSelection(index)}
                className={`rounded-xl border-2 p-4 ${
                  selectedIds.has(index)
                    ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950"
                    : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
                }`}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <View className="mb-2 flex-row items-center gap-2">
                      <Text className="text-lg font-semibold text-zinc-900 dark:text-white">
                        {sub.name}
                      </Text>
                      <View
                        className={`rounded-full px-2 py-0.5 ${getConfidenceColor(sub.confidence)}`}
                      >
                        <Text className="text-xs font-medium text-white">
                          {getConfidenceBadgeText(sub.confidence)} (
                          {Math.round(sub.confidence * 100)}%)
                        </Text>
                      </View>
                    </View>
                    <Text className="mb-1 text-base font-medium text-zinc-700 dark:text-zinc-300">
                      CHF {formatPrice(sub.price)} ·{" "}
                      {formatBillingCycle(sub.billingCycle)}
                    </Text>
                    {sub.domain && (
                      <Text className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">
                        {sub.domain}
                      </Text>
                    )}
                    {sub.reasoning && (
                      <Text className="text-sm italic text-zinc-600 dark:text-zinc-400">
                        &quot;{sub.reasoning}&quot;
                      </Text>
                    )}
                  </View>
                  <View
                    className={`ml-3 h-6 w-6 items-center justify-center rounded-full border-2 ${
                      selectedIds.has(index)
                        ? "border-blue-500 bg-blue-500"
                        : "border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-700"
                    }`}
                  >
                    {selectedIds.has(index) && (
                      <Text className="text-sm font-bold text-white">✓</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </>
  );
}
