# 🤖 AI PR Reviewer Bot with GitHub Copilot

An intelligent GitHub App built with [Probot](https://probot.github.io/) that automatically performs comprehensive AI-powered code reviews on pull requests using the **GitHub Copilot API**. Get instant, detailed feedback on code quality, security issues, best practices, and performance optimizations.

## 🌟 Features

- 🧠 **AI-Powered Code Reviews**: Leverages GitHub Copilot API for intelligent analysis
- 🔍 **Comprehensive Analysis**: Reviews code quality, security, performance, and best practices
- 💬 **Detailed Feedback**: Provides actionable suggestions with clear explanations
- ⚡ **Real-time Processing**: Triggered automatically on PR events (open, update, review request)
- 🎯 **Smart Filtering**: Automatically excludes generated files, dependencies, and large files
- 🛡️ **Error Handling**: Graceful error management with helpful user feedback
- 📊 **Health Monitoring**: Built-in health checks and detailed logging
- 🔧 **Configurable**: Customizable review settings and thresholds

## 📋 Prerequisites

Before setting up the bot, ensure you have:

1. **Node.js** (v16 or higher)
2. **GitHub Account** with repository admin access
3. **GitHub Copilot API Access** (beta access may be required)
4. **Web server** for webhook delivery (ngrok for local development)

## 🚀 Quick Start

### Step 1: Clone and Install

```bash
git clone <your-repo-url>
cd PRReviwer-bot
npm install
```

### Step 2: Create GitHub App

Follow the [detailed GitHub App setup guide](#-github-app-setup-guide) below.

### Step 3: Configure Environment

```bash
cp .env.example .env
# Edit .env with your GitHub App credentials
```

### Step 4: Start the Bot

```bash
npm start
```

## 📚 GitHub App Setup Guide

### Creating Your GitHub App

1. **Navigate to GitHub Settings**
   - Go to https://github.com/settings/apps
   - Click "New GitHub App"

2. **Basic Information**
   ```
   GitHub App name: PR Reviewer Bot (or your preferred name)
   Description: AI-powered code review assistant using GitHub Copilot
   Homepage URL: https://your-domain.com (or your ngrok URL for testing)
   ```

3. **Webhook Configuration**
   ```
   Webhook URL: https://your-domain.com/api/github/webhooks
   Webhook secret: Generate a secure random string (save this for .env)
   SSL verification: Enable (recommended)
   ```

   **For Local Development with ngrok:**
   ```bash
   # Install ngrok (if not already installed)
   npm install -g ngrok
   
   # In a separate terminal, expose port 3000
   ngrok http 3000
   
   # Use the HTTPS URL provided by ngrok
   # Example: https://abc123.ngrok.io/api/github/webhooks
   ```

4. **Repository Permissions**
   
   Set the following permissions:
   
   | Permission | Access Level | Purpose |
   |------------|--------------|---------|
   | **Contents** | Read | Access repository files and code |
   | **Issues** | Write | Create comments on pull requests |
   | **Pull requests** | Write | Read PR details and create reviews |
   | **Metadata** | Read | Access basic repository information |

5. **Subscribe to Events**
   
   Select these webhook events:
   - ✅ **Pull request** (for PR opened, updated, etc.)
   - ✅ **Pull request review** (for review requested events)

6. **App Visibility**
   - Choose "Only on this account" for private use
   - Or "Any account" if you want to make it publicly available

7. **Create the App**
   - Click "Create GitHub App"
   - **Important**: Note down your **App ID** from the app's settings page

### Generating and Downloading Private Key

1. **After creating the app**, scroll down to the "Private keys" section
2. Click "Generate a private key"
3. Download the `.pem` file
4. **Rename** the downloaded file to `private-key.pem`
5. **Move** it to your project root directory

### Installing the App on Repositories

1. **From your app's settings page**, click "Install App" in the left sidebar
2. **Select the account/organization** where you want to install it
3. **Choose repositories**:
   - Select "All repositories" for organization-wide installation
   - Or "Only select repositories" and choose specific repos
4. **Click "Install"**

### Getting Your GitHub Copilot Token

1. **Generate a Personal Access Token** with Copilot API access:
   - Go to https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Select scopes: Check any required scopes for Copilot API access
   - **Note**: You may need beta access to GitHub Copilot API

2. **Alternative**: Use a GitHub App token with Copilot permissions (if available)

## ⚙️ Configuration

### Environment Variables Setup

Create a `.env` file in your project root:

```bash
# GitHub App Configuration
APP_ID=your_app_id_here
WEBHOOK_SECRET=your_webhook_secret_here
PRIVATE_KEY_PATH=./private-key.pem   # GitHub Copilot API Configuration
   PAT_TOKEN=your_github_token_here
   COPILOT_INTEGRATION_ID=your_integration_id_here

# Server Configuration (optional)
PORT=3000

# Review Settings (optional)
MAX_REVIEW_CHANGES=1000
MAX_FILES_FOR_INLINE=5
MAX_INLINE_COMMENTS=10
ENABLE_INLINE_COMMENTS=true
REVIEW_DELAY_MS=1000
```

### Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `APP_ID` | GitHub App ID from app settings | ✅ Yes | - |
| `WEBHOOK_SECRET` | Secret for webhook verification | ✅ Yes | - |
| `PRIVATE_KEY_PATH` | Path to GitHub App private key | ✅ Yes | `./private-key.pem` |
| `PAT_TOKEN` | GitHub token with Copilot API access | ✅ Yes | - |
| `COPILOT_INTEGRATION_ID` | Copilot API integration identifier | ✅ Yes | - |
| `PORT` | Server port | No | `3000` |
| `MAX_REVIEW_CHANGES` | Maximum changes to review in detail | No | `1000` |
| `MAX_FILES_FOR_INLINE` | Max files for inline comments | No | `5` |
| `MAX_INLINE_COMMENTS` | Max inline comments per PR | No | `10` |
| `ENABLE_INLINE_COMMENTS` | Enable line-specific comments | No | `true` |
| `REVIEW_DELAY_MS` | Delay between API calls (rate limiting) | No | `1000` |

## 🧪 Testing Your Setup

### 1. Validate Configuration

```bash
npm test
```

This will check:
- Environment variables
- GitHub Copilot API connectivity
- Service initialization
- Sample code review generation

### 2. Test with Raw curl

```bash
node test-raw-curl.js
```

### 3. Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-06-24T06:56:16.759Z",
  "environment": {
    "node_version": "v22.16.0",
    "github_copilot_configured": true
  }
}
```

### 4. Create a Test Pull Request

1. **Create a test repository** where your app is installed
2. **Make some code changes** and create a pull request
3. **Check that the bot**:
   - Posts a welcome comment
   - Analyzes the code changes
   - Provides detailed review feedback

## 🎯 Usage

### Automatic Reviews

The bot automatically triggers on:
- **PR Opened**: When a new pull request is created
- **PR Updated**: When new commits are pushed to an existing PR
- **Review Requested**: When someone requests a review

### Review Output

The bot provides:

1. **Overall Assessment**
   - Code quality summary
   - Security analysis
   - Performance considerations

2. **Detailed Feedback**
   - File-by-file analysis
   - Best practice recommendations
   - Specific improvement suggestions

3. **Inline Comments** (optional)
   - Line-specific feedback
   - Targeted suggestions for code sections

### Example Review Output

```markdown
## 🤖 AI Code Review (GitHub Copilot)

**Summary:** Reviewed 3 files with 45 additions and 12 deletions.

### Code Quality Assessment
The overall code quality is good with proper error handling and clear variable naming...

### Security Analysis
- ✅ No obvious security vulnerabilities found
- ⚠️  Consider validating user input in the `processData` function

### Performance Considerations
- 💡 The database query in `getUserData` could benefit from indexing
- ⚡ Consider implementing caching for frequently accessed data

### Recommendations
1. Add unit tests for the new functionality
2. Consider extracting the validation logic into a separate module
3. Update documentation to reflect the new API endpoints
```

## 🔧 Customization

### Modifying Review Prompts

Edit `githubCopilotService.js` to customize review prompts:

```javascript
createReviewPrompt(changes, pullRequestInfo) {
  // Customize the prompt sent to GitHub Copilot
  // Add specific instructions, coding standards, etc.
}
```

### Adding Custom Filters

Modify `githubUtils.js` to add custom file filtering:

```javascript
filterRelevantFiles(files) {
  // Add custom logic to include/exclude specific files
  // Example: Skip test files, focus on specific extensions
}
```

### Webhook Event Handling

Extend `index.js` to handle additional GitHub events:

```javascript
// Add handlers for other events
app.on("pull_request.closed", async (context) => {
  // Handle PR closure
});
```

## 🛠️ Development

### Local Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up ngrok for webhooks**:
   ```bash
   ngrok http 3000
   ```

3. **Update GitHub App webhook URL** with your ngrok URL

4. **Start development server**:
   ```bash
   npm run dev
   ```

### Scripts

- `npm start` - Start the production server
- `npm run dev` - Start with development mode (auto-restart)
- `npm test` - Run configuration and API tests
- `npm run validate` - Validate environment setup

### File Structure

```
PRReviwer-bot/
├── index.js                 # Main application entry point
├── githubCopilotService.js  # GitHub Copilot API service
├── githubUtils.js           # GitHub API utilities
├── package.json             # Dependencies and scripts
├── .env                     # Environment configuration
├── private-key.pem          # GitHub App private key
├── test-github-copilot.js   # API connectivity tests
├── test-exact-curl.js       # curl format validation
├── test-raw-curl.js         # Raw curl command test
└── README.md               # This documentation
```

## 🐛 Troubleshooting

### Common Issues

#### 1. "GitHub Copilot service not initialized"
**Cause**: Missing or invalid `PAT_TOKEN`
**Solution**:
- Verify `PAT_TOKEN` is set in `.env`
- Check token has Copilot API access
- Ensure token is not expired

#### 2. "Unknown integration" error
**Cause**: Invalid `COPILOT_INTEGRATION_ID`
**Solution**:
- Verify you have access to GitHub Copilot API
- Contact GitHub support for correct integration ID
- Try removing the integration ID header temporarily

#### 3. Webhooks not received
**Cause**: Webhook URL configuration issues
**Solution**:
- Verify webhook URL is correct and accessible
- Check webhook secret matches `.env` configuration
- Ensure server is running and reachable
- For ngrok: restart ngrok and update GitHub App settings

#### 4. "Permission denied" errors
**Cause**: Insufficient GitHub App permissions
**Solution**:
- Review GitHub App permissions settings
- Ensure app is installed on target repositories
- Check that app has "Pull requests: Write" permission

#### 5. Rate limiting issues
**Cause**: Too many API calls in short period
**Solution**:
- Increase `REVIEW_DELAY_MS` setting
- Reduce `MAX_INLINE_COMMENTS` setting
- Implement exponential backoff (already included)

### Debug Mode

Enable detailed logging by setting:
```bash
LOG_LEVEL=debug npm start
```

### Checking Logs

The application provides detailed logging:
- ✅ Webhook events received
- 📤 API requests sent
- 📥 API responses received
- ❌ Error details with stack traces

## 🔒 Security Considerations

### Token Security
- ✅ Keep tokens in `.env` file (gitignored)
- ✅ Never commit tokens to version control
- ✅ Use environment variables in production
- ✅ Rotate tokens regularly

### Webhook Security
- ✅ Use webhook secrets for verification
- ✅ Enable SSL verification
- ✅ Validate payload signatures

### App Permissions
- ✅ Grant minimal required permissions
- ✅ Regularly audit app installations
- ✅ Monitor app activity logs

## 🚀 Deployment

### Production Deployment

1. **Choose a hosting platform**:
   - Heroku, AWS, Google Cloud, etc.

2. **Set environment variables** on your platform

3. **Update GitHub App webhook URL** to production URL

4. **Deploy your application**

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables in Production

For production, set environment variables through your hosting platform rather than `.env` files.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests for new functionality
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Probot](https://probot.github.io/) - GitHub App framework
- [GitHub Copilot API](https://docs.github.com/en/copilot) - AI-powered code analysis
- [GitHub Apps](https://docs.github.com/en/developers/apps) - GitHub integration platform

## 📞 Support

- 📫 **Issues**: [GitHub Issues](https://github.com/your-username/PRReviwer-bot/issues)
- 📖 **Documentation**: [GitHub Wiki](https://github.com/your-username/PRReviwer-bot/wiki)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/your-username/PRReviwer-bot/discussions)

---

**Built with ❤️ for better code reviews**
