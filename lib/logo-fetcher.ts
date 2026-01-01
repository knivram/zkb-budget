/**
 * Fetches a company logo from logo.dev service and converts it to Base64.
 * This utility is used when adding subscriptions to fetch their brand logos.
 *
 * @param domain - The domain of the company (e.g., "netflix.com")
 * @returns Base64-encoded image string or null if fetch fails
 */
export const fetchLogoAsBase64 = async (
  domain: string
): Promise<string | null> => {
  try {
    const url = `https://img.logo.dev/${domain}?token=${process.env.EXPO_PUBLIC_LOGO_DEV_KEY}`;
    const response = await fetch(url);
    if (!response.ok) return null;

    // TODO: #5 save logo to file system instead of base64 in DB
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};
