const axios = require('axios');
const ollamaConfig = require('../config/ollama');
const logger = require('../utils/logger');

class OllamaService {
  constructor() {
    this.baseUrl = ollamaConfig.baseUrl;
    this.model = ollamaConfig.model;
    this.timeout = ollamaConfig.timeout;
  }

  async checkConnection() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`, {
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      logger.error('Ollama connection failed:', error.message);
      return false;
    }
  }

  /**
   * Send a chat completion request to Ollama with the given messages array
   * @param {Array} messages - Array of message objects [{role, content}]
   * @param {Object} options - LLM options (temperature, etc.)
   */
  async sendChat(messages, options = {}) {
    try {
      // Log the system and user prompt
      const systemMsg = messages.find(m => m.role === 'system');
      const userMsg = messages.find(m => m.role === 'user');
      if (systemMsg) logger.info('Ollama system prompt', { prompt: systemMsg.content });
      if (userMsg) logger.info('Ollama user prompt', { prompt: userMsg.content });
      const payload = {
        model: this.model,
        messages,
        stream: false,
        options: {
          temperature: options.temperature || ollamaConfig.temperature,
          num_predict: options.maxTokens || ollamaConfig.maxTokens,
          ...options,
        },
      };
      logger.info('Sending request to Ollama', { model: this.model });
      const response = await axios.post(
        `${this.baseUrl}/api/chat`,
        payload,
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      if (response.data && response.data.message) {
        return {
          content: response.data.message.content,
          usage: response.data.usage || {},
          model: response.data.model || this.model,
        };
      }
      throw new Error('Invalid response format from Ollama');
    } catch (error) {
      logger.error('Ollama API error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Ollama service is not running. Please start Ollama first.');
      }
      throw new Error(`Ollama API error: ${error.message}`);
    }
  }
}

module.exports = new OllamaService();
