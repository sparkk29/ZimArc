import Image from "next/image";

type LogoProps = {
  size?: number;
  className?: string;
  priority?: boolean;
};

export default function Logo({ size = 36, className = "", priority = false }: LogoProps) {
  return (
    <Image
      src="/icons/icon.svg"
      alt="Winter Arc logo"
      width={size}
      height={size}
      priority={priority}
      unoptimized
      className={`shrink-0 drop-shadow-[0_6px_18px_rgba(79,151,181,0.25)] ${className}`}
    />
  );
}
