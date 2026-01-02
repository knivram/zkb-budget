import { db } from "@/db/client";
import { transactions } from "@/db/schema";
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
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { router } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";

interface ImportTransactionsProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
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

      const newTransactions = await db
        .insert(transactions)
        .values(parsedTransactions)
        .onConflictDoNothing()
        .returning();

      const newCount = newTransactions.length;

      if (newCount === 0) {
        setIsImporting(false);
        onOpenChange(false);
        Alert.alert(
          "No New Transactions",
          "All transactions in this file already exist."
        );
        return;
      }

      setLoadingMessage("Analyzing subscriptions...");
      try {
        console.log("Analyzing subscriptions...");
        const response = await fetch("/api/detect-subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transactions: newTransactions }),
        });

        if (response.ok) {
          const { subscriptions: detectedSubscriptions } =
            await response.json();

          if (detectedSubscriptions && detectedSubscriptions.length > 0) {
            setIsImporting(false);
            router.push({
              pathname: "/transactions/review-detected",
              params: {
                detectedSubscriptions: JSON.stringify(detectedSubscriptions),
              },
            });
            onOpenChange(false);
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
