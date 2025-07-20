import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { chatAPI } from '../../services/api';

const ChatHistory = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchChatSessions();
  }, []);

  const fetchChatSessions = async () => {
    try {
      setLoading(true);
      const response = await chatAPI.getHistory();
      setSessions(response.data.sessions || []);
    } catch (error) {
      console.error('Failed to fetch chat sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionMessages = async (sessionId) => {
    try {
      const response = await chatAPI.getSessionMessages(sessionId);
      setMessages(response.data.messages || []);
      setSelectedSession(sessionId);
    } catch (error) {
      console.error('Failed to fetch session messages:', error);
    }
  };

  const filteredSessions = sessions.filter(session =>
    session.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.preview?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="glass-card p-6 mb-6 rounded-xl">
          <h1 className="text-3xl font-bold text-white mb-2">Chat History</h1>
          <p className="text-blue-200">Review your previous legal consultations</p>
          
          <div className="mt-4">
            <input
              type="text"
              placeholder="Search conversations..."
              className="input-field max-w-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sessions List */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 rounded-xl max-h-screen overflow-y-auto">
              <h2 className="text-xl font-semibold text-white mb-4">Recent Sessions</h2>
              
              {filteredSessions.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <p>No chat sessions found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => fetchSessionMessages(session.id)}
                      className={`p-4 rounded-lg cursor-pointer transition-all duration-200 hover:bg-blue-700 hover:bg-opacity-30 ${
                        selectedSession === session.id 
                          ? 'bg-blue-600 bg-opacity-50 border border-blue-400' 
                          : 'bg-gray-800 bg-opacity-50'
                      }`}
                    >
                      <h3 className="font-medium text-white truncate">
                        {session.title || 'Untitled Session'}
                      </h3>
                      <p className="text-sm text-gray-300 mt-1 line-clamp-2">
                        {session.preview || 'No preview available'}
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-blue-300">
                          {formatTimestamp(session.createdAt)}
                        </span>
                        <span className="text-xs bg-blue-600 bg-opacity-50 px-2 py-1 rounded">
                          {session.messageCount || 0} messages
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Messages Display */}
          <div className="lg:col-span-2">
            <div className="glass-card p-6 rounded-xl min-h-96">
              {selectedSession ? (
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Session Messages</h2>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-blue-600 bg-opacity-30 ml-8'
                            : 'bg-gray-700 bg-opacity-50 mr-8'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white">
                            {message.role === 'user' ? 'You' : 
                             message.aiType === 'research' ? 'Research AI' : 'Guidance AI'}
                          </span>
                          <span className="text-xs text-gray-300">
                            {formatTimestamp(message.timestamp)}
                          </span>
                        </div>
                        <p className="text-gray-200">{message.content}</p>
                        
                        {message.citations && message.citations.length > 0 && (
                          <div className="mt-3">
                            <h4 className="text-sm font-medium text-blue-300 mb-2">Sources:</h4>
                            <div className="space-y-1">
                              {message.citations.map((citation, citIndex) => (
                                <a
                                  key={citIndex}
                                  href={citation.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block text-xs text-blue-400 hover:text-blue-300 underline"
                                >
                                  {citation.title}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {message.confidence && (
                          <div className="mt-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              message.confidence >= 80 ? 'bg-green-600 bg-opacity-50 text-green-200' :
                              message.confidence >= 60 ? 'bg-yellow-600 bg-opacity-50 text-yellow-200' :
                              'bg-red-600 bg-opacity-50 text-red-200'
                            }`}>
                              {message.confidence}% Confidence
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p>Select a session to view messages</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatHistory;