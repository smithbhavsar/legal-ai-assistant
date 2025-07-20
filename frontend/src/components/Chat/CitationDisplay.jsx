import React from 'react';

const CitationDisplay = ({ citations = [] }) => {
  if (!citations || citations.length === 0) {
    return null;
  }

  const getCitationIcon = (type) => {
    switch (type) {
      case 'url':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        );
      case 'statute':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case 'case':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const handleCitationClick = (citation) => {
    if (citation.type === 'url' && citation.source.startsWith('http')) {
      window.open(citation.source, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
      <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h3a1 1 0 011 1v1a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1h3z" />
        </svg>
        Sources & Citations
      </h5>
      <div className="space-y-2">
        {citations.map((citation, index) => (
          <div
            key={index}
            className={`flex items-start space-x-2 p-2 rounded text-sm ${
              citation.type === 'url' 
                ? 'bg-blue-50 border border-blue-200 cursor-pointer hover:bg-blue-100' 
                : 'bg-white border border-gray-200'
            }`}
            onClick={() => handleCitationClick(citation)}
          >
            <div className="flex-shrink-0 mt-0.5 text-gray-500">
              {getCitationIcon(citation.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                {citation.type}
              </div>
              <div className="text-gray-700 break-words">
                {citation.source}
              </div>
            </div>
            {citation.type === 'url' && (
              <div className="flex-shrink-0">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CitationDisplay;
