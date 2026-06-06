import React from 'react';

// General Navigation & Interface Icons
export const SearchIcon = ({ className = "w-5 h-5", size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className} width={size} height={size}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.602 10.602z" />
  </svg>
);

export const ProfileIcon = ({ className = "w-6 h-6", size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className={className} width={size} height={size}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export const CartIcon = ({ className = "w-6 h-6", size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className={className} width={size} height={size}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
  </svg>
);

export const PinIcon = ({ className = "w-4 h-4", size = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className} width={size} height={size}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
);

export const StarIcon = ({ className = "w-4 h-4 text-amber-500 fill-current", size = 16, fill = "currentColor", color }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={fill} className={className} width={size} height={size} style={color ? { color } : {}}>
    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
  </svg>
);

export const StarOutlineIcon = ({ className = "w-4 h-4 text-gray-300", size = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} width={size} height={size}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499c.158-.343.644-.343.801 0l1.9 3.931a.75.75 0 00.565.41l4.331.422c.381.037.533.504.252.767l-3.232 3.149a.75.75 0 00-.214.659l.86 4.29a.75.75 0 01-1.103.801l-3.793-2.235a.75.75 0 00-.707 0l-3.793 2.235a.75.75 0 01-1.103-.801l.86-4.29a.75.75 0 00-.214-.659l-3.232-3.149c-.281-.263-.129-.73.252-.767l4.331-.422a.75.75 0 00.565-.41l1.9-3.93z" />
  </svg>
);

export const CloseIcon = ({ className = "w-6 h-6", size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className} width={size} height={size}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export const TrashIcon = ({ className = "w-5 h-5", size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} width={size} height={size}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

export const CaretDownIcon = ({ className = "w-4 h-4", size = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className} width={size} height={size}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

export const FilterIcon = ({ className = "w-5 h-5", size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className} width={size} height={size}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
  </svg>
);

export const SortIcon = ({ className = "w-5 h-5", size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className} width={size} height={size}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
  </svg>
);

export const ChevronRightIcon = ({ className = "w-5 h-5", size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className} width={size} height={size}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

export const ChevronLeftIcon = ({ className = "w-5 h-5", size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className} width={size} height={size}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

// Specific Category SVG Representations (Premium Custom Line-Art Icons for categories)
export const ChocolatesIcon = ({ className = "", size = 48 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width={size} height={size} className={className}>
    <rect x="14" y="22" width="36" height="34" rx="2" fill="#E2E8F0" stroke="#475569" strokeWidth="3" />
    <path d="M14 36H50M26 22V56M38 22V56" stroke="#475569" strokeWidth="3" />
    <path d="M14 22L20 8H44L50 22" fill="#F43F5E" stroke="#E11D48" strokeWidth="3" strokeLinejoin="round" />
    <circle cx="32" cy="15" r="3" fill="#FFF" />
  </svg>
);

export const DailyUseIcon = ({ className = "", size = 48 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width={size} height={size} className={className}>
    <path d="M22 24V14A6 6 0 0134 14V24" stroke="#475569" strokeWidth="3" fill="none" />
    <rect x="16" y="24" width="32" height="32" rx="4" fill="#E2E8F0" stroke="#475569" strokeWidth="3" />
    <ellipse cx="32" cy="38" rx="8" ry="5" fill="#3B82F6" stroke="#2563EB" strokeWidth="2" />
    <line x1="32" y1="35" x2="32" y2="41" stroke="#FFF" strokeWidth="2" />
    <line x1="29" y1="38" x2="35" y2="38" stroke="#FFF" strokeWidth="2" />
  </svg>
);

export const HomeEssentialsIcon = ({ className = "", size = 48 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width={size} height={size} className={className}>
    <path d="M32 6L8 28H14V56H50V28H56L32 6Z" fill="#E2E8F0" stroke="#475569" strokeWidth="3" strokeLinejoin="round" />
    <rect x="26" y="38" width="12" height="18" fill="#F59E0B" stroke="#D97706" strokeWidth="2" />
    <circle cx="35" cy="47" r="1.5" fill="#FFF" />
  </svg>
);

export const PreservativesIcon = ({ className = "", size = 48 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width={size} height={size} className={className}>
    <rect x="20" y="22" width="24" height="34" rx="3" fill="#E2E8F0" stroke="#475569" strokeWidth="3" />
    <rect x="24" y="14" width="16" height="8" rx="1" fill="#EF4444" stroke="#475569" strokeWidth="3" />
    <line x1="20" y1="36" x2="44" y2="36" stroke="#475569" strokeWidth="3" />
    <line x1="20" y1="46" x2="44" y2="46" stroke="#475569" strokeWidth="3" />
    <circle cx="32" cy="29" r="2.5" fill="#10B981" />
  </svg>
);

export const SweetsIcon = ({ className = "", size = 48 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width={size} height={size} className={className}>
    <path d="M12 40C12 28 20 20 32 20C44 20 52 28 52 40C52 50 44 56 32 56C20 56 12 50 12 40Z" fill="#E2E8F0" stroke="#475569" strokeWidth="3" />
    <ellipse cx="32" cy="48" rx="14" ry="4" fill="#F59E0B" stroke="#D97706" strokeWidth="2" />
    <circle cx="32" cy="28" r="4" fill="#EF4444" />
    <circle cx="24" cy="36" r="3" fill="#10B981" />
    <circle cx="40" cy="36" r="3" fill="#3B82F6" />
  </svg>
);

export const BeveragesIcon = ({ className = "", size = 48 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width={size} height={size} className={className}>
    <path d="M22 56C22 56 18 24 18 16C18 10 26 8 32 8C38 8 46 10 46 16C46 24 42 56 42 56H22Z" fill="#E2E8F0" stroke="#475569" strokeWidth="3" strokeLinejoin="round" />
    <path d="M20 24H44" stroke="#475569" strokeWidth="2" />
    <path d="M22 16H42" stroke="#EF4444" strokeWidth="3" />
    <path d="M32 8V2" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
    <line x1="27" y1="36" x2="37" y2="36" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const GrainsIcon = ({ className = "", size = 48 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width={size} height={size} className={className}>
    <path d="M16 16C16 16 12 36 20 54H44C52 36 48 16 48 16H16Z" fill="#E2E8F0" stroke="#475569" strokeWidth="3" strokeLinejoin="round" />
    <path d="M28 26C30 24 34 24 36 26M24 36C26 34 38 34 40 36M26 46C28 44 36 44 38 46" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <path d="M16 16L32 6L48 16" fill="none" stroke="#475569" strokeWidth="3" strokeLinejoin="round" />
  </svg>
);

export const DairyIcon = ({ className = "", size = 48 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width={size} height={size} className={className}>
    <rect x="18" y="24" width="28" height="32" rx="2" fill="#E2E8F0" stroke="#475569" strokeWidth="3" />
    <path d="M18 24L32 10L46 24" fill="none" stroke="#475569" strokeWidth="3" strokeLinejoin="round" />
    <circle cx="32" cy="38" r="7" fill="#3B82F6" stroke="#2563EB" strokeWidth="2" />
    <path d="M30 35H34V41H30z" fill="#FFF" />
  </svg>
);

export const ShowMoreIcon = ({ className = "", size = 48 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width={size} height={size} className={className}>
    <circle cx="32" cy="32" r="26" fill="#F3F4F6" stroke="#9CA3AF" strokeWidth="3" strokeDasharray="6,4" />
    <path d="M24 32H40M32 24V40" stroke="#4B5563" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

export const PhoneIcon = ({ className = "w-5 h-5", size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className} width={size} height={size}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.802-5.122-4.1-6.924-6.924l1.293-.97a1.242 1.242 0 00.417-1.173L6.012 3.51a1.25 1.25 0 00-1.091-.852H3.57C2.82 2.658 2.25 3.23 2.25 3.98v2.77z" />
  </svg>
);
