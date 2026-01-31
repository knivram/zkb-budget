import { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { getLogoUri } from '@/lib/logo-cache';
import { cn } from '@/lib/utils';

type BaseProps = {
  domain?: string | null;
  size?: number;
  className?: string;
};

export type DomainLogoProps = BaseProps &
  (
    | {
        /** Icon to show when no domain logo is available */
        fallbackIcon: LucideIcon;
        name?: never;
      }
    | {
        fallbackIcon?: never;
        /** Text to extract first letter from */
        name: string;
      }
  );

export default function DomainLogo({
  domain,
  fallbackIcon,
  name,
  size = 48,
  className,
}: DomainLogoProps) {
  const [logoUri, setLogoUri] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadLogo = async () => {
      if (!domain?.trim()) {
        if (isActive) setLogoUri(null);
        return;
      }

      const uri = await getLogoUri(domain);
      if (isActive) setLogoUri(uri);
    };

    loadLogo();

    return () => {
      isActive = false;
    };
  }, [domain]);

  const dimensionStyle = { width: size, height: size };
  const Icon = fallbackIcon;

  const renderFallback = () => {
    if (Icon) {
      return <Icon size={size / 2} color="#64748b" />;
    }
    const fallbackLetter = name.trim().charAt(0).toUpperCase() || '?';
    return <Text className="text-lg text-slate-400 dark:text-slate-500">{fallbackLetter}</Text>;
  };

  return (
    <View
      className={cn(
        'items-center justify-center overflow-hidden rounded-2xl border border-slate-200/70 bg-white dark:border-slate-800 dark:bg-slate-900',
        className
      )}
      style={dimensionStyle}
    >
      {logoUri ? (
        <Image source={{ uri: logoUri }} style={dimensionStyle} resizeMode="cover" />
      ) : (
        renderFallback()
      )}
    </View>
  );
}
