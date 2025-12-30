import { DateTimePicker, Host, Picker } from "@expo/ui/swift-ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { router, Stack } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { z } from "zod";
import { db } from "../db/client";
import { BILLING_CYCLES, subscriptions } from "../db/schema";

const subscriptionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z
    .string()
    .min(1, "Price is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Price must be a valid positive number",
    }),
  billingCycleIndex: z.number(),
  subscribedAt: z.date(),
  url: z.string().optional(),
});

type SubscriptionFormData = z.infer<typeof subscriptionSchema>;

function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="mb-2 ml-4 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
      {title}
    </Text>
  );
}

function Separator() {
  return <View className="ml-4 h-px bg-zinc-200 dark:bg-zinc-700" />;
}

export default function AddSubscription() {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      name: "",
      price: "",
      billingCycleIndex: 1, // default to monthly
      subscribedAt: new Date(),
      url: "",
    },
    mode: "onChange",
  });

  const onSubmit = async (data: SubscriptionFormData) => {
    try {
      // Convert price string to cents (e.g., "9.99" -> 999)
      const priceInCents = Math.round(parseFloat(data.price) * 100);

      await db.insert(subscriptions).values({
        name: data.name.trim(),
        price: priceInCents,
        billingCycle: BILLING_CYCLES[data.billingCycleIndex],
        subscribedAt: data.subscribedAt,
        url: data.url?.trim() || null,
      });

      router.back();
    } catch (error) {
      console.error("Failed to save subscription:", error);
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
              onPress: handleSubmit(onSubmit),
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 pt-20"
      >
        <ScrollView
          className="flex-1 bg-zinc-100 dark:bg-zinc-900"
          contentContainerClassName="px-4 pb-8 pt-4"
          keyboardShouldPersistTaps="handled"
        >
          {/* Subscription Details Section */}
          <View className="mb-6">
            <SectionHeader title="Subscription Details" />
            <View className="overflow-hidden rounded-xl bg-white dark:bg-zinc-800">
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className="px-4 py-3">
                    <TextInput
                      placeholder="Name"
                      placeholderTextColor="#9ca3af"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      className="text-base text-zinc-900 dark:text-white"
                      autoCapitalize="words"
                    />
                    {errors.name && (
                      <Text className="mt-1 text-xs text-red-500">
                        {errors.name.message}
                      </Text>
                    )}
                  </View>
                )}
              />
              <Separator />
              <Controller
                control={control}
                name="price"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className="px-4 py-3">
                    <TextInput
                      placeholder="Price"
                      placeholderTextColor="#9ca3af"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      keyboardType="decimal-pad"
                      className="text-base text-zinc-900 dark:text-white"
                    />
                    {errors.price && (
                      <Text className="mt-1 text-xs text-red-500">
                        {errors.price.message}
                      </Text>
                    )}
                  </View>
                )}
              />
            </View>
          </View>

          {/* Subscription Start Section */}
          <View className="mb-6">
            <SectionHeader title="Subscription Start" />
            <View className="overflow-hidden rounded-xl bg-white dark:bg-zinc-800">
              <View className="px-4 py-3">
                <Controller
                  control={control}
                  name="billingCycleIndex"
                  render={({ field: { onChange, value } }) => (
                    <Host matchContents>
                      <Picker
                        options={["Weekly", "Monthly", "Yearly"]}
                        selectedIndex={value ?? 0}
                        onOptionSelected={({ nativeEvent: { index } }) =>
                          onChange(index)
                        }
                        variant="segmented"
                      />
                    </Host>
                  )}
                />
              </View>
              <Separator />
              <Controller
                control={control}
                name="subscribedAt"
                render={({ field: { onChange, value } }) => (
                  <View className="flex-row items-center justify-between px-4 py-3">
                    <Text className="text-base text-zinc-900 dark:text-white">
                      Subscribed since
                    </Text>
                    <Host matchContents>
                      <DateTimePicker
                        onDateSelected={(date) => {
                          onChange(date);
                        }}
                        displayedComponents="date"
                        initialDate={value.toISOString()}
                        variant="compact"
                      />
                    </Host>
                  </View>
                )}
              />
            </View>
          </View>

          {/* Additional Info Section */}
          <View className="mb-6">
            <SectionHeader title="Additional Info" />
            <View className="overflow-hidden rounded-xl bg-white dark:bg-zinc-800">
              <Controller
                control={control}
                name="url"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className="px-4 py-3">
                    <TextInput
                      placeholder="URL (optional)"
                      placeholderTextColor="#9ca3af"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      keyboardType="url"
                      autoCapitalize="none"
                      autoCorrect={false}
                      className="text-base text-zinc-900 dark:text-white"
                    />
                  </View>
                )}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
