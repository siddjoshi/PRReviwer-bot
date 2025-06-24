// githubUtils.js
class GitHubUtils {
  constructor(context) {
    this.context = context;
    this.octokit = context.octokit;
  }

  async getPullRequestFiles() {
    try {
      const { data: files } = await this.octokit.pulls.listFiles({
        owner: this.context.repo().owner,
        repo: this.context.repo().repo,
        pull_number: this.context.payload.pull_request.number,
      });

      console.log(`Retrieved ${files.length} files from PR #${this.context.payload.pull_request.number}`);
      return files;
    } catch (error) {
      console.error('Error fetching PR files:', error);
      throw error;
    }
  }

  async createReviewComment(body, commitSha = null) {
    try {
      const sha = commitSha || this.context.payload.pull_request.head.sha;
      
      const reviewData = {
        owner: this.context.repo().owner,
        repo: this.context.repo().repo,
        pull_number: this.context.payload.pull_request.number,
        body: body,
        event: 'COMMENT',
        commit_id: sha
      };

      console.log('Creating review comment...');
      
      const { data: review } = await this.octokit.pulls.createReview(reviewData);
      
      console.log(`✅ Review comment created! Review ID: ${review.id}`);
      return review;
    } catch (error) {
      console.error('Error creating review comment:', error);
      throw error;
    }
  }

  async createIssueComment(body) {
    try {
      const commentData = {
        owner: this.context.repo().owner,
        repo: this.context.repo().repo,
        issue_number: this.context.payload.pull_request.number,
        body: body
      };

      console.log('Creating issue comment...');
      
      const { data: comment } = await this.octokit.issues.createComment(commentData);
      
      console.log(`✅ Issue comment created! Comment ID: ${comment.id}`);
      return comment;
    } catch (error) {
      console.error('Error creating issue comment:', error);
      throw error;
    }
  }

  filterRelevantFiles(files) {
    // Filter out files that shouldn't be reviewed
    const excludePatterns = [
      /node_modules/,
      /\.lock$/,
      /package-lock\.json$/,
      /yarn\.lock$/,
      /\.min\.js$/,
      /\.min\.css$/,
      /\.bundle\.js$/,
      /dist\//,
      /build\//,
      /\.generated\./,
      /\.auto\./
    ];

    return files.filter(file => {
      // Skip deleted files
      if (file.status === 'removed') {
        return false;
      }

      // Skip files that match exclude patterns
      if (excludePatterns.some(pattern => pattern.test(file.filename))) {
        console.log(`Skipping file due to exclude pattern: ${file.filename}`);
        return false;
      }

      // Skip files that are too large
      if (file.changes > 500) {
        console.log(`Skipping large file: ${file.filename} (${file.changes} changes)`);
        return false;
      }

      return true;
    });
  }
}

module.exports = GitHubUtils;
