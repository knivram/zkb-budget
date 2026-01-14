import { Effect } from "effect";
import { db } from "@/db/client";
import { transactions } from "@/db/schema";
import { SubscriptionDetectionResponse } from "@/lib/api/ai-schemas";
import { API_URL } from "@/lib/config";
import {
  ApiResponseError,
  DatabaseQueryError,
  NetworkError,
} from "@/lib/errors";
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
import { isNull } from "drizzle-orm";
import { router } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";

// ============================================================================
// Types
// ============================================================================

interface DetectSubscriptionsProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

type DetectionError = DatabaseQueryError | NetworkError | ApiResponseError;

// ============================================================================
// Effect-based detection operations
// ============================================================================

/**
 * Fetch transactions that are not yet linked to a subscription.
 */
const fetchUnlinkedTransactions = (): Effect.Effect<
  typeof transactions.$inferSelect[],
  DatabaseQueryError
> =>
  Effect.tryPromise({
    try: async () => {
      return await db
        .select()
        .from(transactions)
        .where(isNull(transactions.subscriptionId));
    },
    catch: (error) =>
      new DatabaseQueryError({ operation: "fetch transactions", cause: error }),
  });

/**
 * Call the subscription detection API.
 */
const callDetectionApi = (
  allTransactions: typeof transactions.$inferSelect[]
): Effect.Effect<SubscriptionDetectionResponse, NetworkError | ApiResponseError> =>
  Effect.tryPromise({
    try: async () => {
      const response = await fetch(`${API_URL}/api/detect-subscriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions: allTransactions }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new ApiResponseError({
          status: response.status,
          message: error.error || "Failed to detect subscriptions",
        });
      }

      return await response.json();
    },
    catch: (error) => {
      if (error instanceof ApiResponseError) {
        return error;
      }
      return new NetworkError({
        url: `${API_URL}/api/detect-subscriptions`,
        cause: error,
      });
    },
  });

/**
 * The main detection pipeline.
 * Fetches transactions and analyzes them for subscriptions.
 */
const detectSubscriptionsPipeline = (): Effect.Effect<
  SubscriptionDetectionResponse | null,
  DetectionError
> =>
  Effect.gen(function* () {
    // Fetch unlinked transactions
    const allTransactions = yield* fetchUnlinkedTransactions();

    // Return null if no transactions to analyze
    if (allTransactions.length === 0) {
      return null;
    }

    // Call detection API
    const result = yield* callDetectionApi(allTransactions);

    return result;
  });

// ============================================================================
// Component
// ============================================================================

export default function DetectSubscriptions({
  isOpen,
  onOpenChange,
}: DetectSubscriptionsProps) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Detecting...");

  const handleDetect = async () => {
    setIsDetecting(true);
    setLoadingMessage("Fetching transactions...");

    // Run the detection pipeline
    const result = await Effect.runPromiseExit(
      detectSubscriptionsPipeline().pipe(
        Effect.tap(() =>
          Effect.sync(() => setLoadingMessage("Analyzing transactions..."))
        )
      )
    );

    if (result._tag === "Failure") {
      setIsDetecting(false);

      // Extract error from Cause
      const cause = result.cause;
      let errorMessage = "An error occurred while detecting subscriptions.";

      if (cause._tag === "Fail") {
        const error = cause.error as DetectionError;
        if (error instanceof DatabaseQueryError) {
          errorMessage = "Failed to fetch transactions from database.";
        } else if (error instanceof NetworkError) {
          errorMessage = "Network error while contacting the server.";
        } else if (error instanceof ApiResponseError) {
          errorMessage = error.message;
        }
      }

      Alert.alert("Detection Failed", errorMessage);
      return;
    }

    const detectionResult = result.value;

    // Handle no transactions case
    if (detectionResult === null) {
      setIsDetecting(false);
      Alert.alert(
        "No Transactions",
        "Import some transactions first before detecting subscriptions."
      );
      onOpenChange(false);
      return;
    }

    setIsDetecting(false);
    onOpenChange(false);

    // Handle no subscriptions found
    if (!detectionResult.subscriptions || detectionResult.subscriptions.length === 0) {
      Alert.alert(
        "No Subscriptions Found",
        "No recurring subscriptions were detected in your transactions."
      );
      return;
    }

    // Navigate to review screen with detected subscriptions
    router.push({
      pathname: "/subscriptions/review-detected",
      params: {
        detectedSubscriptions: JSON.stringify(detectionResult.subscriptions),
      },
    });
  };

  return (
    <Host>
      <BottomSheet
        isOpened={isOpen}
        onIsOpenedChange={onOpenChange}
        presentationDetents={[0.23]}
        interactiveDismissDisabled={isDetecting}
      >
        <HStack>
          <VStack alignment="leading" modifiers={[padding({ all: 24 })]}>
            <SwiftText weight="semibold" size={20}>
              Detect Subscriptions
            </SwiftText>
            <SwiftText size={14} color="#71717a">
              Use AI to analyze your transactions and find recurring
              subscriptions
            </SwiftText>
            <Spacer minLength={20} />
            <Button
              onPress={handleDetect}
              disabled={isDetecting}
              variant="borderedProminent"
              controlSize="large"
              modifiers={[frame({ maxWidth: Infinity })]}
            >
              <SwiftText modifiers={[frame({ maxWidth: Infinity })]}>
                {isDetecting ? loadingMessage : "Start Detection"}
              </SwiftText>
            </Button>
          </VStack>
          <Spacer />
        </HStack>
      </BottomSheet>
    </Host>
  );
}
