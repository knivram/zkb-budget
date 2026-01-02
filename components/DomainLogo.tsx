import { getLogoUri } from "@/lib/logo-cache";
import { cn } from "@/lib/utils";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

type DomainLogoProps = {
  domain?: string | null;
  name: string;
  size?: number;
  className?: string;
};

export default function DomainLogo({
  domain,
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
  const fallbackLetter = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <View
      className={cn(
        "items-center justify-center overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800",
        className
      )}
      style={dimensionStyle}
    >
      {logoUri ? (
        <Image
          source={{ uri: logoUri }}
          style={dimensionStyle}
          contentFit="cover"
        />
      ) : (
        <Text className="text-lg text-zinc-400 dark:text-zinc-500">
          {fallbackLetter}
        </Text>
      )}
    </View>
  );
}
