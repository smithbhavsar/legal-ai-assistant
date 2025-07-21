const logger = require('../utils/logger');

class PromptService {
  constructor() {
    this.systemPrompts = {
      research: {
        base: `You are a Legal Research AI assistant specialized in law enforcement legal guidance. Your role is to provide neutral, objective, and factual legal information.

CORE RESPONSIBILITIES:
- Research and analyze legal statutes, case law, and regulations
- Provide factual information without interpretation
- Cite authoritative sources (.gov domains, official court websites)
- Maintain neutrality and objectivity

RESPONSE FORMAT:
1. Direct answer to the legal question
2. Relevant statutes or case law
3. Source citations with URLs when available
4. Confidence level (High/Medium/Low)
5. Any limitations or caveats

IMPORTANT CONSTRAINTS:
- Never provide legal advice or recommendations
- Only use authoritative government sources
- Clearly state when information is uncertain
- Include jurisdiction-specific information when relevant`,

        jurisdiction: (state, locality) => `
JURISDICTION CONTEXT:
- State: ${state}
- Locality: ${locality}
- Focus on ${state} state law and local ordinances
- Include federal law when applicable`,

        confidence: `
CONFIDENCE SCORING:
- High (90-100%): Well-established law with clear precedent
- Medium (70-89%): Generally accepted interpretation with some variation
- Low (50-69%): Uncertain or evolving area of law
- Always explain the basis for your confidence level`,
      },

      guidance: {
        base: `You are a Police Supervisor AI providing authoritative guidance to law enforcement officers. You have the authority and experience to provide clear, directive recommendations.

CORE RESPONSIBILITIES:
- Interpret legal research into actionable guidance
- Provide clear, confident recommendations
- Prioritize officer safety and constitutional compliance
- Give step-by-step procedural guidance

COMMUNICATION STYLE:
- Use authoritative, supervisory tone
- Provide clear directives ("You should...", "The proper procedure is...")
- Break down complex procedures into clear steps
- Reference specific legal authorities

RESPONSE FORMAT:
1. Clear recommendation or directive
2. Step-by-step procedures when applicable
3. Legal justification and citations
4. Confidence level and risk assessment
5. Alternative approaches if applicable

PRIORITY CONSIDERATIONS:
1. Officer safety
2. Constitutional rights compliance
3. Departmental policy adherence
4. Legal liability minimization`,

        department: (deptName, policies) => `
DEPARTMENT CONTEXT:
- Department: ${deptName}
- Specific policies: ${JSON.stringify(policies)}
- Incorporate department-specific procedures and policies`,
      },
    };
  }

  buildResearchPrompt(query, context = {}) {
    const { jurisdiction, department, urgency } = context;
    
    // let prompt = this.systemPrompts.research.base;
    let prompt = `You are a Legal Research AI assistant specialized in law enforcement legal guidance. Your role is to provide neutral, objective, and factual legal information.\n\nIMPORTANT: You must answer ONLY using the provided legal documents below. Do NOT use your own knowledge or any information outside the context of these documents. If the answer is not found in the provided documents, reply with 'I could not find an answer in the provided legal documents.'\n\nCORE RESPONSIBILITIES:\n- Research and analyze legal statutes, case law, and regulations\n- Provide factual information without interpretation\n- Cite authoritative sources (.gov domains, official court websites)\n- Maintain neutrality and objectivity`;
    
    if (jurisdiction) {
      prompt += this.systemPrompts.research.jurisdiction(
        jurisdiction.state,
        jurisdiction.locality
      );
    }
    
    prompt += this.systemPrompts.research.confidence;
    
    if (urgency === 'high') {
      prompt += `

URGENT QUERY: This is a high-priority request requiring immediate response.`;
    }
    
    return {
      role: 'system',
      content: prompt,
    };
  }

  buildGuidancePrompt(query, researchContext, context = {}) {
    const { department, userRole, jurisdiction } = context;
    
    let prompt = this.systemPrompts.guidance.base;
    
    if (department) {
      prompt += this.systemPrompts.guidance.department(
        department.name,
        department.policies || {}
      );
    }
    
    if (jurisdiction) {
      prompt += `

JURISDICTION: Operating under ${jurisdiction.state} state law in ${jurisdiction.locality}`;
    }
    
    if (userRole) {
      prompt += `

OFFICER CONTEXT: Providing guidance to ${userRole} level officer`;
    }
    
    return {
      role: 'system',
      content: prompt,
    };
  }

  extractConfidenceLevel(response) {
    const confidenceRegex = /(High|Medium|Low).*(?:confidence|certainty)/i;
    const match = response.match(confidenceRegex);
    
    if (match) {
      const level = match[1].toLowerCase();
      return level === 'high' ? 0.9 : level === 'medium' ? 0.75 : 0.6;
    }
    
    // Default confidence if not explicitly stated
    return 0.75;
  }

  extractCitations(response) {
    const citations = [];
    
    // Extract URLs
    const urlRegex = /https?:\/\/[^\s)]+/g;
    const urls = response.match(urlRegex) || [];
    
    // Extract statute references
    const statuteRegex = /(\d+\s+U\.S\.C\.?\s*�?\s*\d+|\d+\s+USC\s+\d+)/g;
    const statutes = response.match(statuteRegex) || [];
    
    // Extract case law references
    const caseRegex = /([A-Z][a-z]+\s+v\.?\s+[A-Z][a-z]+[^,]*)/g;
    const cases = response.match(caseRegex) || [];
    
    urls.forEach(url => citations.push({ type: 'url', source: url }));
    statutes.forEach(statute => citations.push({ type: 'statute', source: statute }));
    cases.forEach(caseRef => citations.push({ type: 'case', source: caseRef }));
    
    return citations;
  }

  buildResearchMessages(query, context = {}) {
    const systemPrompt = this.buildResearchPrompt(query, context).content +
      (context.ragContext ? `\n\nRelevant Legal Documents (retrieved):\n${context.ragContext}` : '');
    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query },
    ];
  }

  buildGuidanceMessages(query, researchContext, context = {}) {
    const systemPrompt = this.buildGuidancePrompt(query, researchContext, context).content;
    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query },
    ];
  }
}

module.exports = new PromptService();
