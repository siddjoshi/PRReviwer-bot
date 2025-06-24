# Deployment Guide for PR Reviewer Bot

## Quick Setup Checklist

### 1. Azure OpenAI Setup
- [ ] Create Azure OpenAI resource in Azure Portal
- [ ] Deploy a model (GPT-4 recommended)
- [ ] Get API key and endpoint URL
- [ ] Note the deployment name

### 2. GitHub App Setup
- [ ] Create a new GitHub App in your GitHub settings
- [ ] Set webhook URL: `https://your-domain.com/api/github/webhooks`
- [ ] Configure permissions (see below)
- [ ] Generate and download private key
- [ ] Install app on repositories

### 3. Environment Configuration
- [ ] Copy `.env.example` to `.env`
- [ ] Fill in all required values
- [ ] Test configuration with `npm run test`

### 4. Deployment Options

#### Option A: Local Development
```bash
npm install
npm run validate  # Check configuration
npm run test     # Test Azure OpenAI connection
npm start        # Start the bot
```

#### Option B: Heroku Deployment
```bash
# Create Heroku app
heroku create your-pr-reviewer-bot

# Set environment variables
heroku config:set APP_ID=your_app_id
heroku config:set PRIVATE_KEY="$(cat private-key.pem)"
heroku config:set WEBHOOK_SECRET=your_webhook_secret
heroku config:set AZURE_OPENAI_API_KEY=your_api_key
heroku config:set AZURE_OPENAI_ENDPOINT=your_endpoint
heroku config:set AZURE_OPENAI_DEPLOYMENT_NAME=your_deployment

# Deploy
git push heroku main
```

#### Option C: Docker Deployment
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## GitHub App Permissions

### Repository Permissions
- **Contents**: Read (to access file contents)
- **Pull requests**: Read & Write (to read PRs and post reviews)
- **Issues**: Read & Write (to post comments)
- **Metadata**: Read (basic repository info)

### Subscribe to Events
- **Pull request** (for opened, synchronize events)
- **Pull request review** (for review_requested events)

## Environment Variables Reference

### Required
```bash
# GitHub App
APP_ID=12345
PRIVATE_KEY_PATH=./private-key.pem
WEBHOOK_SECRET=your_webhook_secret

# Azure OpenAI
AZURE_OPENAI_API_KEY=your_api_key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
```

### Optional
```bash
# Performance tuning
AZURE_OPENAI_API_VERSION=2024-02-15-preview
MAX_FILES_TO_REVIEW=10
MAX_FILE_SIZE_KB=100
MAX_REVIEW_CHANGES=1000
MAX_INLINE_COMMENTS=10
REVIEW_DELAY_MS=1000

# Features
ENABLE_INLINE_COMMENTS=true
MAX_FILES_FOR_INLINE=5

# Server
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
```

## Testing the Setup

### 1. Validate Configuration
```bash
npm run validate
```

### 2. Test Azure OpenAI Connection
```bash
npm run test
```

### 3. Test with Real PR
1. Create a test repository
2. Install your GitHub App
3. Open a PR with some code changes
4. Check the bot responds with a review

## Troubleshooting

### Common Issues

#### "Azure OpenAI connection failed"
- Check API key and endpoint URL
- Verify deployment name exists
- Check Azure OpenAI resource status

#### "GitHub API 403 Forbidden"
- Verify app permissions
- Check if app is installed on the repository
- Validate private key and app ID

#### "Webhook not received"
- Check webhook URL is accessible
- Verify webhook secret matches
- Check GitHub App webhook configuration

#### "Rate limit exceeded"
- Increase `REVIEW_DELAY_MS`
- Reduce `MAX_INLINE_COMMENTS`
- Upgrade Azure OpenAI pricing tier

### Debug Mode
Set `LOG_LEVEL=debug` and `NODE_ENV=development` for detailed logging.

## Monitoring

### Health Checks
- `GET /health` - Basic health status
- `GET /` - Detailed status with configuration info

### Logs to Monitor
- PR processing events
- Azure OpenAI API calls
- Error rates and types
- Performance metrics

## Security Best Practices

1. **Never commit secrets** to version control
2. **Use environment variables** for all sensitive data
3. **Rotate keys regularly** (GitHub private key, Azure OpenAI key)
4. **Monitor API usage** and set up alerts
5. **Use HTTPS** for all webhook endpoints
6. **Validate webhook signatures** (handled by Probot)

## Cost Optimization

### Azure OpenAI
- Use GPT-3.5-turbo for cost-effective reviews
- Set reasonable limits on review size
- Monitor token usage

### GitHub API
- Respect rate limits
- Cache results when possible
- Use conditional requests

## Scaling Considerations

For high-volume usage:
- Use Redis for caching
- Implement queue system for reviews
- Consider multiple deployment regions
- Monitor and optimize token usage
