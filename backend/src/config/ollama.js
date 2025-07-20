require('dotenv').config();

const ollamaConfig = {
  baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  model: process.env.OLLAMA_MODEL || 'llama3.1',
  timeout: parseInt(process.env.OLLAMA_TIMEOUT) || 60000,
  maxTokens: parseInt(process.env.OLLAMA_MAX_TOKENS) || 2048,
  temperature: parseFloat(process.env.OLLAMA_TEMPERATURE) || 0.7,
};

module.exports = ollamaConfig;
