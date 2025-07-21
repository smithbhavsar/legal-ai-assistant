const { query } = require('../config/database');
const ollamaService = require('../services/ollamaService');
const promptService = require('../services/promptService');
const ragService = require('../services/ragService');
const llmService = require('../services/llmService');
const logger = require('../utils/logger');

class ChatController {
  async startSession(req, res) {
    try {
      const { title, jurisdiction } = req.body;
      const userId = req.user.id;

      // Create new chat session
      const sessionResult = await query(
        `INSERT INTO chat_sessions (user_id, title, jurisdiction)
         VALUES ($1, $2, $3)
         RETURNING id, title, jurisdiction, created_at`,
        [userId, title || 'New Legal Consultation', JSON.stringify(jurisdiction)]
      );

      const session = sessionResult.rows[0];

      logger.info('Chat session started', {
        sessionId: session.id,
        userId,
        jurisdiction,
      });

      res.status(201).json({
        session: {
          id: session.id,
          title: session.title,
          jurisdiction: session.jurisdiction,
          createdAt: session.created_at,
        },
      });
    } catch (error) {
      logger.error('Start session error:', error);
      res.status(500).json({
        error: 'Failed to start chat session',
      });
    }
  }

  async sendMessage(req, res) {
    try {
      const { sessionId, message, urgent = false, api } = req.body;
      const userId = req.user.id;

      if (!sessionId || !message) {
        return res.status(400).json({
          error: 'Session ID and message are required',
        });
      }

      // Verify session belongs to user
      const sessionResult = await query(
        'SELECT * FROM chat_sessions WHERE id = $1 AND user_id = $2 AND is_active = true',
        [sessionId, userId]
      );

      if (sessionResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Session not found',
        });
      }

      const session = sessionResult.rows[0];

      // Store user message
      await query(
        'INSERT INTO messages (session_id, type, content) VALUES ($1, $2, $3)',
        [sessionId, 'user', message]
      );

      // Get user context for prompts
      const userContext = await this.getUserContext(userId);
      const context = {
        ...userContext,
        jurisdiction: session.jurisdiction ? JSON.parse(session.jurisdiction) : null,
        urgency: urgent ? 'high' : 'normal',
      };

      // RAG: Retrieve relevant PDF passages for the query
      const ragResults = await ragService.retrieveRelevantPassages(message, 1, 500);
      const bestRag = ragResults[0];
      context.ragContext = bestRag ? bestRag.chunk : '';

      // If no relevant RAG passages (score 0), block the answer
      if (!bestRag || bestRag.score === 0 || !bestRag.chunk.trim()) {
        const notFoundMsg = 'I could not find an answer in the provided legal documents.';
        // Store a message for the user
        await query(
          'INSERT INTO messages (session_id, type, content) VALUES ($1, $2, $3)',
          [sessionId, 'research_ai', notFoundMsg]
        );
        // Emit to socket if needed
        const io = req.app.get('io');
        io.to(sessionId).emit('ai-response', {
          type: 'research_ai',
          messageId: Date.now(),
          content: notFoundMsg,
          citations: [],
          confidence: 0.0,
          processingTime: 0,
        });
        return res.json({
          success: true,
          research: {
            content: notFoundMsg,
            citations: [],
            confidence: 0.0,
            processingTime: 0,
          }
        });
      }

      // Check if Ollama is available
      const isOllamaAvailable = await ollamaService.checkConnection();
      
      if (!isOllamaAvailable) {
        return await this.handleOfflineMode(sessionId, message, res);
      }

      // Real-time updates via Socket.IO
      const io = req.app.get('io');
      try {
        let researchResponse, researchCitations, researchConfidence, researchTime;
        let guidanceResponse, guidanceCitations, guidanceConfidence, guidanceTime;
        let researchResult, guidanceResult;
        // Only call the selected AI
        if (api === 'research') {
          // Stage 1: Research AI Response
          io.to(sessionId).emit('ai-status', {
            stage: 'research',
            status: 'processing',
            message: 'Researching legal information...'
          });

          const startResearch = Date.now();
          const researchMessages = promptService.buildResearchMessages(message, context);
          researchResponse = await llmService.sendChat(researchMessages, { temperature: 0.3 });
          researchTime = Date.now() - startResearch;

          researchCitations = promptService.extractCitations(researchResponse.content);
          researchConfidence = promptService.extractConfidenceLevel(researchResponse.content);

          // Store research response
          researchResult = await query(
            `INSERT INTO messages (session_id, type, content, citations, confidence_score, processing_time)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, created_at`,
            [sessionId, 'research_ai', researchResponse.content, JSON.stringify(researchCitations), researchConfidence, researchTime]
          );

          io.to(sessionId).emit('ai-response', {
            type: 'research_ai',
            messageId: researchResult.rows[0].id,
            content: researchResponse.content,
            citations: researchCitations,
            confidence: researchConfidence,
            processingTime: researchTime,
          });

          res.json({
            success: true,
            research: {
              content: researchResponse.content,
              citations: researchCitations,
              confidence: researchConfidence,
              processingTime: researchTime,
            }
          });
        } else if (api === 'guidance') {
          // Stage 2: Guidance AI Response
          io.to(sessionId).emit('ai-status', {
            stage: 'guidance',
            status: 'processing',
            message: 'Analyzing guidance recommendations...'
          });

          // For guidance, we still need to generate research first for context
          const startResearch = Date.now();
          const researchMessages = promptService.buildResearchMessages(message, context);
          researchResponse = await llmService.sendChat(researchMessages, { temperature: 0.3 });
          researchTime = Date.now() - startResearch;

          // Now generate guidance
          const startGuidance = Date.now();
          const guidanceMessages = promptService.buildGuidanceMessages(message, researchResponse.content, context);
          guidanceResponse = await llmService.sendChat(guidanceMessages, { temperature: 0.5 });
          guidanceTime = Date.now() - startGuidance;

          guidanceCitations = promptService.extractCitations(guidanceResponse.content);
          guidanceConfidence = promptService.extractConfidenceLevel(guidanceResponse.content);

          // Store guidance response
          guidanceResult = await query(
            `INSERT INTO messages (session_id, type, content, citations, confidence_score, processing_time)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, created_at`,
            [sessionId, 'guidance_ai', guidanceResponse.content, JSON.stringify(guidanceCitations), guidanceConfidence, guidanceTime]
          );

          io.to(sessionId).emit('ai-response', {
            type: 'guidance_ai',
            messageId: guidanceResult.rows[0].id,
            content: guidanceResponse.content,
            citations: guidanceCitations,
            confidence: guidanceConfidence,
            processingTime: guidanceTime,
          });

          res.json({
            success: true,
            guidance: {
              content: guidanceResponse.content,
              citations: guidanceCitations,
              confidence: guidanceConfidence,
              processingTime: guidanceTime,
            }
          });
        } else {
          // Default: call both (legacy)
          // Stage 1: Research AI Response
          io.to(sessionId).emit('ai-status', {
            stage: 'research',
            status: 'processing',
            message: 'Researching legal information...'
          });

          const startResearch = Date.now();
          const researchMessages = promptService.buildResearchMessages(message, context);
          researchResponse = await llmService.sendChat(researchMessages, { temperature: 0.3 });
          researchTime = Date.now() - startResearch;

          const researchCitations = promptService.extractCitations(researchResponse.content);
          const researchConfidence = promptService.extractConfidenceLevel(researchResponse.content);

          // Store research response
          researchResult = await query(
            `INSERT INTO messages (session_id, type, content, citations, confidence_score, processing_time)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, created_at`,
            [sessionId, 'research_ai', researchResponse.content, JSON.stringify(researchCitations), researchConfidence, researchTime]
          );

          io.to(sessionId).emit('ai-response', {
            type: 'research_ai',
            messageId: researchResult.rows[0].id,
            content: researchResponse.content,
            citations: researchCitations,
            confidence: researchConfidence,
            processingTime: researchTime,
          });

          // Stage 2: Guidance AI Response
          io.to(sessionId).emit('ai-status', {
            stage: 'guidance',
            status: 'processing',
            message: 'Analyzing guidance recommendations...'
          });

          const startGuidance = Date.now();
          const guidanceMessages = promptService.buildGuidanceMessages(message, researchResponse.content, context);
          guidanceResponse = await llmService.sendChat(guidanceMessages, { temperature: 0.5 });
          guidanceTime = Date.now() - startGuidance;

          const guidanceCitations = promptService.extractCitations(guidanceResponse.content);
          const guidanceConfidence = promptService.extractConfidenceLevel(guidanceResponse.content);

          // Store guidance response
          guidanceResult = await query(
            `INSERT INTO messages (session_id, type, content, citations, confidence_score, processing_time)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, created_at`,
            [sessionId, 'guidance_ai', guidanceResponse.content, JSON.stringify(guidanceCitations), guidanceConfidence, guidanceTime]
          );

          io.to(sessionId).emit('ai-response', {
            type: 'guidance_ai',
            messageId: guidanceResult.rows[0].id,
            content: guidanceResponse.content,
            citations: guidanceCitations,
            confidence: guidanceConfidence,
            processingTime: guidanceTime,
          });

          io.to(sessionId).emit('ai-status', {
            stage: 'complete',
            status: 'completed',
            message: 'Response generated successfully'
          });

          // Log analytics event
          await query(
            `INSERT INTO analytics_events (user_id, event_type, event_data)
             VALUES ($1, $2, $3)`,
            [userId, 'message_processed', {
              sessionId,
              researchTime,
              guidanceTime,
              totalTime: researchTime + guidanceTime,
              urgent,
            }]
          );

          res.json({
            success: true,
            research: {
              content: researchResponse.content,
              citations: researchCitations,
              confidence: researchConfidence,
              processingTime: researchTime,
            },
            guidance: {
              content: guidanceResponse.content,
              citations: guidanceCitations,
              confidence: guidanceConfidence,
              processingTime: guidanceTime,
            },
          });
        }

      } catch (aiError) {
        logger.error('AI processing error:', aiError);
        
        io.to(sessionId).emit('ai-status', {
          stage: 'error',
          status: 'error',
          message: 'AI processing failed, trying fallback...'
        });

        return await this.handleOfflineMode(sessionId, message, res);
      }

    } catch (error) {
      logger.error('Send message error:', error);
      res.status(500).json({
        error: 'Failed to process message',
      });
    }
  }

  async handleOfflineMode(sessionId, message, res) {
    try {
      // Simple pattern-based responses for offline mode
      const offlineResponses = this.getOfflineResponses();
      
      let response = offlineResponses.default;
      
      // Simple keyword matching
      const lowerMessage = message.toLowerCase();
      for (const pattern of offlineResponses.patterns) {
        if (pattern.keywords.some(keyword => lowerMessage.includes(keyword))) {
          response = pattern.response;
          break;
        }
      }

      // Store offline responses
      await query(
        'INSERT INTO messages (session_id, type, content, confidence_score) VALUES ($1, $2, $3, $4)',
        [sessionId, 'research_ai', `[OFFLINE MODE] ${response.research}`, 0.3]
      );

      await query(
        'INSERT INTO messages (session_id, type, content, confidence_score) VALUES ($1, $2, $3, $4)',
        [sessionId, 'guidance_ai', `[OFFLINE MODE] ${response.guidance}`, 0.3]
      );

      res.json({
        success: true,
        offline: true,
        research: {
          content: `[OFFLINE MODE] ${response.research}`,
          confidence: 0.3,
        },
        guidance: {
          content: `[OFFLINE MODE] ${response.guidance}`,
          confidence: 0.3,
        },
      });

    } catch (error) {
      logger.error('Offline mode error:', error);
      res.status(500).json({
        error: 'System unavailable',
      });
    }
  }

  getOfflineResponses() {
    return {
      patterns: [
        {
          keywords: ['miranda', 'rights'],
          response: {
            research: 'Miranda rights are required before custodial interrogation as established in Miranda v. Arizona (1966). The suspect must be advised of their right to remain silent, right to an attorney, and that statements can be used against them.',
            guidance: 'You must read Miranda rights before any custodial interrogation. If the suspect is not in custody or you are not interrogating, Miranda may not be required. When in doubt, read the rights to protect the case.'
          }
        },
        {
          keywords: ['search', 'warrant', 'fourth amendment'],
          response: {
            research: 'The Fourth Amendment protects against unreasonable searches and seizures. Generally, police need a warrant based on probable cause, though several exceptions exist including consent, exigent circumstances, and search incident to arrest.',
            guidance: 'Obtain a warrant whenever possible. If immediate action is required, document the exigent circumstances. Always respect the scope of any consent given. Incident to arrest searches must be contemporaneous with the arrest.'
          }
        },
        {
          keywords: ['arrest', 'probable cause'],
          response: {
            research: 'Probable cause exists when facts and circumstances would lead a reasonable person to believe a crime has been committed and the suspect committed it. This standard is required for arrests and warrants.',
            guidance: 'Ensure you can articulate specific facts supporting probable cause before making an arrest. General suspicion is not sufficient. Document all observations and circumstances in your report.'
          }
        }
      ],
      default: {
        research: 'I am currently operating in offline mode with limited legal information. For comprehensive guidance, please consult your department\'s legal resources or wait for the AI system to come back online.',
        guidance: 'In offline mode, I recommend following your department\'s standard operating procedures and consulting with your supervisor for legal guidance. When in doubt, choose the most conservative approach that protects constitutional rights.'
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
            state: user.state,
          } : null,
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
