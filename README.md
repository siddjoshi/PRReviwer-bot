# PR Reviewer Bot

An intelligent GitHub App built with [Probot](https://probot.github.io/) that automatically performs AI-powered code reviews on pull requests using Azure OpenAI service.

## Features
- 🤖 **AI-Powered Code Review**: Uses Azure OpenAI to analyze code changes and provide intelligent feedback
- 🔍 **Comprehensive Analysis**: Reviews code quality, best practices, potential bugs, and security issues
- 💬 **Detailed Comments**: Provides both overall PR reviews and inline comments on specific code sections
- 🚀 **Multi-Event Support**: Triggers on PR opened, updated, and review requested events
- 📊 **Smart Filtering**: Automatically filters out generated files, lock files, and overly large files
- ⚡ **Performance Optimized**: Includes rate limiting and configurable review settings

## Prerequisites

1. **Azure OpenAI Service**: You need an active Azure OpenAI resource with a deployed model (GPT-4 recommended)
2. **GitHub App**: A GitHub App with appropriate permissions for reading repositories and creating comments

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   - Copy `.env.example` to `.env`
   - Fill in your configuration:

   ```bash
   # GitHub App Configuration
   APP_ID=your_app_id
   PRIVATE_KEY_PATH=./private-key.pem
   WEBHOOK_SECRET=your_webhook_secret
   
   # Azure OpenAI Configuration
   AZURE_OPENAI_API_KEY=your_azure_openai_api_key
   AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com
   AZURE_OPENAI_DEPLOYMENT_NAME=your_deployment_name
   AZURE_OPENAI_API_VERSION=2024-02-15-preview
   ```

3. **Set up GitHub App permissions:**
   Your GitHub App needs the following permissions:
   - **Repository permissions:**
     - Contents: Read
     - Pull requests: Read & Write
     - Issues: Read & Write
   - **Subscribe to events:**
     - Pull request
     - Pull request review
     - Pull request review comment

4. **Run the bot locally:**
   ```bash
   npm start
   ```

## Azure OpenAI Setup

1. **Create Azure OpenAI Resource:**
   - Go to Azure Portal
   - Create a new Azure OpenAI Service resource
   - Note the endpoint URL and API key

2. **Deploy a Model:**
   - In Azure OpenAI Studio, deploy a model (GPT-4 recommended for best results)
   - Note the deployment name

3. **Configure Environment:**
   - Set `AZURE_OPENAI_ENDPOINT` to your resource endpoint
   - Set `AZURE_OPENAI_API_KEY` to your API key
   - Set `AZURE_OPENAI_DEPLOYMENT_NAME` to your model deployment name

## Webhook Configuration

When setting up your GitHub App webhook, use:
- **Webhook URL**: `https://your-domain.com/api/github/webhooks`
- **Health Check**: `https://your-domain.com/` or `https://your-domain.com/health`

## How it Works

### Code Review Process

1. **Trigger**: When a PR is opened, updated, or review is requested
2. **Analysis**: The bot fetches all changed files and filters relevant code files
3. **AI Review**: Sends code changes to Azure OpenAI for comprehensive analysis
4. **Feedback**: Posts detailed review comments including:
   - Overall PR assessment
   - Code quality feedback
   - Security and performance suggestions
   - Best practice recommendations
   - Inline comments for specific code sections (for smaller PRs)

### Supported Events

- `pull_request.opened` - Initial code review when PR is created
- `pull_request.synchronize` - Re-review when new commits are pushed
- `pull_request.review_requested` - Manual review trigger

### Smart Filtering

The bot automatically skips:
- Generated files (e.g., `*.min.js`, `*.bundle.js`)
- Lock files (`package-lock.json`, `yarn.lock`)
- Large files (>500 changes by default)
- Binary files
- Files in `node_modules`, `dist`, `build` directories

## Configuration Options

You can customize the bot behavior with these environment variables:

```bash
# Review settings
MAX_FILES_TO_REVIEW=10          # Maximum files to review per PR
MAX_FILE_SIZE_KB=100           # Skip files larger than this
ENABLE_INLINE_COMMENTS=true    # Enable detailed inline comments
REVIEW_DELAY_MS=1000          # Delay between API calls to avoid rate limiting
```

## Example Review Output

The bot provides structured feedback like:

```markdown
## 🤖 AI Code Review

**Summary:** Reviewed 3 files with 45 additions and 12 deletions.

### Overall Assessment
This PR introduces new authentication middleware with good security practices...

### Key Findings
- ✅ Good use of bcrypt for password hashing
- ⚠️ Consider adding input validation for email format
- 🔒 JWT secret should be stored in environment variables
- � Add error handling for database operations

## Deployment

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

### Quick Start

1. **Test your configuration:**
   ```bash
   npm run validate  # Check environment variables
   npm run test     # Test Azure OpenAI connection
   ```

2. **Start locally:**
   ```bash
   npm start
   ```

3. **Deploy to production:**
   - See deployment guide for Heroku, Docker, or other platforms
   - Don't forget to set up ngrok or similar for local development

## Troubleshooting

### Common Issues
- **"Azure OpenAI connection failed"**: Check your API key and endpoint
- **"GitHub API 403"**: Verify app permissions and installation
- **"Rate limit exceeded"**: Increase delay settings or upgrade Azure OpenAI tier

### Debug Mode
Set `NODE_ENV=development` and `LOG_LEVEL=debug` for detailed logging.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Test your changes locally
4. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.
```

## Files
- `index.js`: Main entry point for the GitHub App logic.
- `package.json`: Project metadata and dependencies.

## License
MIT
