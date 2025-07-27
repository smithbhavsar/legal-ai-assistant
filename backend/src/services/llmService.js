const axios = require('axios');
const logger = require('../utils/logger');
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

/**
 * LLMService abstraction for sending chat messages to any LLM provider.
 * Now uses Perplexity API.
 * @param {Array} messages - Array of message objects [{role, content}]
 * @param {Object} options - LLM options (temperature, etc.)
 */
async function sendChat(messages, options = {}) {
  try {
    // Log the system and user prompt
    const systemMsg = messages.find(m => m.role === 'system');
    const userMsg = messages.find(m => m.role === 'user');
    if (systemMsg) logger.info('Perplexity system prompt', { prompt: systemMsg.content });
    if (userMsg) logger.info('Perplexity user prompt', { prompt: userMsg.content });

    const payload = {
      model: 'sonar-pro', // You can change model if needed
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 2048,
      stream: false
    };

    logger.info('Sending request to Perplexity', { model: payload.model });
    const response = await axios.post(
      PERPLEXITY_API_URL,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );

    if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
      return {
        content: response.data.choices[0].message.content,
        usage: response.data.usage || {},
        model: response.data.model || payload.model,
      };
    }
    throw new Error('Invalid response format from Perplexity');
  } catch (error) {
    logger.error('Perplexity API error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw new Error(`Perplexity API error: ${error.message}`);
  }
}

module.exports = { sendChat }; 