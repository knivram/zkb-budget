import {
  DateTimePicker,
  Form,
  Host,
  HStack,
  Picker,
  Section,
  Spacer,
  Text,
  TextField,
} from "@expo/ui/swift-ui";
import { router, Stack } from "expo-router";
import { useState } from "react";
import { db } from "../db/client";
import { BILLING_CYCLES, subscriptions } from "../db/schema";

export default function AddSubscription() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [billingCycleIndex, setBillingCycleIndex] = useState(1); // default to monthly
  const [subscribedAt, setSubscribedAt] = useState(new Date());
  const [url, setUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !price.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert price string to cents (e.g., "9.99" -> 999)
      const priceInCents = Math.round(parseFloat(price) * 100);

      if (isNaN(priceInCents)) {
        setIsSubmitting(false);
        return;
      }

      await db.insert(subscriptions).values({
        name: name.trim(),
        price: priceInCents,
        billingCycle: BILLING_CYCLES[billingCycleIndex],
        subscribedAt,
        url: url.trim() || null,
      });

      router.back();
    } catch (error) {
      console.error("Failed to save subscription:", error);
      setIsSubmitting(false);
    }
  };

  const isValid = name.trim().length > 0 && price.trim().length > 0;

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
              onPress: handleSave,
              disabled: !isValid || isSubmitting,
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
      <Host style={{ flex: 1 }}>
        <Form>
          <Section title="Subscription Details">
            <TextField
              placeholder="Name"
              defaultValue={name}
              onChangeText={setName}
            />

            <TextField
              placeholder="Price"
              defaultValue={price}
              onChangeText={setPrice}
            />
          </Section>
          <Section title="Subscription Start">
            <Picker
              options={["Weekly", "Monthly", "Yearly"]}
              selectedIndex={billingCycleIndex}
              onOptionSelected={({ nativeEvent: { index } }) => {
                setBillingCycleIndex(index);
              }}
              variant="segmented"
            />
            <HStack>
              <Text>Subscribed since</Text>
              <Spacer />
              <DateTimePicker
                onDateSelected={(date) => {
                  setSubscribedAt(date);
                }}
                displayedComponents="date"
                initialDate={subscribedAt.toISOString()}
                variant="compact"
              />
            </HStack>
          </Section>

          <Section title="Additional Info">
            <TextField
              placeholder="URL (optional)"
              defaultValue={url}
              onChangeText={setUrl}
            />
          </Section>
        </Form>
      </Host>
    </>
  );
}
