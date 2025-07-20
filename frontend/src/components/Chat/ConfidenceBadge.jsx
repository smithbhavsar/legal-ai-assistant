import React from 'react';

const ConfidenceBadge = ({ confidence }) => {
  if (confidence === null || confidence === undefined) {
    return null;
  }

  const getConfidenceLevel = (score) => {
    if (score >= 0.8) return 'high';
    if (score >= 0.6) return 'medium';
    return 'low';
  };

  const getConfidenceStyle = (level) => {
    switch (level) {
      case 'high':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const level = getConfidenceLevel(confidence);
  const percentage = Math.round(confidence * 100);

  return (
    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getConfidenceStyle(level)}`}>
      <div className="flex items-center space-x-1">
        <div className={`w-2 h-2 rounded-full ${
          level === 'high' ? 'bg-green-500' : 
          level === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
        }`}></div>
        <span className="capitalize">{level}</span>
        <span className="text-gray-600">({percentage}%)</span>
      </div>
    </div>
  );
};

export default ConfidenceBadge;
