# PR Reviewer Bot

This is a simple GitHub App built with [Probot](https://probot.github.io/) that automatically comments on newly opened pull requests.

## Features
- Listens for the `pull_request.opened` event.
- Posts a friendly comment to welcome contributors when a new pull request is opened.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   - Copy `.env.example` to `.env` if it doesn't exist
   - Fill in your GitHub App credentials in the `.env` file:
     - `APP_ID`: Your GitHub App ID
     - `PRIVATE_KEY_PATH`: Path to your private key file
     - `WEBHOOK_SECRET`: Your webhook secret
     - `PORT`: Port to run the app (default: 3000)

3. **Run the bot locally:**
   ```bash
   npm start
   ```

## Webhook Configuration

When setting up your GitHub App webhook, use these endpoints:
- **Webhook URL**: `https://your-domain.com/api/github/webhooks` (default Probot endpoint)
- **Health Check**: `https://your-domain.com/` or `https://your-domain.com/health`

**Important**: Do not send webhooks to the root `/` path for POST requests. GitHub webhooks should go to `/api/github/webhooks`.

## Usage
1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Run the bot locally:**
   ```bash
   npm start
   ```
3. **Deploy or install the app on your GitHub repository.**

## How it works
When a pull request is opened, the bot comments:
> 👋 Thanks for opening this PR! We'll take a look soon.

## Files
- `index.js`: Main entry point for the GitHub App logic.
- `package.json`: Project metadata and dependencies.

## License
MIT
