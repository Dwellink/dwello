import { useId } from "react";

interface DwelloLogoProps {
  size?: number;
  className?: string;
}

export default function DwelloLogo({ size = 28, className }: DwelloLogoProps) {
  const id = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g clipPath={`url(#clip-${id})`}>
        <circle cx="10" cy="19" r="1" fill="currentColor" />
        <mask
          id={`mask-${id}`}
          style={{ maskType: "alpha" }}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="24"
          height="24"
        >
          <path
            d="M24 24H15.5996V14.4004H12.5996C10.9202 14.4004 10.0801 14.3999 9.43848 14.7266C8.87399 15.0142 8.41457 15.4736 8.12695 16.0381C7.8 16.6798 7.7998 17.5201 7.7998 19.2002V24H0V0H24V24Z"
            fill="#D9D9D9"
          />
        </mask>
        <g mask={`url(#mask-${id})`}>
          <path
            d="M0 15.9C0 11.4265 3.62649 7.80005 8.1 7.80005H15.9C20.3735 7.80005 24 11.4265 24 15.9C24 20.3736 20.3735 24 15.9 24H8.1C3.62649 24 0 20.3736 0 15.9Z"
            fill="currentColor"
          />
          <path
            d="M15.6 8.39999C15.6 3.7608 19.3608 0 24 0V16.2H15.6V8.39999Z"
            fill="currentColor"
          />
        </g>
      </g>
      <defs>
        <clipPath id={`clip-${id}`}>
          <rect width="24" height="24" fill="currentColor" />
        </clipPath>
      </defs>
    </svg>
  );
}
