import { getLogoUri } from '@/lib/logo-cache';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import type { DomainLogoProps } from './domain-logo';

export default function DomainLogo({
  domain,
  fallbackIcon: FallbackIcon,
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
    if (FallbackIcon) {
      return <FallbackIcon size={size / 2.2} color="#a1a1aa" strokeWidth={1.8} />;
    }
    const fallbackLetter = name.trim().charAt(0).toUpperCase() || '?';
    return (
      <Text
        className="font-semibold text-zinc-400 dark:text-zinc-500"
        style={{ fontSize: size / 2.5 }}
      >
        {fallbackLetter}
      </Text>
    );
  };

  return (
    <View
      className={cn(
        'items-center justify-center overflow-hidden rounded-xl',
        !logoUri ? 'bg-zinc-100 dark:bg-zinc-800' : 'bg-white',
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
