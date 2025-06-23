// index.js
require('dotenv').config();
// Probot will use the following environment variables for authentication:
// - APP_ID: Your GitHub App's ID
// - PRIVATE_KEY: Your GitHub App's private key (as a string)
// - WEBHOOK_SECRET: Your GitHub App's webhook secret
// Make sure to set these in your environment or in a .env file (never commit secrets to code)

module.exports = (app) => {
    app.on("pull_request.opened", async (context) => {
      const prComment = context.issue({ body: "👋 Thanks for opening this PR! We'll take a look soon." });
      await context.octokit.issues.createComment(prComment);
    });
  };
  