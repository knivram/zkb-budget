import type { LucideIcon } from 'lucide-react-native';

type BaseProps = {
  domain?: string | null;
  size?: number;
  className?: string;
};

export type DomainLogoProps = BaseProps &
  (
    | {
        /** Lucide icon to show when no domain logo is available */
        fallbackIcon: LucideIcon;
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
