import React from 'react';
import { LOSCategory } from '../../models';

const LOS_STYLES: Record<LOSCategory, string> = {
  '> 12h': 'bg-[#7C3AED] text-white',
  '4 - 12h': 'bg-[#DA291C] text-white',
  '3 - 4h': 'bg-[#ED8B00] text-slate-900',
  '2 - 3h': 'bg-[#FFB81C] text-slate-900',
  '< 2h': 'bg-[#007F3B] text-white',
};

const formatHours = (h: number): string => {
  const whole = Math.floor(h);
  const mins = Math.round((h - whole) * 60);
  return `${whole}h ${mins.toString().padStart(2, '0')}m`;
};

export const LosBadge: React.FC<{ category: LOSCategory; hours?: number }> = ({ category, hours }) => (
  <span
    title={hours !== undefined ? `${formatHours(hours)} in department` : undefined}
    className={`inline-block min-w-[54px] text-center px-2 py-0.5 rounded text-[11px] font-bold ${LOS_STYLES[category]}`}
  >
    {category}
  </span>
);
