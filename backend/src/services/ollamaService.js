const axios = require('axios');
const ollamaConfig = require('../config/ollama');
const logger = require('../utils/logger');
const { log } = require('winston');

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

  async generateResponse(messages, options = {}) {
    try {
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

  async generateResearchResponse(query, context = {}) {
    const messages = [
      {
        role: 'system',
        content: `You are a Legal Research AI assistant. Your role is to provide neutral, objective, and factual legal information. 

IMPORTANT INSTRUCTIONS:
1. Provide only factual, neutral legal information
2. Always cite authoritative sources (.gov domains, official court websites, statutes)
3. Do not provide legal advice or recommendations
4. Include confidence levels for your information (High, Medium, Low)
4. Structure your response with clear citations
5. If information is uncertain, clearly state limitations

Context: ${JSON.stringify(context)}`,
      },
      {
        role: 'user',
        content: query,
      },
    ];

    return await this.generateResponse(messages, { temperature: 0.3 });
  }

  async generateGuidanceResponse(query, researchContext, context = {}) {
    const messages = [
      {
        role: 'system',
        content: `You are a Police Supervisor AI providing authoritative guidance to law enforcement officers. You have command presence and provide clear, directive recommendations.

IMPORTANT INSTRUCTIONS:
1. Provide clear, authoritative guidance based on the research provided
2. Use confident, supervisory tone ("You should...", "The proper procedure is...")
3. Reference specific legal authorities and departmental policies
4. Include confidence levels for recommendations (High, Medium, Low)
5. Always prioritize officer safety and constitutional compliance
6. Structure guidance as clear action items

Research Context: ${researchContext}
Department Context: ${JSON.stringify(context)}`,
      },
      {
        role: 'user',
        content: query,
      },
    ];

    return await this.generateResponse(messages, { temperature: 0.5 });
  }
}

module.exports = new OllamaService();
