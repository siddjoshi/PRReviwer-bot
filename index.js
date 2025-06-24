// index.js
require('dotenv').config();

module.exports = (app, { getRouter }) => {
    console.log("Probot app initialized - listening for pull_request.opened events");
    console.log("Environment check:");
    console.log("- APP_ID:", process.env.APP_ID ? "✓ Set" : "✗ Missing");
    console.log("- PRIVATE_KEY:", process.env.PRIVATE_KEY ? "✓ Set" : "✗ Missing");
    console.log("- WEBHOOK_SECRET:", process.env.WEBHOOK_SECRET ? "✓ Set" : "✗ Missing");
    
    // Add a health check endpoint at root
    const router = getRouter && getRouter("/");
    if (router) {
        router.get("/", (req, res) => {
            res.json({
                status: "ok",
                message: "PR Reviewer Bot is running",
                webhook_url: "/api/github/webhooks",
                timestamp: new Date().toISOString()
            });
        });
        
        router.get("/health", (req, res) => {
            res.json({ status: "healthy", timestamp: new Date().toISOString() });
        });
    }
    
    // Listen for any webhook to see if we're receiving them
    app.onAny(async (context) => {
      console.log(`Webhook received: ${context.name}.${context.payload.action || 'no-action'}`);
    });
    
    app.on("pull_request.opened", async (context) => {
      try {
        console.log("=== PR OPENED EVENT ===");
        console.log("Repository:", context.payload.repository.full_name);
        console.log("PR #:", context.payload.pull_request.number);
        console.log("PR Title:", context.payload.pull_request.title);
        console.log("PR Author:", context.payload.pull_request.user.login);
        
        // Check if we have the necessary permissions
        const repo = context.repo();
        console.log("Repository context:", repo);
        
        const prComment = context.issue({ body: "👋 Thanks for opening this PR! We'll take a look soon." });
        console.log("Comment payload:", prComment);
        
        const result = await context.octokit.issues.createComment(prComment);
        console.log("✅ Comment added successfully! Comment ID:", result.data.id);
        console.log("Comment URL:", result.data.html_url);
      } catch (error) {
        console.error("❌ Error adding comment:", error.message);
        if (error.status) {
          console.error("HTTP Status:", error.status);
        }
        if (error.response && error.response.data) {
          console.error("Response data:", error.response.data);
        }
        console.error("Full error:", error);
      }
    });
    
    // Listen for all PR events to debug
    app.on("pull_request", async (context) => {
      console.log(`PR event: ${context.payload.action} on ${context.payload.repository.full_name} #${context.payload.pull_request.number}`);
    });
    
    // Listen for installation events
    app.on("installation", async (context) => {
      console.log(`App installation event: ${context.payload.action}`);
      if (context.payload.repositories) {
        console.log("Repositories:", context.payload.repositories.map(r => r.full_name));
      }
    });
  };
  