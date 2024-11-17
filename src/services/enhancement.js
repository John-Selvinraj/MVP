export class EnhancementService {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async enhance(text, objective) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a professional writing assistant.'
            },
            {
              role: 'user',
              content: `Original text: ${text}\nObjective: ${objective}\n\nPlease enhance the original text to meet the objective. Provide the enhanced text only, without any quotation marks, extra spaces, or additional explanations.`
            }
          ],
          temperature: 0
        })
      });

      const data = await response.json();

      // Debug: Log the full response
      console.log('API Response:', JSON.stringify(data, null, 2));

      let content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('Invalid API response');

      // Remove code blocks if present
      content = content.replace(/```(?:\w+)?\n?([\s\S]*?)\n?```/g, '$1');

      // Remove all quotation marks
      content = content.replace(/["']/g, '');

      // Normalize whitespace
      content = content.replace(/\s+/g, ' ').trim();

      return content;
    } catch (error) {
      throw new Error(`Enhancement failed: ${error.message}`);
    }
  }
}