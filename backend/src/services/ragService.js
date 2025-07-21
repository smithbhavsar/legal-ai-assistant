const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

/**
 * Load and extract text from all PDFs in rag_documents
 */
async function extractTextFromRagDocs() {
  const baseDir = path.resolve(__dirname, '../../../rag_documents');
  const files = fs.readdirSync(baseDir + '/arxiv/cs_AI');
  let allText = '';

  for (const file of files) {
    if (file.endsWith('.pdf')) {
      const dataBuffer = fs.readFileSync(path.join(baseDir, 'arxiv/cs_AI', file));
      const pdfData = await pdfParse(dataBuffer);
      allText += pdfData.text + '\n\n';
    }
  }

  return allText;
}

/**
 * Retrieve the most relevant PDF passages for a query using keyword matching
 * @param {string} query - The user query
 * @param {number} topN - Number of top relevant chunks to return
 * @param {number} chunkSize - Number of characters per chunk
 * @returns {Promise<string[]>} Array of relevant text chunks
 */
async function retrieveRelevantPassages(query, topN = 3, chunkSize = 1000) {
  const allText = await extractTextFromRagDocs();
  // Split into chunks
  const chunks = [];
  for (let i = 0; i < allText.length; i += chunkSize) {
    chunks.push(allText.slice(i, i + chunkSize));
  }
  // Simple keyword extraction from query
  const keywords = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);
  // Score each chunk by keyword overlap
  const scored = chunks.map(chunk => {
    const chunkText = chunk.toLowerCase();
    let score = 0;
    for (const kw of keywords) {
      if (chunkText.includes(kw)) score++;
    }
    return { chunk, score };
  });
  // Sort by score descending, take top N
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topN);
}

module.exports = { extractTextFromRagDocs, retrieveRelevantPassages };
