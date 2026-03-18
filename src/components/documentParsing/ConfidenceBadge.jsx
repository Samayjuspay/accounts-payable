import React from 'react';
import { getConfidenceColor, getConfidenceLabel } from '../../types/documentParsing.types';

const ConfidenceBadge = ({ score, showLabel = true, size = 'sm' }) => {
  const color = getConfidenceColor(score);
  const label = getConfidenceLabel(score);

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  const colorClasses = {
    green: 'bg-green-100 text-green-700 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    red: 'bg-red-100 text-red-700 border-red-200'
  };

  const icon = score < 60 ? '⚠️' : '';

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${sizeClasses[size]} ${colorClasses[color]}`}
      title={`AI is ${score}% confident about this field`}
    >
      {icon}
      {showLabel && <span>{score}% confident</span>}
    </span>
  );
};

export default ConfidenceBadge;