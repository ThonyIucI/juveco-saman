import type { SVGProps } from "react";

/** Ícono de Facebook. lucide no trae íconos de marcas: va con trazo y toma el color del texto. */
export default function FacebookIcon({ strokeWidth = 1.75, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M14 22V13.5H17L17.5 10H14V8C14 7 14.5 6 16 6H17.6V3.1C17.3 3.05 16.2 3 15 3C12.4 3 10.5 4.6 10.5 7.5V10H7.5V13.5H10.5V22"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
