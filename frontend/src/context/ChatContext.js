import React, { createContext, useContext, useState, useEffect } from 'react';
import { chatAPI } from '../services/api';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

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
      
      return response.session;
    } catch (error) {
      toast.error('Failed to start new session');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (message, urgent = false) => {
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
      const response = await chatAPI.sendMessage(currentSession.id, message, urgent);
      
      // If offline mode, add messages immediately
      if (response.offline) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            type: 'research_ai',
            content: response.research.content,
            confidence: response.research.confidence,
            timestamp: new Date().toISOString(),
          },
          {
            id: Date.now() + 2,
            type: 'guidance_ai',
            content: response.guidance.content,
            confidence: response.guidance.confidence,
            timestamp: new Date().toISOString(),
          }
        ]);
        
        toast.warning('Operating in offline mode');
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

  const value = {
    currentSession,
    messages,
    loading,
    aiStatus,
    startNewSession,
    sendMessage,
    clearSession,
    socket,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
