import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import CitationDisplay from './CitationDisplay';
import ConfidenceBadge from './ConfidenceBadge';

const DualPaneChat = ({ messages, loading }) => {
  const leftPaneRef = useRef(null);
  const rightPaneRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (leftPaneRef.current) {
      leftPaneRef.current.scrollTop = leftPaneRef.current.scrollHeight;
    }
    if (rightPaneRef.current) {
      rightPaneRef.current.scrollTop = rightPaneRef.current.scrollHeight;
    }
  }, [messages]);

  // Separate messages by type
  const userMessages = messages.filter(msg => msg.type === 'user');
  const researchMessages = messages.filter(msg => msg.type === 'research_ai');
  const guidanceMessages = messages.filter(msg => msg.type === 'guidance_ai');

  const renderMessagePair = (userMsg, researchMsg, guidanceMsg, index) => (
    <div key={userMsg?.id || index} className="mb-6">
      {/* User Message (shown in both panes) */}
      {userMsg && (
        <div className="mb-4 px-4">
          <MessageBubble message={userMsg} />
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-4">
        {/* Research AI Response */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-blue-900 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Research AI
            </h4>
            {researchMsg && <ConfidenceBadge confidence={researchMsg.confidence} />}
          </div>
          
          {researchMsg ? (
            <>
              <div className="text-gray-700 whitespace-pre-wrap mb-3">
                {researchMsg.content}
              </div>
              {researchMsg.citations && researchMsg.citations.length > 0 && (
                <CitationDisplay citations={researchMsg.citations} />
              )}
              {researchMsg.processingTime && (
                <div className="text-xs text-gray-500 mt-2">
                  Processing time: {researchMsg.processingTime}ms
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="spinner w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <span className="ml-2 text-gray-600">Researching...</span>
            </div>
          )}
        </div>

        {/* Guidance AI Response */}
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-purple-900 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Guidance AI
            </h4>
            {guidanceMsg && <ConfidenceBadge confidence={guidanceMsg.confidence} />}
          </div>
          
          {guidanceMsg ? (
            <>
              <div className="text-gray-700 whitespace-pre-wrap mb-3">
                {guidanceMsg.content}
              </div>
              {guidanceMsg.citations && guidanceMsg.citations.length > 0 && (
                <CitationDisplay citations={guidanceMsg.citations} />
              )}
              {guidanceMsg.processingTime && (
                <div className="text-xs text-gray-500 mt-2">
                  Processing time: {guidanceMsg.processingTime}ms
                </div>
              )}
            </>
          ) : researchMsg ? (
            <div className="flex items-center justify-center py-8">
              <div className="spinner w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full"></div>
              <span className="ml-2 text-gray-600">Analyzing guidance...</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <div className="max-w-7xl mx-auto py-6">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
              <p className="text-gray-600">Ask a legal question to get started</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {userMessages.map((userMsg, index) => {
              const researchMsg = researchMessages[index];
              const guidanceMsg = guidanceMessages[index];
              return renderMessagePair(userMsg, researchMsg, guidanceMsg, index);
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DualPaneChat;
