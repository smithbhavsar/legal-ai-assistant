const { InferenceClient } = require('@huggingface/inference');
const { ChromaClient } = require('chromadb');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const { spawn } = require('child_process');
const logger = require('../utils/logger');

const HUGGINGFACE_API_KEY = process.env.HF_API_KEY || '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';
const client = new InferenceClient(HUGGINGFACE_API_KEY);
const chroma = new ChromaClient();
const COLLECTION_NAME = 'legal_rag_chunks';

// Function to check if collection has data
async function ensureVectorDBPopulated() {
  try {
    let collection = await chroma.getOrCreateCollection({ name: COLLECTION_NAME });
    const count = await collection.count();
    if (count === 0) {
      logger.warn('Vector DB is empty. Rebuilding from Python...');
      await runPythonVectorBuildScript();
      collection = await chroma.getOrCreateCollection({ name: COLLECTION_NAME });
    }
    return collection;
  } catch (err) {
    logger.error('Error checking Chroma collection:', err);
    logger.warn('Attempting to rebuild vector DB using Python script...');
    await runPythonVectorBuildScript();
    return await chroma.getOrCreateCollection({ name: COLLECTION_NAME });
  }
}

// Runs the Python script to build the vector DB
async function runPythonVectorBuildScript() {
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
        logger.info('✅ Python vector DB build complete.');
        resolve();
      } else {
        reject(new Error(`Python script exited with code ${code}`));
      }
    });
  });
}

// Embed using HuggingFace
async function embedTexts(texts) {
  const embeddings = [];
  for (const text of texts) {
    const result = await client.featureExtraction({ model: 'sentence-transformers/all-MiniLM-L6-v2', inputs: text });
    embeddings.push(result);
  }
  return embeddings;
}

// Retrieve top-N relevant passages using vector similarity
async function retrieveRelevantPassages(query, topN = 3) {
  logger.info(`RAG query: "${query}"`);
  const collection = await ensureVectorDBPopulated();

  // Embed the query
  const [queryEmbedding] = await embedTexts([query]);
  // Query Chroma for top-N similar chunks
  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: topN,
  });

  const bestScore = results.distances[0][0] !== undefined ? 1 - results.distances[0][0] : 0;
  logger.info(`Best RAG match score: ${bestScore}`);

  const topChunks = results.documents[0].map((chunk, i) => ({
    chunk,
    score: results.distances[0][i] !== undefined ? 1 - results.distances[0][i] : 0,
  }));

  return { topChunks, bestMatchScore: bestScore };
}

module.exports = { retrieveRelevantPassages };
