import React, { createContext, useContext, useState, useEffect } from 'react';
import { chatAPI } from '../services/api';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { historyAPI } from '../services/api';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState(null);
  const [socket, setSocket] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedApi, setSelectedApi] = useState('research'); // 'research' or 'guidance'

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_WS_URL || 'http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
    });

    newSocket.on('ai-status', (status) => {
      setAiStatus(status);
    });

    newSocket.on('ai-response', (response) => {
      setMessages(prev => [...prev, {
        id: response.messageId,
        type: response.type,
        content: response.content,
        citations: response.citations,
        confidence: response.confidence,
        processingTime: response.processingTime,
        timestamp: new Date().toISOString(),
      }]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Fetch sessions from API
  const fetchSessions = async () => {
    try {
      const { sessions } = await historyAPI.getSessions();
      setSessions(sessions || []);
    } catch (error) {
      toast.error('Failed to load chat history');
      setSessions([]);
    }
  };

  // Fetch sessions on mount
  useEffect(() => {
    fetchSessions();
  }, []);

  const selectSession = async (sessionId) => {
    try {
      setLoading(true);
      const { session, messages } = await historyAPI.getSession(sessionId);
      setCurrentSession(session);
      setMessages((messages || []).map(msg => ({ ...msg, timestamp: msg.created_at || msg.timestamp })));
      // Join socket room
      if (socket) {
        socket.emit('join-session', session.id);
      }
    } catch (error) {
      toast.error('Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  const startNewSession = async (title = 'New Consultation', jurisdiction = null) => {
    try {
      setLoading(true);
      const response = await chatAPI.startSession(title, jurisdiction);
      setCurrentSession(response.session);
      setMessages([]);
      
      // Join socket room
      if (socket) {
        socket.emit('join-session', response.session.id);
      }
      // Refresh sessions list
      await fetchSessions();
      return response.session;
    } catch (error) {
      toast.error('Failed to start new session');
      throw error;
    } finally {
      setLoading(false);
    }
  };

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

      // Debug: Log before backend call
      console.log('[sendMessage] Sending to backend:', { sessionId: currentSession.id, message, urgent, api });

      // Send to API with selected API
      const response = await chatAPI.sendMessage(currentSession.id, message, urgent, api);

      // Debug: Log after backend call
      console.log('[sendMessage] Backend response:', response);
      // (No setMessages for AI message here; rely on socket event)

    } catch (error) {
      toast.error('Failed to send message');
      console.error('Send message error:', error);
      // Debug: Log error
      console.log('[sendMessage] Backend error:', error);
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
    socket,
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
