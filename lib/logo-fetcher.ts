import { getLogoUri } from "@/lib/logo-cache";

/**
 * Fetches a company logo from logo.dev service and stores it in the file system.
 *
 * @param domain - The domain of the company (e.g., "netflix.com")
 * @returns File URI string or null if fetch fails
 */
export const fetchLogoFileUri = async (
  domain: string
): Promise<string | null> => {
  return getLogoUri(domain);
};
