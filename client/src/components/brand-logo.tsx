import type { CSSProperties } from "react";

interface BrandLogoProps {
  alt?: string;
  className?: string;
  sizes?: string;
  loading?: "eager" | "lazy";
  style?: CSSProperties;
}

const publicBase = import.meta.env.BASE_URL ?? "/";
const logoSources = `${publicBase}brand-logo-96.webp 96w, ${publicBase}brand-logo-192.webp 192w`;

export function BrandLogo({
  alt = "Mahakal Sanatan Raksha Foundation logo",
  className = "h-12 w-12",
  sizes = "48px",
  loading = "lazy",
  style,
}: BrandLogoProps) {
  return (
    <img
      src={`${publicBase}brand-logo-96.webp`}
      srcSet={logoSources}
      sizes={sizes}
      width={96}
      height={96}
      alt={alt}
      loading={loading}
      decoding="async"
      className={`shrink-0 object-contain ${className}`}
      style={style}
    />
  );
}