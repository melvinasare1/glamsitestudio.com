import Image, { getImageProps } from "next/image";

/**
 * Full-bleed hero photo. When a phone photo is set, small screens use that
 * file and wider screens use the main photo. The browser only downloads the
 * source that matches the viewport.
 */
export function HeroPhoto({
  image,
  mobileImage = "",
  priority = false,
  className = "object-cover",
}: {
  image: string;
  mobileImage?: string;
  priority?: boolean;
  className?: string;
}) {
  const desktop = image || mobileImage;
  const phone = mobileImage || image;
  if (!desktop) return null;

  if (desktop === phone) {
    return <Image src={desktop} alt="" fill priority={priority} sizes="100vw" className={className} />;
  }

  const { props: { srcSet: mobileSrcSet } } = getImageProps({
    alt: "",
    src: phone,
    width: 1080,
    height: 1440,
    sizes: "100vw",
  });
  const { props: desktopProps } = getImageProps({
    alt: "",
    src: desktop,
    width: 1600,
    height: 900,
    sizes: "100vw",
    priority,
  });

  return (
    <picture>
      <source media="(max-width: 767px)" srcSet={mobileSrcSet} sizes="100vw" />
      {/* picture picks one source; next/image cannot switch files by breakpoint. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img {...desktopProps} alt="" className={`absolute inset-0 h-full w-full ${className}`} />
    </picture>
  );
}
