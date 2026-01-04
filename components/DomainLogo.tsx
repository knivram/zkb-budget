import { Image as SwiftImage } from "@expo/ui/swift-ui";

type BaseProps = {
  domain?: string | null;
  size?: number;
  className?: string;
};

export type DomainLogoProps = BaseProps &
  (
    | {
        /** SF Symbol to show when no domain logo is available */
        fallbackIcon: Parameters<typeof SwiftImage>[0]["systemName"];
        name?: never;
      }
    | {
        fallbackIcon?: never;
        /** Text to extract first letter from */
        name: string;
      }
  );

export default function DomainLogo(_: DomainLogoProps) {
  return null;
}
