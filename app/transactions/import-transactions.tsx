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

      await db
        .insert(transactions)
        .values(parsedTransactions)
        .onConflictDoNothing();

      onOpenChange(false);
      Alert.alert(
        "Import Complete",
        `Successfully imported ${parsedTransactions.length} transactions.`
      );
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
                {isImporting ? "Importing..." : "Choose File"}
              </SwiftText>
            </Button>
          </VStack>
          <Spacer />
        </HStack>
      </BottomSheet>
    </Host>
  );
}
