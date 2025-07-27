const axios = require('axios');
const path = require('path');
const { spawn } = require('child_process');
const logger = require('../utils/logger');

// Runs the Python script to build the vector DB
function runPythonVectorBuildScript() {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(__dirname, '../../src/services/rag_pdf_loader.py');
    const process = spawn('python', [scriptPath]);
    process.stdout.on('data', (data) => {
      logger.info(`PYTHON OUT: ${data.toString().trim()}`);
    });
    process.stderr.on('data', (data) => {
      logger.error(`PYTHON ERR: ${data.toString().trim()}`);
    });
    process.on('close', (code) => {
      if (code === 0) {
        logger.info('Python vector DB build complete.');
        resolve();
      } else {
        reject(new Error(`Python script exited with code ${code}`));
      }
    });
  });
}

// Retrieve top-N relevant passages using Python FastAPI
async function retrieveRelevantPassages(query, topN = 3) {
  logger.info(`RAG query: "${query}"`);
  
  try {
    const response = await axios.post('http://localhost:5000/search', { query, top_n: topN });

    const results = response.data.results || [];
    results.forEach(result => {
      logger.info(`Result score: ${JSON.stringify(result.score)}`);
      logger.info(`Result response: ${JSON.stringify(result)}`);
    });

    // Optional: Filter out very low-score results (e.g., < 0.2)
    const filteredResults = results.filter(r => r.score >= 0.2);

    // Prevent .map error and provide structure for controller
    const bestMatchScore = filteredResults.length > 0
      ? Math.max(...filteredResults.map(r => r.score))
      : -1;

    logger.info(`Filtered RAG response: ${JSON.stringify(filteredResults)}`);

    return {
      topChunks: filteredResults,
      bestMatchScore,
    };
  } catch (error) {
    logger.error('RAG fetch error:', {
      message: error.message,
      data: error.response?.data,
      stack: error.stack,
    });
    return {
      topChunks: [],
      bestMatchScore: -1,
    };
  }
}

module.exports = { retrieveRelevantPassages, runPythonVectorBuildScript };
