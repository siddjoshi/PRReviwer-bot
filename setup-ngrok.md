# Local Development Setup

## Using ngrok for webhook testing

1. **Install ngrok:**
   ```bash
   npm install -g ngrok
   ```

2. **Start your bot:**
   ```bash
   npm start
   ```

3. **In another terminal, expose your local server:**
   ```bash
   ngrok http 3002
   ```

4. **Update GitHub App webhook URL:**
   - Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)
   - Go to GitHub App settings
   - Set Webhook URL to: `https://abc123.ngrok.io/`
   - **Important**: Use the root path `/`, not `/probot`

5. **Test by creating a PR in your repository**

## Alternative: Using GitHub Codespaces/VS Code Ports

If using GitHub Codespaces or VS Code with port forwarding:
- Forward port 3002
- Make it public
- Use the forwarded URL as webhook URL (root path)

## Webhook URL Examples:
- ✅ Correct: `https://abc123.ngrok.io/`
- ✅ Correct: `https://your-domain.com/`
- ❌ Wrong: `https://abc123.ngrok.io/probot`
- ❌ Wrong: `https://your-domain.com/probot`
