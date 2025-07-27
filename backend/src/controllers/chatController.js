const { query } = require('../config/database');
const ollamaService = require('../services/ollamaService');
const promptService = require('../services/promptService');
const ragService = require('../services/ragService');
const llmService = require('../services/llmService');
const logger = require('../utils/logger');

const clients = [];

class ChatController {
  async startSession(req, res) {
    try {
      const { title, jurisdiction } = req.body;
      const userId = req.user.id;

      const sessionResult = await query(
        `INSERT INTO chat_sessions (user_id, title, jurisdiction)
         VALUES ($1, $2, $3)
         RETURNING id, title, jurisdiction, created_at`,
        [userId, title || 'New Legal Consultation', JSON.stringify(jurisdiction)]
      );

      const session = sessionResult.rows[0];
      logger.info('Chat session started', { sessionId: session.id, userId, jurisdiction });

      res.status(201).json({ session });
    } catch (error) {
      logger.error('Start session error:', error);
      res.status(500).json({ error: 'Failed to start chat session' });
    }
  }

  async sendMessage(req, res) {
    try {
      const { sessionId, message, urgent = false, api } = req.body;
      const userId = req.user.id;

      if (!sessionId || !message) {
        return res.status(400).json({ error: 'Session ID and message are required' });
      }

      const sessionResult = await query(
        'SELECT * FROM chat_sessions WHERE id = $1 AND user_id = $2 AND is_active = true',
        [sessionId, userId]
      );

      if (sessionResult.rows.length === 0) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const session = sessionResult.rows[0];
      await query('INSERT INTO messages (session_id, type, content) VALUES ($1, $2, $3)', [sessionId, 'user', message]);

      const userContext = await this.getUserContext(userId);
      const context = {
        ...userContext,
        jurisdiction: session.jurisdiction ? JSON.parse(session.jurisdiction) : null,
        urgency: urgent ? 'high' : 'normal'
      };

      const { topChunks, bestMatchScore } = await ragService.retrieveRelevantPassages(message, 3);
      const ragContext = topChunks.map(c => c.chunk).join('\n---\n');
      context.ragContext = ragContext;

      if (bestMatchScore < 0.1) {
        const notFoundMsg = 'I could not find an answer in the provided documents.';
        await query('INSERT INTO messages (session_id, type, content) VALUES ($1, $2, $3)', [sessionId, 'research_ai', notFoundMsg]);

        this.notifyClients(sessionId, { type: 'research_ai', content: notFoundMsg });

        return res.json({
          success: true,
          research: {
            content: notFoundMsg,
            citations: [],
            confidence: 0.0,
            processingTime: 0
          }
        });
      }

      const isOllamaAvailable = await ollamaService.checkConnection();
      if (!isOllamaAvailable) return await this.handleOfflineMode(sessionId, message, res);

      try {
        if (api === 'research') {
          const startResearch = Date.now();
          const researchMessages = promptService.buildResearchMessages(message, context);
          const researchResponse = await llmService.sendChat(researchMessages, { temperature: 0.3 });
          const researchTime = Date.now() - startResearch;

          const researchCitations = promptService.extractCitations(researchResponse.content);
          const researchConfidence = promptService.extractConfidenceLevel(researchResponse.content);

          const researchResult = await query(
            `INSERT INTO messages (session_id, type, content, citations, confidence_score, processing_time)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, created_at`,
            [sessionId, 'research_ai', researchResponse.content, JSON.stringify(researchCitations), researchConfidence, researchTime]
          );

          this.notifyClients(sessionId, {
            type: 'research_ai',
            content: researchResponse.content,
            citations: researchCitations,
            confidence: researchConfidence,
            processingTime: researchTime
          });

          return res.json({
            success: true,
            research: {
              messageId: researchResult.rows[0].id,
              content: researchResponse.content,
              citations: researchCitations,
              confidence: researchConfidence,
              processingTime: researchTime
            }
          });
        }
      } catch (aiError) {
        logger.error('AI processing error:', aiError);
        return await this.handleOfflineMode(sessionId, message, res);
      }
    } catch (error) {
      logger.error('Send message error:', error);
      res.status(500).json({ error: 'Failed to process message' });
    }
  }

  notifyClients(sessionId, message) {
    logger.info('notifyClients called', { sessionId, message });
    clients.forEach(client => {
      if (client.sessionId === sessionId) {
        logger.info('SSE sending to client', { sessionId, message });
        client.res.write(`data: ${JSON.stringify(message)}\n\n`);
      }
    });
  }

  sseHandler(req, res) {
    const sessionId = req.query.sessionId;
    logger.info('SSE connection opened', { sessionId });
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.flushHeaders && res.flushHeaders();

    const client = { sessionId, res };
    clients.push(client);

    req.on('close', () => {
      logger.info('SSE connection closed', { sessionId });
      const idx = clients.indexOf(client);
      if (idx !== -1) clients.splice(idx, 1);
    });
  }

  async handleOfflineMode(sessionId, message, res) {
    try {
      const offlineResponses = this.getOfflineResponses();
      let response = offlineResponses.default;

      const lowerMessage = message.toLowerCase();
      for (const pattern of offlineResponses.patterns) {
        if (pattern.keywords.some(keyword => lowerMessage.includes(keyword))) {
          response = pattern.response;
          break;
        }
      }

      await query('INSERT INTO messages (session_id, type, content, confidence_score) VALUES ($1, $2, $3, $4)', [sessionId, 'research_ai', `[OFFLINE MODE] ${response.research}`, 0.3]);
      await query('INSERT INTO messages (session_id, type, content, confidence_score) VALUES ($1, $2, $3, $4)', [sessionId, 'guidance_ai', `[OFFLINE MODE] ${response.guidance}`, 0.3]);

      res.json({
        success: true,
        offline: true,
        research: { content: `[OFFLINE MODE] ${response.research}`, confidence: 0.3 },
        guidance: { content: `[OFFLINE MODE] ${response.guidance}`, confidence: 0.3 }
      });
    } catch (error) {
      logger.error('Offline mode error:', error);
      res.status(500).json({ error: 'System unavailable' });
    }
  }

  getOfflineResponses() {
    return {
      patterns: [
        {
          keywords: ['miranda', 'rights'],
          response: {
            research: 'Miranda rights are required before custodial interrogation...',
            guidance: 'You must read Miranda rights...'
          }
        },
        {
          keywords: ['search', 'warrant', 'fourth amendment'],
          response: {
            research: 'The Fourth Amendment protects against unreasonable searches...',
            guidance: 'Obtain a warrant whenever possible...'
          }
        },
        {
          keywords: ['arrest', 'probable cause'],
          response: {
            research: 'Probable cause exists when facts and circumstances...',
            guidance: 'Ensure you can articulate specific facts...'
          }
        }
      ],
      default: {
        research: 'I am currently operating in offline mode with limited legal information...',
        guidance: 'In offline mode, follow your department\'s procedures...'
      }
    };
  }

  async getUserContext(userId) {
    try {
      const result = await query(
        `SELECT u.role, u.badge_number, d.name as department_name, d.code as department_code, d.jurisdiction, d.state
         FROM users u
         LEFT JOIN departments d ON u.department_id = d.id
         WHERE u.id = $1`,
        [userId]
      );

      if (result.rows.length > 0) {
        const user = result.rows[0];
        return {
          userRole: user.role,
          badgeNumber: user.badge_number,
          department: user.department_name ? {
            name: user.department_name,
            code: user.department_code,
            jurisdiction: user.jurisdiction,
            state: user.state
          } : null
        };
      }

      return {};
    } catch (error) {
      logger.error('Get user context error:', error);
      return {};
    }
  }
}

module.exports = new ChatController();
