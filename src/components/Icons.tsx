import React from 'react';
import { TravelMode } from '../lib/types';

interface IconProps {
  color?: string;
  size?: number;
  className?: string;
  filled?: boolean;
}

export const TravelModeIcon: React.FC<IconProps & { mode: TravelMode }> = ({
  mode,
  color = '#5f6368',
  size = 18,
  className = '',
}) => {
  switch (mode) {
    case TravelMode.MIX:
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M16 3h5v5" />
          <path d="M4 20L21 3" />
          <path d="M21 16v5h-5" />
          <path d="M15 15l6 6" />
          <path d="M4 4l5 5" />
        </svg>
      );
    case TravelMode.METRO:
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <rect x="4" y="3" width="16" height="15" rx="2" />
          <path d="M4 11h16" />
          <circle cx="8.5" cy="14.5" r="1" fill={color} stroke="none" />
          <circle cx="15.5" cy="14.5" r="1" fill={color} stroke="none" />
          <path d="M8 18l-2 3" />
          <path d="M16 18l2 3" />
        </svg>
      );
    case TravelMode.BUS:
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <rect x="4" y="4" width="16" height="14" rx="2" />
          <path d="M4 11h16" />
          <path d="M7 18v2" />
          <path d="M17 18v2" />
          <circle cx="8" cy="14.5" r="1" fill={color} stroke="none" />
          <circle cx="16" cy="14.5" r="1" fill={color} stroke="none" />
        </svg>
      );
    case TravelMode.TRAIN:
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <rect x="5" y="2" width="14" height="16" rx="2" />
          <path d="M9 2v3h6V2" />
          <path d="M5 10h14" />
          <circle cx="9" cy="14" r="1" fill={color} stroke="none" />
          <circle cx="15" cy="14" r="1" fill={color} stroke="none" />
          <path d="M8 18l-3 4" />
          <path d="M16 18l3 4" />
          <path d="M7 20h10" />
        </svg>
      );
    case TravelMode.FLIGHT:
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
        </svg>
      );
    case TravelMode.CAR:
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M5 11l2-5h10l2 5" />
          <rect x="3" y="11" width="18" height="6" rx="2" />
          <circle cx="7.5" cy="17" r="1.5" fill={color} stroke="none" />
          <circle cx="16.5" cy="17" r="1.5" fill={color} stroke="none" />
        </svg>
      );
    case TravelMode.BIKE:
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <circle cx="6.5" cy="16.5" r="3" />
          <circle cx="17.5" cy="16.5" r="3" />
          <path d="M6.5 16.5L10 9h4l3.5 7.5" />
          <path d="M10 9L8 6h2" />
        </svg>
      );
    case TravelMode.WALK:
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <circle cx="12" cy="5" r="2" fill={color} stroke="none" />
          <path d="M10 9l2-1 3 3-2 4 3 5" />
          <path d="M12 10l-3 3-1 6" />
        </svg>
      );
  }
};

export const SearchIcon: React.FC<IconProps> = ({
  color = '#5f6368',
  size = 20,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="11" cy="11" r="7" />
    <path d="M16.5 16.5L21 21" />
  </svg>
);

export const CloseXIcon: React.FC<IconProps> = ({
  color = '#5f6368',
  size = 20,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18 6L6 18" />
    <path d="M6 6l12 12" />
  </svg>
);

export const SwapArrowsIcon: React.FC<IconProps> = ({
  color = '#5f6368',
  size = 20,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M7 4v16" />
    <path d="M3 8l4-4 4 4" />
    <path d="M17 20V4" />
    <path d="M13 16l4 4 4-4" />
  </svg>
);

export const BackArrowIcon: React.FC<IconProps> = ({
  color = '#5f6368',
  size = 20,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M19 12H5" />
    <path d="M12 19l-7-7 7-7" />
  </svg>
);

export const SendArrowIcon: React.FC<IconProps> = ({
  color = '#ffffff',
  size = 18,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M22 2L11 13" />
    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);

export const TrashDeleteIcon: React.FC<IconProps> = ({
  color = '#5f6368',
  size = 20,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M19 6l-1 14H6L5 6" />
  </svg>
);

export const ClockIcon: React.FC<IconProps> = ({
  color = '#5f6368',
  size = 16,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const BookmarkIcon: React.FC<IconProps> = ({
  color = '#5f6368',
  size = 20,
  filled = false,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? color : 'none'}
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

export const MapPinIcon: React.FC<IconProps> = ({
  color = '#5f6368',
  size = 20,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export const SparkleIcon: React.FC<IconProps> = ({
  color = '#1a73e8',
  size = 20,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z" />
  </svg>
);

export const LocateIcon: React.FC<IconProps> = ({
  color = '#1a73e8',
  size = 22,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="7" />
    <circle cx="12" cy="12" r="2.5" fill={color} stroke="none" />
    <path d="M12 2v3" />
    <path d="M12 19v3" />
    <path d="M2 12h3" />
    <path d="M19 12h3" />
  </svg>
);
