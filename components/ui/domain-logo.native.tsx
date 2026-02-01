import { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';

import { Host, Image as SwiftImage } from '@expo/ui/swift-ui';

import { getLogoUri } from '@/lib/logo-cache';
import { cn } from '@/lib/utils';

import { DomainLogoProps } from './domain-logo';

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

  const renderFallback = () => {
    if (fallbackIcon) {
      return (
        <Host matchContents>
          <SwiftImage systemName={fallbackIcon} size={size / 2} />
        </Host>
      );
    }
    const fallbackLetter = name.trim().charAt(0).toUpperCase() || '?';
    return <Text className="text-lg text-slate-400 dark:text-slate-500">{fallbackLetter}</Text>;
  };

  return (
    <View
      className={cn(
        'items-center justify-center overflow-hidden rounded-2xl border border-transparent',
        !logoUri
          ? 'border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800'
          : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900',
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
