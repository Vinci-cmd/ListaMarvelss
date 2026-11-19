import React from 'react';

export default function PosterEmblem({ type, className = 'w-24 h-24 opacity-20' }) {
  switch (type) {
    case 'arc':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="4">
          <circle cx="50" cy="50" r="40" />
          <circle cx="50" cy="50" r="24" />
          <polygon points="50,22 76,68 24,68" strokeWidth="3" />
        </svg>
      );
    case 'shield':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="4">
          <circle cx="50" cy="50" r="42" />
          <circle cx="50" cy="50" r="30" />
          <circle cx="50" cy="50" r="18" />
          <polygon points="50,34 54,46 66,46 56,53 60,65 50,58 40,65 44,53 34,46 46,46" fill="currentColor" />
        </svg>
      );
    case 'mjolnir':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="4">
          <rect x="22" y="20" width="56" height="32" rx="4" />
          <line x1="50" y1="52" x2="50" y2="88" strokeWidth="6" />
          <path d="M35 20 L65 52 M65 20 L35 52" strokeWidth="2" />
        </svg>
      );
    case 'spider':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="3">
          <circle cx="50" cy="50" r="42" strokeDasharray="6 4" />
          <ellipse cx="50" cy="52" rx="10" ry="15" fill="currentColor" />
          <circle cx="50" cy="33" r="6" fill="currentColor" />
          <path d="M40 44 L18 28 M40 50 L14 50 M40 56 L18 72 M60 44 L82 28 M60 50 L86 50 M60 56 L82 72" />
        </svg>
      );
    case 'mystic':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="3">
          <circle cx="50" cy="50" r="42" />
          <rect x="26" y="26" width="48" height="48" />
          <rect x="26" y="26" width="48" height="48" transform="rotate(45 50 50)" />
          <circle cx="50" cy="50" r="12" />
        </svg>
      );
    case 'gauntlet':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="3.5">
          <path d="M30 85 L30 48 C30 32 70 32 70 48 L70 85 Z" />
          <circle cx="50" cy="55" r="7" fill="currentColor" />
          <circle cx="36" cy="40" r="4" fill="currentColor" />
          <circle cx="45" cy="36" r="4" fill="currentColor" />
          <circle cx="55" cy="36" r="4" fill="currentColor" />
          <circle cx="64" cy="40" r="4" fill="currentColor" />
        </svg>
      );
    case 'multiverse':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M50 88 C50 60 25 55 15 30 M50 88 C50 55 75 50 85 25 M50 88 L50 15 M50 45 C35 35 30 22 35 12 M50 45 C65 35 70 22 65 12" />
          <circle cx="50" cy="50" r="44" strokeDasharray="4 4" />
        </svg>
      );
    case 'f4':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="5">
          <circle cx="50" cy="50" r="42" />
          <path d="M56 76 V26 L30 58 H66" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'gamma':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="3">
          <circle cx="50" cy="50" r="42" />
          <circle cx="50" cy="50" r="10" fill="currentColor" />
          <path d="M50 36 L34 16 A38 38 0 0 1 66 16 Z" fill="currentColor" opacity="0.5" />
          <path d="M38 57 L16 68 A38 38 0 0 1 22 38 Z" fill="currentColor" opacity="0.5" />
          <path d="M62 57 L78 38 A38 38 0 0 1 84 68 Z" fill="currentColor" opacity="0.5" />
        </svg>
      );
    case 'cosmic':
    case 'quantum':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="2.5">
          <ellipse cx="50" cy="50" rx="42" ry="18" transform="rotate(30 50 50)" />
          <ellipse cx="50" cy="50" rx="42" ry="18" transform="rotate(-30 50 50)" />
          <ellipse cx="50" cy="50" rx="42" ry="18" transform="rotate(90 50 50)" />
          <circle cx="50" cy="50" r="8" fill="currentColor" />
        </svg>
      );
    case 'xmen':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="5">
          <circle cx="50" cy="50" r="42" />
          <line x1="25" y1="25" x2="75" y2="75" strokeWidth="9" strokeLinecap="round" />
          <line x1="75" y1="25" x2="25" y2="75" strokeWidth="9" strokeLinecap="round" />
        </svg>
      );
    case 'avengers':
    default:
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="4">
          <circle cx="50" cy="50" r="40" />
          <path d="M32 76 L50 22 L68 76 M38 58 L62 58" strokeWidth="5" />
        </svg>
      );
  }
}
