import React, { useState, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import DualPaneChat from './DualPaneChat';
import InputField from './InputField';
import toast from 'react-hot-toast';

const ChatInterface = () => {
  const { user } = useAuth();
  const { 
    currentSession, 
    messages, 
    loading, 
    aiStatus, 
    startNewSession, 
    sendMessage,
    clearSession 
  } = useChat();

  const [showSessionModal, setShowSessionModal] = useState(false);

  // Start a session when component mounts if none exists
  useEffect(() => {
    if (!currentSession) {
      handleStartNewSession();
    }
  }, [currentSession]);

  const handleStartNewSession = async () => {
    try {
      await startNewSession(`Legal Consultation - ${new Date().toLocaleDateString()}`);
      setShowSessionModal(false);
    } catch (error) {
      toast.error('Failed to start new session');
    }
  };

  const handleSendMessage = async (message, urgent = false) => {
    if (!message.trim()) return;
    await sendMessage(message, urgent);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <h1 className="text-xl font-semibold text-gray-900">Legal AI Assistant</h1>
            </div>
            {currentSession && (
              <div className="text-sm text-gray-500">
                Session: {currentSession.title}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowSessionModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>New Session</span>
            </button>
            
            {currentSession && (
              <button
                onClick={clearSession}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>
        
        {/* AI Status */}
        {aiStatus && (
          <div className="mt-3 flex items-center space-x-2 text-sm">
            <div className="flex items-center space-x-2">
              <div className="spinner w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <span className="text-blue-600 font-medium">
                {aiStatus.stage === 'research' && 'Research AI analyzing...'}
                {aiStatus.stage === 'guidance' && 'Guidance AI formulating recommendations...'}
                {aiStatus.stage === 'complete' && 'Response complete'}
                {aiStatus.stage === 'error' && 'Processing error, trying fallback...'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {currentSession ? (
          <>
            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              <DualPaneChat messages={messages} loading={loading} />
              <InputField onSendMessage={handleSendMessage} disabled={loading} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Legal AI Assistant</h2>
              <p className="text-gray-600 mb-4">Start a new session to begin your legal consultation</p>
              <button
                onClick={handleStartNewSession}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start New Session
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Session Modal */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Start New Session</h3>
            <p className="text-gray-600 mb-6">
              This will clear your current conversation and start fresh.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleStartNewSession}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start New Session
              </button>
              <button
                onClick={() => setShowSessionModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
