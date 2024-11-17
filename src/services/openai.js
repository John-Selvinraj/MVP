export class OpenAIService {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async enhanceMessage(message, tone, objective) {
    const prompt = this.buildPrompt(message, tone, objective);
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{
            role: 'system',
            content: 'You are a professional writing assistant that helps improve messages.'
          }, {
            role: 'user',
            content: prompt
          }],
          temperature: 0.7
        })
      });

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      throw new Error('Failed to enhance message: ' + error.message);
    }
  }

  buildPrompt(message, tone, objective) {
    const toneGuide = {
      formal: 'Use professional and formal language',
      casual: 'Use casual but professional language',
      friendly: 'Use friendly and approachable language'
    };

    const objectiveGuide = {
      clarity: 'Enhance clarity while maintaining the main message',
      grammar: 'Fix grammatical errors only',
      concise: 'Make the message more concise'
    };

    return `
      Please revise the following message:
      "${message}"
      
      Requirements:
      - ${toneGuide[tone]}
      - ${objectiveGuide[objective]}
      - Maintain the original meaning
      - Keep any technical terms intact
    `;
  }
}