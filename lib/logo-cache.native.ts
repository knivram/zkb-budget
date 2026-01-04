import { Directory, File, Paths } from "expo-file-system";
import { fetch } from "expo/fetch";

const logosDir = new Directory(Paths.document, "logos");

const normalizeDomainToFilename = (domain: string): string => {
  const safeDomain = domain.replace(/[^a-z0-9.-]/g, "_");
  return `${safeDomain}.png`;
};

const fetchAndCacheLogo = async (
  file: File,
  domain: string
): Promise<string | null> => {
  try {
    const url = `https://img.logo.dev/${domain}?token=${process.env.EXPO_PUBLIC_LOGO_DEV_KEY}`;
    const response = await fetch(url);

    if (!response.ok) return null;

    if (!logosDir.exists) {
      logosDir.create();
    }

    file.write(await response.bytes());
    return file.uri;
  } catch {
    return null;
  }
};

export const getLogoUri = async (
  domain?: string | null
): Promise<string | null> => {
  if (!domain?.trim()) return null;

  const file = new File(logosDir, normalizeDomainToFilename(domain));

  if (file.exists) return file.uri;
  return fetchAndCacheLogo(file, domain);
};
