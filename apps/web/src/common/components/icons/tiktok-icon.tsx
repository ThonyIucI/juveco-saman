import type { SVGProps } from "react";

/** Ícono de TikTok. lucide no trae íconos de marcas: va con trazo y toma el color del texto. */
export default function TikTokIcon({ strokeWidth = 1.75, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M14 3V15.5C14 17.4 12.4 19 10.5 19C8.6 19 7 17.4 7 15.5C7 13.6 8.6 12 10.5 12M14 3C14.4 5.6 16.4 7.6 19 8"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
