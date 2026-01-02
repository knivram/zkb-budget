import * as FileSystem from "expo-file-system";

const LOGO_CACHE_DIR = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;

const extractDomain = (domain: string): string => {
  const trimmed = domain.trim().toLowerCase();
  const withoutProtocol = trimmed.replace(/^https?:\/\//, "");
  return withoutProtocol.split("/")[0];
};

export const normalizeDomainToFilename = (domain: string): string => {
  const safeDomain = extractDomain(domain).replace(/[^a-z0-9.-]/g, "_");
  return `${safeDomain}.png`;
};

const getLogoFileUri = (domain: string): string | null => {
  if (!LOGO_CACHE_DIR) return null;
  return `${LOGO_CACHE_DIR}logos/${normalizeDomainToFilename(domain)}`;
};

const ensureLogoCacheDir = async (): Promise<void> => {
  if (!LOGO_CACHE_DIR) return;

  const info = await FileSystem.getInfoAsync(`${LOGO_CACHE_DIR}logos/`);
  if (info.exists) return;

  await FileSystem.makeDirectoryAsync(`${LOGO_CACHE_DIR}logos/`, {
    intermediates: true,
  });
};

export const getCachedLogoUri = async (
  domain?: string | null
): Promise<string | null> => {
  if (!domain?.trim()) return null;
  const fileUri = getLogoFileUri(domain);
  if (!fileUri) return null;
  const info = await FileSystem.getInfoAsync(fileUri);
  return info.exists ? fileUri : null;
};

export const fetchAndCacheLogo = async (
  domain?: string | null
): Promise<string | null> => {
  if (!domain?.trim()) return null;
  const cleanedDomain = extractDomain(domain);
  if (!cleanedDomain) return null;

  try {
    await ensureLogoCacheDir();
    const fileUri = getLogoFileUri(cleanedDomain);
    if (!fileUri) return null;
    const url = `https://img.logo.dev/${cleanedDomain}?token=${process.env.EXPO_PUBLIC_LOGO_DEV_KEY}`;
    const result = await FileSystem.downloadAsync(url, fileUri);

    if (result.status !== 200) return null;
    return fileUri;
  } catch {
    return null;
  }
};

export const getLogoUri = async (
  domain?: string | null
): Promise<string | null> => {
  if (!domain?.trim()) return null;

  const cached = await getCachedLogoUri(domain);
  if (cached) return cached;

  return fetchAndCacheLogo(domain);
};
