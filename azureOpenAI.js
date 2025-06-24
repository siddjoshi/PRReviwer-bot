// azureOpenAI.js
const { OpenAI } = require('openai');

class AzureOpenAIService {
  constructor() {
    // Initialize Azure OpenAI client
    this.client = new OpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
      defaultQuery: { 'api-version': process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview' },
      defaultHeaders: {
        'api-key': process.env.AZURE_OPENAI_API_KEY,
      },
    });
  }

  async reviewCode(changes, pullRequestInfo) {
    try {
      console.log('Starting code review with Azure OpenAI...');
      
      const prompt = this.createReviewPrompt(changes, pullRequestInfo);
      
      const response = await this.client.chat.completions.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert code reviewer. Analyze the provided code changes and provide constructive feedback. Focus on:
            - Code quality and best practices
            - Potential bugs or security issues
            - Performance considerations
            - Maintainability and readability
            - Adherence to coding standards
            
            Format your response as markdown with clear sections. Be specific and provide actionable suggestions.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error calling Azure OpenAI:', error);
      throw new Error(`Code review failed: ${error.message}`);
    }
  }

  createReviewPrompt(changes, pullRequestInfo) {
    const { title, body, user } = pullRequestInfo;
    
    let prompt = `Please review the following pull request:

**Title:** ${title}
**Description:** ${body || 'No description provided'}
**Author:** ${user.login}

**Code Changes:**
`;

    changes.forEach(file => {
      prompt += `\n## File: ${file.filename}\n`;
      prompt += `**Status:** ${file.status}\n`;
      prompt += `**Changes:** +${file.additions} -${file.deletions}\n`;
      
      if (file.patch) {
        prompt += `\n\`\`\`diff\n${file.patch}\n\`\`\`\n`;
      }
    });

    prompt += `\nPlease provide a comprehensive code review with specific feedback and suggestions for improvement.`;
    
    return prompt;
  }

  async reviewSpecificLines(file, startLine, endLine, codeContext) {
    try {
      console.log(`Reviewing lines ${startLine}-${endLine} in ${file.filename}...`);
      
      const prompt = `Review the following code snippet from ${file.filename} (lines ${startLine}-${endLine}):

\`\`\`${this.getFileExtension(file.filename)}
${codeContext}
\`\`\`

Provide specific feedback for this code section, focusing on potential issues, improvements, and best practices.`;

      const response = await this.client.chat.completions.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert code reviewer. Provide concise, actionable feedback for the specific code section.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error reviewing specific lines:', error);
      throw new Error(`Line-specific review failed: ${error.message}`);
    }
  }

  getFileExtension(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const languageMap = {
      'js': 'javascript',
      'ts': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'kt': 'kotlin',
      'swift': 'swift'
    };
    return languageMap[ext] || ext;
  }
}

module.exports = AzureOpenAIService;
