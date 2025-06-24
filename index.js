// index.js
require('dotenv').config();
const AzureOpenAIService = require('./azureOpenAI');
const GitHubUtils = require('./githubUtils');
const ErrorHandler = require('./errorHandler');

module.exports = (app, { getRouter }) => {
    console.log("PR Reviewer Bot initialized - listening for pull request events");
    
    // Validate environment on startup
    if (!ErrorHandler.validateEnvironment()) {
      console.error("❌ Environment validation failed. Please check your .env file.");
      return;
    }
    
    console.log("Environment check:");
    console.log("- APP_ID:", process.env.APP_ID ? "✓ Set" : "✗ Missing");
    console.log("- PRIVATE_KEY:", process.env.PRIVATE_KEY ? "✓ Set" : "✗ Missing");
    console.log("- WEBHOOK_SECRET:", process.env.WEBHOOK_SECRET ? "✓ Set" : "✗ Missing");
    console.log("- AZURE_OPENAI_API_KEY:", process.env.AZURE_OPENAI_API_KEY ? "✓ Set" : "✗ Missing");
    console.log("- AZURE_OPENAI_ENDPOINT:", process.env.AZURE_OPENAI_ENDPOINT ? "✓ Set" : "✗ Missing");
    console.log("- AZURE_OPENAI_DEPLOYMENT_NAME:", process.env.AZURE_OPENAI_DEPLOYMENT_NAME ? "✓ Set" : "✗ Missing");
    
    // Add a health check endpoint at root
    const router = getRouter && getRouter("/");
    if (router) {
        router.get("/", (req, res) => {
            res.json({
                status: "ok",
                message: "PR Reviewer Bot is running",
                webhook_url: "/api/github/webhooks",
                timestamp: new Date().toISOString(),
                features: ["code-review", "azure-openai"],
                version: "2.0.0"
            });
        });
        
        router.get("/health", (req, res) => {
            res.json({ 
              status: "healthy", 
              timestamp: new Date().toISOString(),
              environment: {
                node_version: process.version,
                azure_openai_configured: !!(process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT)
              }
            });
        });
    }

    // Initialize Azure OpenAI service
    let azureOpenAI;
    try {
      azureOpenAI = new AzureOpenAIService();
      console.log("✅ Azure OpenAI service initialized");
    } catch (error) {
      console.error("❌ Failed to initialize Azure OpenAI service:", error.message);
      azureOpenAI = null;
    }

    // Listen for any webhook to see if we're receiving them
    app.onAny(async (context) => {
      console.log(`Webhook received: ${context.name}.${context.payload.action || 'no-action'}`);
    });

    // Main PR opened event handler with code review
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
        
        // Perform code review with error handling
        await ErrorHandler.retryWithBackoff(async () => {
          await performCodeReview(context, githubUtils, azureOpenAI);
        }, 2, 2000);
        
      } catch (error) {
        ErrorHandler.logError(error, { 
          event: 'pull_request.opened',
          repository: context.payload.repository.full_name,
          pr: context.payload.pull_request.number 
        });
        await ErrorHandler.handleReviewError(error, context, githubUtils);
      }
    });

    // Handle PR synchronize events (when new commits are pushed)
    app.on("pull_request.synchronize", async (context) => {
      const githubUtils = new GitHubUtils(context);
      
      try {
        console.log("=== PR UPDATED EVENT ===");
        console.log("Repository:", context.payload.repository.full_name);
        console.log("PR #:", context.payload.pull_request.number);
        
        // Send update notification
        await githubUtils.createIssueComment("🔄 PR updated with new changes. Reviewing the latest changes...");
        
        // Perform code review on updated PR with error handling
        await ErrorHandler.retryWithBackoff(async () => {
          await performCodeReview(context, githubUtils, azureOpenAI);
        }, 2, 2000);
        
      } catch (error) {
        ErrorHandler.logError(error, { 
          event: 'pull_request.synchronize',
          repository: context.payload.repository.full_name,
          pr: context.payload.pull_request.number 
        });
        await ErrorHandler.handleReviewError(error, context, githubUtils);
      }
    });

    // Listen for review requested events
    app.on("pull_request.review_requested", async (context) => {
      const githubUtils = new GitHubUtils(context);
      
      try {
        console.log("=== REVIEW REQUESTED EVENT ===");
        console.log("Repository:", context.payload.repository.full_name);
        console.log("PR #:", context.payload.pull_request.number);
        console.log("Requested reviewer:", context.payload.requested_reviewer?.login);
        
        // Trigger code review when specifically requested
        await githubUtils.createIssueComment("🔍 Code review requested. Analyzing the changes...");
        
        await ErrorHandler.retryWithBackoff(async () => {
          await performCodeReview(context, githubUtils, azureOpenAI);
        }, 2, 2000);
        
      } catch (error) {
        ErrorHandler.logError(error, { 
          event: 'pull_request.review_requested',
          repository: context.payload.repository.full_name,
          pr: context.payload.pull_request.number 
        });
        await ErrorHandler.handleReviewError(error, context, githubUtils);
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
    async function performCodeReview(context, githubUtils, azureOpenAI) {
      if (!azureOpenAI) {
        throw new Error("Azure OpenAI service not initialized. Please check your configuration.");
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

        // Check if PR is too large for comprehensive review
        const totalChanges = relevantFiles.reduce((sum, file) => sum + file.additions + file.deletions, 0);
        const maxChanges = parseInt(process.env.MAX_REVIEW_CHANGES) || 1000;
        
        if (totalChanges > maxChanges) {
          await githubUtils.createIssueComment(`ℹ️ This PR has ${totalChanges} changes, which exceeds the review limit (${maxChanges}). I'll provide a basic overview instead of a detailed review.`);
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
        const overallReview = await azureOpenAI.reviewCode(relevantFiles, pullRequestInfo);
        
        // Create main review comment
        const reviewHeader = `## 🤖 AI Code Review

**Summary:** Reviewed ${relevantFiles.length} files with ${pullRequestInfo.additions} additions and ${pullRequestInfo.deletions} deletions.

**Review Quality:** ${totalChanges <= maxChanges ? 'Comprehensive' : 'Basic Overview'}

`;
        
        await githubUtils.createReviewComment(reviewHeader + overallReview);

        // Create inline comments for specific issues (optional, for smaller PRs)
        const enableInlineComments = process.env.ENABLE_INLINE_COMMENTS !== 'false';
        const maxFilesForInline = parseInt(process.env.MAX_FILES_FOR_INLINE) || 5;
        
        if (enableInlineComments && relevantFiles.length <= maxFilesForInline && totalChanges <= maxChanges) {
          await createInlineComments(relevantFiles, githubUtils, azureOpenAI);
        }

        console.log("✅ Code review completed successfully!");
        
      } catch (error) {
        console.error("Error during code review:", error);
        throw error;
      }
    }

    // Function to create inline comments for specific code sections
    async function createInlineComments(files, githubUtils, azureOpenAI) {
      try {
        console.log("Creating inline comments for detailed review...");
        
        const reviewDelay = parseInt(process.env.REVIEW_DELAY_MS) || 1000;
        let commentsCreated = 0;
        const maxInlineComments = parseInt(process.env.MAX_INLINE_COMMENTS) || 10;
        
        for (const file of files) {
          // Skip files without patches or very small changes
          if (!file.patch || file.additions < 3) {
            continue;
          }

          // Parse the patch to find specific areas that might need review
          const hunks = githubUtils.parseHunks(file.patch);
          
          for (const hunk of hunks) {
            // Stop if we've reached the comment limit
            if (commentsCreated >= maxInlineComments) {
              console.log(`Reached maximum inline comments limit (${maxInlineComments})`);
              return;
            }
            
            // Focus on hunks with significant additions
            if (hunk.addedLines.length >= 3) {
              try {
                const codeContext = hunk.lines
                  .map(line => line.content)
                  .join('\n');
                
                console.log(`Reviewing ${file.filename} lines ${hunk.startLine}-${hunk.startLine + hunk.addedLines.length - 1}`);
                
                const lineReview = await azureOpenAI.reviewSpecificLines(
                  file, 
                  hunk.startLine, 
                  hunk.startLine + hunk.addedLines.length - 1, 
                  codeContext
                );
                
                // Only create inline comment if there are specific suggestions
                if (lineReview && 
                    lineReview.length > 50 && 
                    !lineReview.toLowerCase().includes('looks good') &&
                    !lineReview.toLowerCase().includes('no issues')) {
                  
                  const targetLine = hunk.addedLines[0]; // First added line in the hunk
                  await githubUtils.createInlineComment(
                    file, 
                    targetLine, 
                    `💡 **Code Review Suggestion:**\n\n${lineReview}`
                  );
                  
                  commentsCreated++;
                  console.log(`✅ Created inline comment ${commentsCreated} for ${file.filename}:${targetLine}`);
                  
                  // Add delay to avoid rate limiting
                  if (commentsCreated < maxInlineComments) {
                    await new Promise(resolve => setTimeout(resolve, reviewDelay));
                  }
                }
              } catch (inlineError) {
                console.error(`Error creating inline comment for ${file.filename}:`, inlineError.message);
                
                // If it's a rate limit error, wait longer and continue
                if (inlineError.message.includes('429') || inlineError.message.includes('rate limit')) {
                  console.log("Rate limit hit, waiting before continuing...");
                  await new Promise(resolve => setTimeout(resolve, 5000));
                } else {
                  // Continue with next hunk instead of failing entire review
                  ErrorHandler.logError(inlineError, { 
                    file: file.filename, 
                    hunk: hunk.startLine,
                    type: 'inline_comment' 
                  });
                }
              }
            }
          }
        }
        
        if (commentsCreated > 0) {
          console.log(`✅ Created ${commentsCreated} inline comments`);
        } else {
          console.log("ℹ️ No specific inline comments needed");
        }
        
      } catch (error) {
        console.error("Error creating inline comments:", error);
        ErrorHandler.logError(error, { type: 'inline_comments_batch' });
        // Don't throw error as this is optional functionality
      }
    }
  };
  