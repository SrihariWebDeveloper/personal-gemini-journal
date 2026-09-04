import React from 'react';
import {
  Smile,
  Sparkles,
  Sun,
  Cloud,
  Heart,
  Zap,
  Coffee,
  Compass,
  CheckCircle2,
} from 'lucide-react';

interface MoodBadgeProps {
  mood: string;
  size?: 'sm' | 'md' | 'lg';
}

export const MoodBadge: React.FC<MoodBadgeProps> = ({ mood, size = 'md' }) => {
  const normalized = (mood || '').toLowerCase().trim();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let IconComponent = Compass;

  if (normalized.includes('optimist') || normalized.includes('hope')) {
    colorClasses = 'bg-amber-50 text-amber-800 border-amber-200/80';
    IconComponent = Sun;
  } else if (normalized.includes('calm') || normalized.includes('peace') || normalized.includes('seren')) {
    colorClasses = 'bg-teal-50 text-teal-800 border-teal-200/80';
    IconComponent = Cloud;
  } else if (normalized.includes('grateful') || normalized.includes('gratitude') || normalized.includes('love')) {
    colorClasses = 'bg-rose-50 text-rose-800 border-rose-200/80';
    IconComponent = Heart;
  } else if (normalized.includes('reflect') || normalized.includes('thought') || normalized.includes('mindful')) {
    colorClasses = 'bg-sky-50 text-sky-800 border-sky-200/80';
    IconComponent = Sparkles;
  } else if (normalized.includes('joy') || normalized.includes('happ')) {
    colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200/80';
    IconComponent = Smile;
  } else if (normalized.includes('anxious') || normalized.includes('stress') || normalized.includes('overwhelm') || normalized.includes('worry')) {
    colorClasses = 'bg-purple-50 text-purple-800 border-purple-200/80';
    IconComponent = Zap;
  } else if (normalized.includes('tire') || normalized.includes('exhaust') || normalized.includes('drain')) {
    colorClasses = 'bg-orange-50 text-orange-800 border-orange-200/80';
    IconComponent = Coffee;
  } else if (normalized.includes('determin') || normalized.includes('focus') || normalized.includes('empower')) {
    colorClasses = 'bg-indigo-50 text-indigo-800 border-indigo-200/80';
    IconComponent = CheckCircle2;
  }

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-0.5 gap-1',
    md: 'text-xs px-3 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  return (
    <span
      id={`mood-badge-${normalized.replace(/\s+/g, '-')}`}
      className={`inline-flex items-center font-medium rounded-full border ${colorClasses} ${sizeClasses} transition-colors whitespace-nowrap`}
    >
      <IconComponent className={iconSizes} />
      <span>{mood || 'Reflective'}</span>
    </span>
  );
};
