// errorHandler.js
// Centralized error handling for the PR Reviewer Bot

class ErrorHandler {
  static async handleReviewError(error, context, githubUtils) {
    console.error("Code review error:", error);
    
    let errorMessage = "⚠️ I encountered an error while reviewing this PR.";
    let suggestions = [];
    
    // Categorize errors and provide helpful messages
    if (error.message.includes('401') || error.message.includes('unauthorized')) {
      errorMessage += " Authentication failed with Azure OpenAI.";
      suggestions.push("Check if AZURE_OPENAI_API_KEY is valid");
      suggestions.push("Verify Azure OpenAI resource permissions");
    } else if (error.message.includes('404') || error.message.includes('not found')) {
      errorMessage += " Azure OpenAI resource or deployment not found.";
      suggestions.push("Verify AZURE_OPENAI_ENDPOINT is correct");
      suggestions.push("Check if AZURE_OPENAI_DEPLOYMENT_NAME exists");
    } else if (error.message.includes('429') || error.message.includes('rate limit')) {
      errorMessage += " Rate limit exceeded. I'll try again later.";
      suggestions.push("Azure OpenAI rate limits have been reached");
      suggestions.push("Consider upgrading your Azure OpenAI pricing tier");
    } else if (error.message.includes('timeout')) {
      errorMessage += " Request timed out while analyzing the code.";
      suggestions.push("The PR might be too large for analysis");
      suggestions.push("Try breaking down the changes into smaller PRs");
    } else if (error.message.includes('403') || error.message.includes('forbidden')) {
      errorMessage += " Permission denied.";
      suggestions.push("Check GitHub App permissions");
      suggestions.push("Verify the bot has access to this repository");
    } else {
      errorMessage += " An unexpected error occurred.";
    }
    
    // Add technical details for maintainers (in a collapsible section)
    let fullMessage = errorMessage;
    
    if (suggestions.length > 0) {
      fullMessage += "\n\n**Possible solutions:**\n";
      suggestions.forEach(suggestion => {
        fullMessage += `- ${suggestion}\n`;
      });
    }
    
    fullMessage += `\n<details>\n<summary>Technical Details</summary>\n\n`;
    fullMessage += `**Error Type:** ${error.constructor.name}\n`;
    fullMessage += `**Message:** ${error.message}\n`;
    fullMessage += `**Timestamp:** ${new Date().toISOString()}\n`;
    
    if (error.status) {
      fullMessage += `**HTTP Status:** ${error.status}\n`;
    }
    
    if (process.env.NODE_ENV === 'development') {
      fullMessage += `**Stack Trace:**\n\`\`\`\n${error.stack}\n\`\`\`\n`;
    }
    
    fullMessage += `\n</details>`;
    
    try {
      await githubUtils.createIssueComment(fullMessage);
    } catch (commentError) {
      console.error("Failed to post error comment:", commentError);
    }
  }
  
  static logError(error, context = {}) {
    const timestamp = new Date().toISOString();
    const errorInfo = {
      timestamp,
      message: error.message,
      stack: error.stack,
      context
    };
    
    console.error("=== ERROR LOG ===");
    console.error(JSON.stringify(errorInfo, null, 2));
    console.error("================");
  }
  
  static async retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Check if error is retryable
        if (this.isRetryableError(error)) {
          const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error; // Don't retry non-retryable errors
        }
      }
    }
  }
  
  static isRetryableError(error) {
    // Define which errors are worth retrying
    const retryableStatuses = [429, 500, 502, 503, 504];
    const retryableMessages = [
      'timeout',
      'network',
      'ECONNRESET',
      'ENOTFOUND',
      'rate limit'
    ];
    
    if (error.status && retryableStatuses.includes(error.status)) {
      return true;
    }
    
    const message = error.message.toLowerCase();
    return retryableMessages.some(msg => message.includes(msg));
  }
  
  static validateEnvironment() {
    const required = [
      'APP_ID',
      'PRIVATE_KEY',
      'WEBHOOK_SECRET',
      'AZURE_OPENAI_API_KEY',
      'AZURE_OPENAI_ENDPOINT',
      'AZURE_OPENAI_DEPLOYMENT_NAME'
    ];
    
    const missing = required.filter(env => !process.env[env] && !process.env[env + '_PATH']);
    
    if (missing.length > 0) {
      const error = new Error(`Missing required environment variables: ${missing.join(', ')}`);
      this.logError(error, { type: 'configuration', missing });
      return false;
    }
    
    return true;
  }
}

module.exports = ErrorHandler;
