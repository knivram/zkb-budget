// Web stub - no file system caching, just return URL directly
export const getLogoUri = async (
  domain?: string | null
): Promise<string | null> => {
  if (!domain?.trim()) return null;
  return `https://img.logo.dev/${domain}?token=${process.env.EXPO_PUBLIC_LOGO_DEV_KEY}`;
};
