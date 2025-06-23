// index.js
module.exports = (app) => {
    app.on("pull_request.opened", async (context) => {
      const prComment = context.issue({ body: "👋 Thanks for opening this PR! We'll take a look soon." });
      await context.octokit.issues.createComment(prComment);
    });
  };
  