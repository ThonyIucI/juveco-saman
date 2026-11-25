import type { SVGProps } from "react";

/** Balón de fútbol. lucide no trae uno: va con trazo y toma el color del texto. */
export default function BallIcon({ strokeWidth = 1.75, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <g stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8.2L15.6 10.8L14.2 15H9.8L8.4 10.8Z" />
        <path d="M12 8.2V3M15.6 10.8L20.5 9.2M14.2 15L17.2 19.2M9.8 15L6.8 19.2M8.4 10.8L3.5 9.2" />
      </g>
    </svg>
  );
}
