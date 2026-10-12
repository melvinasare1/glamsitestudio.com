/** Stand-in vehicle drawings. Real seller photography replaces these. */

type PlaceholderProps = { className?: string };

export function HeroVehiclePlaceholder({ className }: PlaceholderProps) {
  return (
    <svg viewBox="0 0 720 420" fill="none" className={className} aria-hidden>
      <ellipse cx="400" cy="372" rx="260" ry="16" fill="#000" opacity="0.5" />
      <circle cx="168" cy="300" r="82" stroke="#D8D4CC" strokeWidth="8" />
      <circle cx="168" cy="300" r="22" fill="#E8622C" />
      <circle cx="168" cy="300" r="10" fill="#141414" />
      <circle cx="552" cy="300" r="86" stroke="#D8D4CC" strokeWidth="8" />
      <circle cx="552" cy="300" r="22" fill="#E8622C" />
      <circle cx="552" cy="300" r="10" fill="#141414" />
      <path
        d="M168 300 262 148h118l48 86 124 12v54H552"
        stroke="#F2EEE6"
        strokeWidth="10"
        strokeLinejoin="round"
      />
      <path d="M380 148 412 88h118" stroke="#F2EEE6" strokeWidth="10" strokeLinejoin="round" />
      <rect x="412" y="70" width="132" height="22" rx="4" fill="#F2EEE6" />
      <path d="M248 148 220 86" stroke="#F2EEE6" strokeWidth="9" strokeLinecap="round" />
      <path d="M196 86h62" stroke="#F2EEE6" strokeWidth="10" strokeLinecap="round" />
      <path d="M292 248h118l32 52H262z" fill="#2C2C2C" />
      <rect x="148" y="252" width="58" height="24" rx="3" fill="#E8622C" />
    </svg>
  );
}

export function MotorbikePlaceholder({ className }: PlaceholderProps) {
  return (
    <svg viewBox="0 0 360 200" fill="none" className={className} aria-hidden>
      <circle cx="72" cy="148" r="38" stroke="#141414" strokeWidth="7" />
      <circle cx="72" cy="148" r="12" fill="#141414" />
      <circle cx="292" cy="148" r="40" stroke="#141414" strokeWidth="7" />
      <circle cx="292" cy="148" r="12" fill="#141414" />
      <path d="M72 148 118 72h62l28 46 84 8v22" stroke="#141414" strokeWidth="6" strokeLinejoin="round" />
      <path d="M180 72 198 38h58" stroke="#141414" strokeWidth="6" strokeLinejoin="round" />
      <rect x="198" y="28" width="68" height="12" rx="2" fill="#141414" />
      <path d="M108 72 90 40" stroke="#141414" strokeWidth="6" strokeLinecap="round" />
      <path d="M74 40h40" stroke="#141414" strokeWidth="6" strokeLinecap="round" />
      <path d="M138 122h78l18 26H122z" fill="#141414" />
      <path d="M248 80c18 4 28 18 32 40" stroke="#141414" strokeWidth="5" />
    </svg>
  );
}

export function BicyclePlaceholder({ className }: PlaceholderProps) {
  return (
    <svg viewBox="0 0 360 200" fill="none" className={className} aria-hidden>
      <circle cx="80" cy="142" r="42" stroke="#141414" strokeWidth="6" />
      <circle cx="280" cy="142" r="42" stroke="#141414" strokeWidth="6" />
      <path
        d="M80 142h86l58-70h56M166 142 224 72M166 142h50M224 72 204 42"
        stroke="#141414"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <path d="M188 42h46" stroke="#141414" strokeWidth="6" strokeLinecap="round" />
      <circle cx="166" cy="142" r="7" fill="#141414" />
    </svg>
  );
}

export function MopedPlaceholder({ className }: PlaceholderProps) {
  return (
    <svg viewBox="0 0 360 200" fill="none" className={className} aria-hidden>
      <circle cx="86" cy="154" r="28" stroke="#141414" strokeWidth="6" />
      <circle cx="86" cy="154" r="8" fill="#141414" />
      <circle cx="284" cy="154" r="32" stroke="#141414" strokeWidth="6" />
      <circle cx="284" cy="154" r="8" fill="#141414" />
      <path d="M86 154h78l12-40h76l32 40" stroke="#141414" strokeWidth="6" strokeLinejoin="round" />
      <rect x="122" y="122" width="62" height="32" rx="4" fill="#141414" />
      <path d="M176 114 196 58h66" stroke="#141414" strokeWidth="6" strokeLinejoin="round" />
      <rect x="196" y="48" width="76" height="12" rx="2" fill="#141414" />
      <path d="M252 114v40" stroke="#141414" strokeWidth="6" />
      <ellipse cx="154" cy="78" rx="22" ry="10" stroke="#141414" strokeWidth="5" />
    </svg>
  );
}

export function PromoVehiclePlaceholder({ className }: PlaceholderProps) {
  return (
    <svg viewBox="0 0 640 360" fill="none" className={className} aria-hidden>
      <ellipse cx="340" cy="328" rx="230" ry="14" fill="#000" opacity="0.45" />
      <circle cx="128" cy="248" r="72" stroke="#E8E2D8" strokeWidth="8" />
      <circle cx="128" cy="248" r="18" fill="#E8622C" />
      <circle cx="488" cy="248" r="76" stroke="#E8E2D8" strokeWidth="8" />
      <circle cx="488" cy="248" r="18" fill="#E8622C" />
      <path
        d="M128 248 214 112h108l42 78 124 10v48"
        stroke="#F4EFE6"
        strokeWidth="9"
        strokeLinejoin="round"
      />
      <path d="M322 112 352 58h108" stroke="#F4EFE6" strokeWidth="9" strokeLinejoin="round" />
      <rect x="352" y="42" width="122" height="20" rx="3" fill="#F4EFE6" />
      <path d="M198 112 172 58" stroke="#F4EFE6" strokeWidth="8" strokeLinecap="round" />
      <path d="M148 58h56" stroke="#F4EFE6" strokeWidth="9" strokeLinecap="round" />
      <path d="M248 210h108l28 48H218z" fill="#2A221C" />
      <rect x="108" y="210" width="52" height="22" rx="3" fill="#E8622C" />
    </svg>
  );
}

export function HelmetPlaceholder({ className }: PlaceholderProps) {
  return (
    <svg viewBox="0 0 200 140" fill="none" className={className} aria-hidden>
      <path d="M28 92c8-48 48-72 72-72s64 24 72 72H28Z" fill="#C45B8A" />
      <path d="M40 92c6-28 28-44 60-44s54 16 60 44" stroke="#141414" strokeWidth="3" opacity="0.2" />
      <path d="M36 92h128v10c0 8-8 14-18 14H54c-10 0-18-6-18-14V92Z" fill="#2A2A2A" />
      <path d="M52 78h96" stroke="#F7F5F0" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

export function GlovesPlaceholder({ className }: PlaceholderProps) {
  return (
    <svg viewBox="0 0 200 140" fill="none" className={className} aria-hidden>
      <path d="M78 118V58c0-10 8-18 18-18h8c10 0 18 8 18 18v20" fill="#1A1A1A" />
      <path d="M122 78V48c0-8 6-14 14-14h4c8 0 14 6 14 14v36" fill="#1A1A1A" />
      <path d="M70 118V70c0-8-6-14-14-14h-4c-8 0-14 6-14 14v28" fill="#1A1A1A" />
      <path d="M58 118h78c10 0 18 8 18 18v4H40v-4c0-10 8-18 18-18Z" fill="#2C2C2C" />
      <rect x="70" y="100" width="54" height="10" rx="2" fill="#E8622C" />
    </svg>
  );
}

export function BagPlaceholder({ className }: PlaceholderProps) {
  return (
    <svg viewBox="0 0 200 140" fill="none" className={className} aria-hidden>
      <path d="M48 58h104l12 62H36L48 58Z" fill="#C0392B" />
      <path d="M70 58V42c0-12 10-20 30-20s30 8 30 20v16" stroke="#141414" strokeWidth="6" />
      <rect x="86" y="78" width="28" height="18" rx="3" fill="#F7F5F0" opacity="0.35" />
    </svg>
  );
}

export function RotorPlaceholder({ className }: PlaceholderProps) {
  return (
    <svg viewBox="0 0 200 140" fill="none" className={className} aria-hidden>
      <circle cx="100" cy="72" r="48" stroke="#3A3A3A" strokeWidth="10" />
      <circle cx="100" cy="72" r="14" fill="#3A3A3A" />
      {[0, 45, 90, 135].map((deg) => (
        <circle
          key={deg}
          cx={100 + Math.cos((deg * Math.PI) / 180) * 30}
          cy={72 + Math.sin((deg * Math.PI) / 180) * 30}
          r="6"
          fill="#EDEDED"
        />
      ))}
    </svg>
  );
}

export function LightPlaceholder({ className }: PlaceholderProps) {
  return (
    <svg viewBox="0 0 200 140" fill="none" className={className} aria-hidden>
      <rect x="78" y="38" width="44" height="52" rx="8" fill="#2A2A2A" />
      <circle cx="100" cy="64" r="16" fill="#F4C430" />
      <circle cx="100" cy="64" r="8" fill="#F7F5F0" />
      <path d="M86 90h28v18H86z" fill="#1A1A1A" />
      <path d="M58 56h12M130 56h12M52 72h14M134 72h14" stroke="#F4C430" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function BootsPlaceholder({ className }: PlaceholderProps) {
  return (
    <svg viewBox="0 0 200 140" fill="none" className={className} aria-hidden>
      <path d="M62 38h40v48H78c-18 0-32 10-40 22h-8V60c0-12 10-22 32-22Z" fill="#1A1A1A" />
      <path d="M30 108h118c8 0 14 6 16 14H28c0-8 2-14 2-14Z" fill="#2C2C2C" />
      <path d="M70 50h24" stroke="#E8622C" strokeWidth="3" strokeLinecap="round" />
      <path d="M70 62h20" stroke="#E8622C" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function EbikePlaceholder({ className }: PlaceholderProps) {
  return (
    <svg viewBox="0 0 640 360" fill="none" className={className} aria-hidden>
      <ellipse cx="340" cy="328" rx="230" ry="14" fill="#000" opacity="0.45" />
      <circle cx="140" cy="248" r="72" stroke="#E8E2D8" strokeWidth="8" />
      <circle cx="140" cy="248" r="18" fill="#E8622C" />
      <circle cx="500" cy="248" r="76" stroke="#E8E2D8" strokeWidth="8" />
      <circle cx="500" cy="248" r="18" fill="#E8622C" />
      <path
        d="M140 248h148l88-110h86M288 248 376 138M288 248h78M376 138 348 90"
        stroke="#F4EFE6"
        strokeWidth="9"
        strokeLinejoin="round"
      />
      <path d="M326 90h78" stroke="#F4EFE6" strokeWidth="9" strokeLinecap="round" />
      <rect x="236" y="186" width="78" height="30" rx="6" fill="#E8622C" />
      <circle cx="288" cy="248" r="10" fill="#F4EFE6" />
    </svg>
  );
}

export function ScooterPlaceholder({ className }: PlaceholderProps) {
  return (
    <svg viewBox="0 0 360 200" fill="none" className={className} aria-hidden>
      <circle cx="90" cy="156" r="26" stroke="#141414" strokeWidth="6" />
      <circle cx="90" cy="156" r="7" fill="#141414" />
      <circle cx="286" cy="156" r="30" stroke="#141414" strokeWidth="6" />
      <circle cx="286" cy="156" r="7" fill="#141414" />
      <path
        d="M90 156h92c14 0 22-12 22-28V88h62l20 68"
        stroke="#141414"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <path
        d="M204 88c0-22 12-42 42-42h28v28H230c-10 0-16 8-16 16"
        fill="#141414"
      />
      <rect x="154" y="64" width="52" height="32" rx="10" fill="#141414" />
      <path d="M118 132h86" stroke="#141414" strokeWidth="10" strokeLinecap="round" />
    </svg>
  );
}
