import React from 'react';
import ConfidenceBadge from './ConfidenceBadge';

const EditableField = ({ label, value, onChange, confidence, type = 'text', placeholder = '' }) => {
  const confidenceColor = confidence < 60 ? 'red' : confidence < 80 ? 'yellow' : 'green';

  const inputClasses = {
    text: 'border-gray-300 bg-white',
    number: 'border-gray-300 bg-white',
    date: 'border-gray-300 bg-white',
    email: 'border-gray-300 bg-white'
  };

  const containerClasses = {
    text: 'border-red-300 bg-red-50',
    number: 'border-yellow-300 bg-yellow-50',
    date: 'border-yellow-300 bg-yellow-50',
    email: 'border-red-300 bg-red-50'
  };

  const isLowConfidence = confidence < 60;

  return (
    <div className={`flex flex-col gap-2 ${isLowConfidence ? 'p-3 bg-red-50 rounded-lg border border-red-200' : ''}`}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {confidence !== undefined && (
          <ConfidenceBadge score={confidence} size="sm" />
        )}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
          isLowConfidence ? containerClasses[type] : inputClasses[type]
        }`}
      />
      {isLowConfidence && (
        <p className="text-xs text-red-600">
          ⚠️ Low confidence extraction. Please review and edit this field carefully.
        </p>
      )}
    </div>
  );
};

export default EditableField;