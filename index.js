// index.js
require('dotenv').config();
const GitHubCopilotService = require('./githubCopilotService');
const GitHubUtils = require('./githubUtils');

module.exports = (app, { getRouter }) => {
    console.log("PR Reviewer Bot initialized - listening for pull request events");
    console.log("Environment check:");
    console.log("- APP_ID:", process.env.APP_ID ? "✓ Set" : "✗ Missing");
    console.log("- PRIVATE_KEY:", process.env.PRIVATE_KEY ? "✓ Set" : "✗ Missing");
    console.log("- WEBHOOK_SECRET:", process.env.WEBHOOK_SECRET ? "✓ Set" : "✗ Missing");
    console.log("- PAT_TOKEN:", process.env.PAT_TOKEN ? "✓ Set" : "✗ Missing");
    console.log("- COPILOT_INTEGRATION_ID:", process.env.COPILOT_INTEGRATION_ID ? "✓ Set" : "✗ Missing");
    
    // Add a health check endpoint at root
    const router = getRouter && getRouter("/");
    if (router) {
        router.get("/", (req, res) => {
            res.json({
                status: "ok",
                message: "PR Reviewer Bot is running with GitHub Copilot",
                webhook_url: "/api/github/webhooks",
                timestamp: new Date().toISOString(),
                features: ["code-review", "github-copilot"],
                version: "2.0.0"
            });
        });
        
        router.get("/health", (req, res) => {
            res.json({ 
              status: "healthy", 
              timestamp: new Date().toISOString(),
              environment: {
                node_version: process.version,
                github_copilot_configured: !!(process.env.PAT_TOKEN)
              }
            });
        });
    }

    // Initialize GitHub Copilot service
    let githubCopilot;
    try {
      githubCopilot = new GitHubCopilotService();
      console.log("✅ GitHub Copilot service initialized");
    } catch (error) {
      console.error("❌ Failed to initialize GitHub Copilot service:", error.message);
      githubCopilot = null;
    }

    // Listen for any webhook to see if we're receiving them
    app.onAny(async (context) => {
      console.log(`Webhook received: ${context.name}.${context.payload.action || 'no-action'}`);
    });
    
    app.on("pull_request.opened", async (context) => {
      const githubUtils = new GitHubUtils(context);
      
      try {
        console.log("=== PR OPENED EVENT ===");
        console.log("Repository:", context.payload.repository.full_name);
        console.log("PR #:", context.payload.pull_request.number);
        console.log("PR Title:", context.payload.pull_request.title);
        console.log("PR Author:", context.payload.pull_request.user.login);
        
        // Send initial welcome comment
        await githubUtils.createIssueComment("👋 Thanks for opening this PR! I'm analyzing the changes and will provide a code review shortly...");
        
        // Perform code review
        await performCodeReview(context, githubUtils, githubCopilot);
        
      } catch (error) {
        console.error("❌ Error during PR review:", error.message);
        await githubUtils.createIssueComment(`⚠️ I encountered an error while reviewing this PR: ${error.message}\n\nPlease check the logs for more details.`);
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

    // Main code review function
    async function performCodeReview(context, githubUtils, githubCopilot) {
      if (!githubCopilot) {
        throw new Error("GitHub Copilot service not initialized. Please check your PAT_TOKEN configuration.");
      }
      
      try {
        console.log("Starting comprehensive code review...");
        
        // Get PR files
        const files = await githubUtils.getPullRequestFiles();
        console.log(`Found ${files.length} files in PR`);
        
        // Filter relevant files for review
        const relevantFiles = githubUtils.filterRelevantFiles(files);
        console.log(`Reviewing ${relevantFiles.length} relevant files`);
        
        if (relevantFiles.length === 0) {
          await githubUtils.createIssueComment("ℹ️ No reviewable code changes found in this PR (only configuration files, generated files, or very large files).");
          return;
        }

        // Prepare PR info for review
        const pullRequestInfo = {
          title: context.payload.pull_request.title,
          body: context.payload.pull_request.body,
          user: context.payload.pull_request.user,
          additions: context.payload.pull_request.additions,
          deletions: context.payload.pull_request.deletions,
          changed_files: context.payload.pull_request.changed_files
        };

        // Perform overall code review
        console.log("Generating overall code review...");
        const overallReview = await githubCopilot.reviewCode(relevantFiles, pullRequestInfo);
        
        // Create main review comment
        const reviewHeader = `## 🤖 AI Code Review (GitHub Copilot)

**Summary:** Reviewed ${relevantFiles.length} files with ${pullRequestInfo.additions} additions and ${pullRequestInfo.deletions} deletions.

`;
        
        await githubUtils.createReviewComment(reviewHeader + overallReview);

        console.log("✅ Code review completed successfully!");
        
      } catch (error) {
        console.error("Error during code review:", error);
        throw error;
      }
    }
  };
  