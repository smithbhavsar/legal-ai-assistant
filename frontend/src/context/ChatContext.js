import React, { createContext, useContext, useState, useEffect } from 'react';
import { chatAPI } from '../services/api';
import toast from 'react-hot-toast';
import { historyAPI } from '../services/api';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedApi, setSelectedApi] = useState('research');
  const sseRef = React.useRef(null);

  // Open SSE connection when session changes
  useEffect(() => {
    if (!currentSession) return;
    if (sseRef.current) {
      sseRef.current.close();
    }
    // Use full backend URL for SSE
    const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
    const sseUrl = `${backendUrl}/chat/stream?sessionId=${currentSession.id}`;
    console.log('Opening SSE connection to:', sseUrl);
    const eventSource = new window.EventSource(sseUrl);
    sseRef.current = eventSource;
    eventSource.onopen = () => {
      console.log('SSE connection opened:', sseUrl);
    };
    eventSource.onmessage = (event) => {
      console.log('SSE event received:', event.data);
      try {
        const newMessage = JSON.parse(event.data);
        console.log('Parsed SSE message:', newMessage);
        setMessages((prev) => [...prev, newMessage]);
      } catch (err) {
        console.error('SSE parse error:', err, event.data);
      }
    };
    eventSource.onerror = (err) => {
      console.error('SSE error:', err);
      eventSource.close();
    };
    return () => {
      eventSource.close();
      sseRef.current = null;
    };
  }, [currentSession]);

  // Fetch sessions from API (history) after login
  const fetchSessions = async () => {
    try {
      const { sessions } = await historyAPI.getSessions();
      setSessions(sessions || []);
      // Auto-select first session if available
      if (sessions && sessions.length > 0) {
        await selectSession(sessions[0].id);
      } else {
        setCurrentSession(null);
        setMessages([]);
      }
    } catch (error) {
      toast.error('Failed to load chat history');
      setSessions([]);
      setCurrentSession(null);
      setMessages([]);
    }
  };

  useEffect(() => {
    // Only fetch sessions if the user is authenticated.
    // This prevents API calls on initial load before login.
    if (isAuthenticated) {
      fetchSessions();
    } else {
      // If the user is not authenticated (e.g., after logout), clear the session data.
      setSessions([]);
      setCurrentSession(null);
      setMessages([]);
    }
  }, [isAuthenticated]); // Only re-run this effect when the authentication state changes.

  // Select a session and load its messages
  const selectSession = async (sessionId) => {
    if (!sessionId) return;
    try {
      setLoading(true);
      const { session, messages } = await historyAPI.getSession(sessionId);
      setCurrentSession(session);
      setMessages((messages || []).map(msg => ({ ...msg, timestamp: msg.created_at || msg.timestamp })));
    } catch (error) {
      toast.error('Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  // Start a new chat session
  const startNewSession = async (title = 'New Consultation', jurisdiction = null) => {
    try {
      setLoading(true);
      const response = await chatAPI.startSession(title, jurisdiction);
      setCurrentSession(response.session);
      setMessages([]);
      await fetchSessions(); // Refresh sessions list
      return response.session;
    } catch (error) {
      toast.error('Failed to start new session');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Send a message via REST API
  const sendMessage = async (message, urgent = false, api = selectedApi) => {
    if (!currentSession) {
      toast.error('No active session. Please start a new session.');
      return;
    }
    try {
      setLoading(true);
      setAiStatus({ stage: 'processing', status: 'started' });
      // Add user message immediately
      const userMessage = {
        id: Date.now(),
        type: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, userMessage]);
      // Send to API
      const response = await chatAPI.sendMessage(currentSession.id, message, urgent, api);
      // Add AI message from response
      if (response && response.message) {
        setMessages(prev => [...prev, {
          id: response.messageId || Date.now() + 1,
          type: response.type || 'ai',
          content: response.message,
          citations: response.citations,
          confidence: response.confidence,
          processingTime: response.processingTime,
          timestamp: new Date().toISOString(),
        }]);
      }
    } catch (error) {
      toast.error('Failed to send message');
      console.error('Send message error:', error);
    } finally {
      setLoading(false);
      setAiStatus(null);
    }
  };

  const clearSession = () => {
    setCurrentSession(null);
    setMessages([]);
    setAiStatus(null);
  };

  const deleteSession = async (sessionId) => {
    try {
      await historyAPI.deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSession && currentSession.id === sessionId) {
        setCurrentSession(null);
        setMessages([]);
      }
      toast.success('Chat deleted');
    } catch (error) {
      toast.error('Failed to delete chat');
    }
  };

  const value = {
    currentSession,
    messages,
    loading,
    aiStatus,
    startNewSession,
    sendMessage,
    clearSession,
    sessions,
    selectSession,
    selectedApi,
    setSelectedApi,
    deleteSession, // add to context
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
