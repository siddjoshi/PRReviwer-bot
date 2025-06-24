// githubCopilotService.js
const axios = require('axios');

class GitHubCopilotService {
  constructor() {
    this.apiUrl = 'https://api.githubcopilot.com/chat/completions';
    this.token = process.env.PAT_TOKEN;
    this.integrationId = process.env.COPILOT_INTEGRATION_ID;
    
    if (!this.token) {
      throw new Error('PAT_TOKEN is required for GitHub Copilot API');
    }
    
    if (!this.integrationId) {
      throw new Error('COPILOT_INTEGRATION_ID is required for GitHub Copilot API');
    }
  }

  async reviewCode(changes, pullRequestInfo) {
    try {
      console.log('Starting code review with GitHub Copilot...');
      
      const prompt = this.createReviewPrompt(changes, pullRequestInfo);
      
      const requestData = {
        messages: [
          {
            name: "code_review_request",
            role: "user",
            copilot_references: [
              {
                type: "github.workbenchState",
                data: {
                  step: "generate",
                  version: "v3"
                }
              }
            ],
            content: prompt
          }
        ]
      };

      console.log('📤 Sending request to GitHub Copilot API...');
      console.log('🔗 URL:', this.apiUrl);
      console.log('🔑 Auth Token (first 10 chars):', this.token?.substring(0, 10) + '...');
      console.log('🏷️  Integration ID:', this.integrationId);
      console.log('📝 Request payload:', JSON.stringify(requestData, null, 2));

      const response = await axios.post(this.apiUrl, requestData, {
        headers: {
          'Authorization': `${this.token}`,
          'Copilot-Integration-Id': this.integrationId
        }
      });

      if (response.data && response.data.choices && response.data.choices[0]) {
        return response.data.choices[0].message.content;
      } else {
        throw new Error('Unexpected response format from GitHub Copilot API');
      }
    } catch (error) {
      console.error('Error calling GitHub Copilot API:', error.response?.data || error.message);
      throw new Error(`Code review failed: ${error.response?.data?.message || error.message}`);
    }
  }

  createReviewPrompt(changes, pullRequestInfo) {
    const { title, body, user } = pullRequestInfo;
    
    let prompt = `Please perform a comprehensive code review for the following pull request:

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

    prompt += `

Please analyze this code and provide:
1. **Code Quality Assessment**: Overall code quality and adherence to best practices
2. **Potential Issues**: Any bugs, security concerns, or performance issues
3. **Suggestions**: Specific recommendations for improvement
4. **Best Practices**: Any coding standards or patterns that could be improved

Format your response as clear, actionable feedback in markdown format.`;
    
    return prompt;
  }

  async reviewSpecificLines(file, startLine, endLine, codeContext) {
    try {
      console.log(`Reviewing lines ${startLine}-${endLine} in ${file.filename}...`);
      
      const prompt = `Please review the following specific code section from ${file.filename} (lines ${startLine}-${endLine}):

\`\`\`${this.getFileExtension(file.filename)}
${codeContext}
\`\`\`

Focus on this specific code section and provide:
- Any potential issues or bugs
- Code quality improvements
- Best practice recommendations
- Performance considerations

Keep the feedback concise and actionable.`;

      const requestData = {
        messages: [
          {
            name: "line_review_request",
            role: "user",
            copilot_references: [
              {
                type: "github.workbenchState",
                data: {
                  step: "generate",
                  version: "v3"
                }
              }
            ],
            content: prompt
          }
        ]
      };

      const response = await axios.post(this.apiUrl, requestData, {
        headers: {
          'Authorization': `${this.token}`,
          'Copilot-Integration-Id': this.integrationId
        }
      });

      if (response.data && response.data.choices && response.data.choices[0]) {
        return response.data.choices[0].message.content;
      } else {
        throw new Error('Unexpected response format from GitHub Copilot API');
      }
    } catch (error) {
      console.error('Error reviewing specific lines:', error.response?.data || error.message);
      throw new Error(`Line-specific review failed: ${error.response?.data?.message || error.message}`);
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

module.exports = GitHubCopilotService;
