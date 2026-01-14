import { Effect } from "effect";
import { db } from "@/db/client";
import { subscriptions, transactions } from "@/db/schema";
import { EnrichedTransaction } from "@/lib/api/ai-schemas";
import { API_URL } from "@/lib/config";
import {
  ApiResponseError,
  DatabaseQueryError,
  FileReadError,
  NetworkError,
  XmlParseError,
} from "@/lib/errors";
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
import { eq } from "drizzle-orm";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { useState } from "react";
import { Alert } from "react-native";

// ============================================================================
// Types
// ============================================================================

interface ImportTransactionsProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

type ImportError =
  | FileReadError
  | XmlParseError
  | DatabaseQueryError
  | NetworkError
  | ApiResponseError;

// ============================================================================
// Effect-based import operations
// ============================================================================

/**
 * Read file contents from a URI.
 */
const readFileContent = (
  uri: string
): Effect.Effect<string, FileReadError> =>
  Effect.tryPromise({
    try: async () => {
      const file = new File(uri);
      return await file.text();
    },
    catch: (error) => new FileReadError({ path: uri, cause: error }),
  });

/**
 * Parse XML content into transactions.
 * Uses the synchronous parser but wraps any errors.
 */
const parseTransactions = (
  xmlContent: string
): Effect.Effect<ReturnType<typeof parseXMLTransactions>, XmlParseError> =>
  Effect.try({
    try: () => {
      const parsed = parseXMLTransactions(xmlContent);
      if (parsed.length === 0) {
        throw new Error("No valid transactions found");
      }
      return parsed;
    },
    catch: () =>
      new XmlParseError({
        reason: "invalid_xml",
        details: "No valid transactions found in the file",
      }),
  });

/**
 * Insert transactions into the database.
 */
const insertTransactions = (
  parsedTransactions: ReturnType<typeof parseXMLTransactions>
): Effect.Effect<typeof transactions.$inferSelect[], DatabaseQueryError> =>
  Effect.tryPromise({
    try: async () => {
      return await db
        .insert(transactions)
        .values(parsedTransactions)
        .onConflictDoNothing()
        .returning();
    },
    catch: (error) =>
      new DatabaseQueryError({ operation: "insert transactions", cause: error }),
  });

/**
 * Fetch existing subscriptions for AI matching.
 */
const fetchSubscriptions = (): Effect.Effect<
  { id: number; name: string; price: number; billingCycle: string }[],
  DatabaseQueryError
> =>
  Effect.tryPromise({
    try: async () => {
      return await db
        .select({
          id: subscriptions.id,
          name: subscriptions.name,
          price: subscriptions.price,
          billingCycle: subscriptions.billingCycle,
        })
        .from(subscriptions);
    },
    catch: (error) =>
      new DatabaseQueryError({ operation: "fetch subscriptions", cause: error }),
  });

/**
 * Call the enrichment API.
 */
const callEnrichmentApi = (
  newTransactions: typeof transactions.$inferSelect[],
  existingSubscriptions: { id: number; name: string; price: number; billingCycle: string }[]
): Effect.Effect<EnrichedTransaction[], NetworkError | ApiResponseError> =>
  Effect.tryPromise({
    try: async () => {
      const response = await fetch(`${API_URL}/api/enrich-transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactions: newTransactions,
          subscriptions: existingSubscriptions,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new ApiResponseError({
          status: response.status,
          message: error.error || "Failed to enrich transactions",
        });
      }

      const { transactions: enrichedData } = await response.json();
      return enrichedData ?? [];
    },
    catch: (error) => {
      if (error instanceof ApiResponseError) {
        return error;
      }
      return new NetworkError({
        url: `${API_URL}/api/enrich-transactions`,
        cause: error,
      });
    },
  });

/**
 * Update transactions with enriched data.
 */
const updateWithEnrichedData = (
  newTransactions: typeof transactions.$inferSelect[],
  enrichedData: EnrichedTransaction[]
): Effect.Effect<void, DatabaseQueryError> =>
  Effect.tryPromise({
    try: async () => {
      if (enrichedData.length === 0) return;

      await Promise.all(
        enrichedData.map((enriched: EnrichedTransaction) => {
          const transaction = newTransactions.find((t) => t.id === enriched.id);
          if (!transaction) return;

          const isTwint =
            transaction.transactionAdditionalDetails.includes("TWINT");

          return db
            .update(transactions)
            .set({
              category: enriched.category,
              displayName: enriched.displayName,
              domain: enriched.domain ?? (isTwint ? "twint.ch" : null),
              subscriptionId: enriched.subscriptionId ?? null,
            })
            .where(eq(transactions.id, enriched.id));
        })
      );
    },
    catch: (error) =>
      new DatabaseQueryError({ operation: "update transactions", cause: error }),
  });

/**
 * Enrich transactions with AI (non-critical operation).
 * Failures are logged but don't fail the overall import.
 */
const enrichTransactions = (
  newTransactions: typeof transactions.$inferSelect[]
): Effect.Effect<void> =>
  Effect.gen(function* () {
    const existingSubscriptions = yield* fetchSubscriptions().pipe(
      Effect.catchAll(() => Effect.succeed([]))
    );

    const enrichedData = yield* callEnrichmentApi(
      newTransactions,
      existingSubscriptions
    ).pipe(Effect.catchAll(() => Effect.succeed([] as EnrichedTransaction[])));

    yield* updateWithEnrichedData(newTransactions, enrichedData).pipe(
      Effect.catchAll(() => Effect.succeed(undefined))
    );
  });

// ============================================================================
// Component
// ============================================================================

export default function ImportTransactions({
  isOpen,
  onOpenChange,
}: ImportTransactionsProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Importing...");

  const handleImport = async () => {
    // Pick document (outside Effect since it's user interaction)
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

    // Define the import pipeline
    const importPipeline = Effect.gen(function* () {
      // Read file
      const xmlContent = yield* readFileContent(selectedFile.uri);

      // Parse transactions
      const parsedTransactions = yield* parseTransactions(xmlContent);

      // Insert into database
      const newTransactions = yield* insertTransactions(parsedTransactions);

      return newTransactions;
    });

    // Run the import pipeline
    const importResult = await Effect.runPromiseExit(importPipeline);

    if (importResult._tag === "Failure") {
      setIsImporting(false);

      // Extract error from Cause
      const cause = importResult.cause;
      let errorMessage = "An error occurred while importing transactions.";

      if (cause._tag === "Fail") {
        const error = cause.error as ImportError;
        if (error instanceof XmlParseError) {
          errorMessage = "No valid transactions found in the file.";
        } else if (error instanceof FileReadError) {
          errorMessage = "Failed to read the selected file.";
        } else if (error instanceof DatabaseQueryError) {
          errorMessage = "Failed to save transactions to database.";
        }
      }

      Alert.alert("Import Failed", errorMessage);
      return;
    }

    const newTransactions = importResult.value;

    // Handle no new transactions
    if (newTransactions.length === 0) {
      setIsImporting(false);
      onOpenChange(false);
      Alert.alert(
        "No New Transactions",
        "All transactions in this file already exist."
      );
      return;
    }

    // Enrich transactions (non-critical)
    setLoadingMessage("Enriching transactions...");
    await Effect.runPromise(enrichTransactions(newTransactions));

    setIsImporting(false);
    onOpenChange(false);
  };

  return (
    <Host>
      <BottomSheet
        isOpened={isOpen}
        onIsOpenedChange={onOpenChange}
        presentationDetents={[0.2]}
        interactiveDismissDisabled={isImporting}
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
