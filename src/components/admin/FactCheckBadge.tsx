'use client';

import React from 'react';
import { CheckCircle, AlertTriangle, AlertCircle, XCircle, Minus } from 'lucide-react';
import { FactCheckStatus, FACT_CHECK_STATUS_CONFIG } from '@/types/factCheck';

interface FactCheckBadgeProps {
  status: FactCheckStatus | undefined;
  confidence?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
}

const FactCheckBadge: React.FC<FactCheckBadgeProps> = ({
  status,
  confidence,
  showLabel = true,
  size = 'md',
  onClick,
}) => {
  const effectiveStatus = status || 'not_checked';
  const config = FACT_CHECK_STATUS_CONFIG[effectiveStatus];

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  const IconComponent = {
    passed: CheckCircle,
    review_recommended: AlertTriangle,
    caution: AlertCircle,
    high_risk: XCircle,
    not_checked: Minus,
  }[effectiveStatus];

  const iconColors = {
    passed: 'text-green-600',
    review_recommended: 'text-yellow-600',
    caution: 'text-orange-600',
    high_risk: 'text-red-600',
    not_checked: 'text-gray-400',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`
        inline-flex items-center rounded-full font-medium
        ${config.bgColor} ${config.color}
        ${sizeClasses[size]}
        ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'cursor-default'}
      `}
      title={`${config.label}${confidence !== undefined ? ` (${confidence}% confidence)` : ''}`}
    >
      <IconComponent size={iconSizes[size]} className={iconColors[effectiveStatus]} />
      {showLabel && (
        <span>{config.label}</span>
      )}
      {confidence !== undefined && size !== 'sm' && (
        <span className="opacity-70">({confidence}%)</span>
      )}
    </button>
  );
};

export default FactCheckBadge;
