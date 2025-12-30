import { Input, Label } from "@/components/ui";
import { db } from "@/db/client";
import { BILLING_CYCLES, subscriptions } from "@/db/schema";
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
              variant: "prominent",
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
        className="flex-1"
      >
        <ScrollView
          className="flex-1 bg-white dark:bg-zinc-900"
          contentContainerClassName="px-4 pb-8 pt-6"
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
        >
          <View className="mb-8 items-center">
            <Controller
              control={control}
              name="price"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className="flex items-center">
                  <View className="flex-row items-baseline">
                    <Text className="text-4xl font-light leading-tight text-zinc-400 dark:text-zinc-500">
                      CHF
                    </Text>
                    <TextInput
                      placeholder="0.00"
                      placeholderTextColor="#d4d4d8"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      keyboardType="decimal-pad"
                      className="ml-2 min-w-[120px] text-5xl font-semibold leading-tight text-zinc-900 dark:text-white"
                      textAlign="left"
                      textAlignVertical="center"
                    />
                  </View>
                  <Text className="mt-1 text-sm leading-5 text-zinc-400">
                    per month
                  </Text>
                  {errors.price && (
                    <Text className="mt-2 text-xs leading-4 text-red-500">
                      {errors.price.message}
                    </Text>
                  )}
                </View>
              )}
            />
          </View>

          <View className="mb-4">
            <Label>Name</Label>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  placeholder="e.g. Netflix"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="words"
                />
              )}
            />
            {errors.name && (
              <Text className="mt-1 text-xs leading-4 text-red-500">
                {errors.name.message}
              </Text>
            )}
          </View>

          <View className="mb-4">
            <Label>Billing Cycle</Label>
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

          <View className="mb-4 flex-1">
            <Label>Subscribed Since</Label>
            <Controller
              control={control}
              name="subscribedAt"
              render={({ field: { onChange, value } }) => (
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
              )}
            />
          </View>

          <View className="mb-4">
            <Label>Provider Domain (optional)</Label>
            <Controller
              control={control}
              name="url"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  placeholder="e.g. netflix.com"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="url"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              )}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
