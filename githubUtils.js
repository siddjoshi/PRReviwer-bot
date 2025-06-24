// githubUtils.js
const diff = require('diff');

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

  async getPullRequestComments() {
    try {
      const { data: comments } = await this.octokit.pulls.listReviewComments({
        owner: this.context.repo().owner,
        repo: this.context.repo().repo,
        pull_number: this.context.payload.pull_request.number,
      });

      return comments;
    } catch (error) {
      console.error('Error fetching PR comments:', error);
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
        event: 'COMMENT', // Use 'COMMENT' for neutral feedback, 'APPROVE' or 'REQUEST_CHANGES' for specific actions
        commit_id: sha
      };

      console.log('Creating review comment:', { body: body.substring(0, 100) + '...' });
      
      const { data: review } = await this.octokit.pulls.createReview(reviewData);
      
      console.log(`✅ Review comment created! Review ID: ${review.id}`);
      return review;
    } catch (error) {
      console.error('Error creating review comment:', error);
      throw error;
    }
  }

  async createInlineComment(file, line, body, side = 'RIGHT') {
    try {
      const commentData = {
        owner: this.context.repo().owner,
        repo: this.context.repo().repo,
        pull_number: this.context.payload.pull_request.number,
        body: body,
        commit_id: this.context.payload.pull_request.head.sha,
        path: file.filename,
        line: line,
        side: side // 'LEFT' for old version, 'RIGHT' for new version
      };

      console.log(`Creating inline comment for ${file.filename}:${line}`);
      
      const { data: comment } = await this.octokit.pulls.createReviewComment(commentData);
      
      console.log(`✅ Inline comment created! Comment ID: ${comment.id}`);
      return comment;
    } catch (error) {
      console.error('Error creating inline comment:', error);
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
    // Filter out files that shouldn't be reviewed (e.g., generated files, large files)
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

    const maxFileSize = 100000; // 100KB limit for review

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

  extractCodeFromPatch(patch) {
    if (!patch) return '';
    
    // Extract only the added lines (starting with +)
    const lines = patch.split('\n');
    const addedLines = lines
      .filter(line => line.startsWith('+') && !line.startsWith('+++'))
      .map(line => line.substring(1)); // Remove the + prefix
    
    return addedLines.join('\n');
  }

  parseHunks(patch) {
    if (!patch) return [];
    
    const hunks = [];
    const lines = patch.split('\n');
    let currentHunk = null;
    let lineNumber = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('@@')) {
        // New hunk header
        const match = line.match(/@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
        if (match) {
          if (currentHunk) {
            hunks.push(currentHunk);
          }
          currentHunk = {
            startLine: parseInt(match[1]),
            lines: [],
            addedLines: []
          };
          lineNumber = parseInt(match[1]);
        }
      } else if (currentHunk) {
        if (line.startsWith('+') && !line.startsWith('+++')) {
          currentHunk.lines.push({
            type: 'added',
            content: line.substring(1),
            lineNumber: lineNumber
          });
          currentHunk.addedLines.push(lineNumber);
          lineNumber++;
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          currentHunk.lines.push({
            type: 'removed',
            content: line.substring(1),
            lineNumber: null
          });
        } else if (line.startsWith(' ')) {
          currentHunk.lines.push({
            type: 'context',
            content: line.substring(1),
            lineNumber: lineNumber
          });
          lineNumber++;
        }
      }
    }

    if (currentHunk) {
      hunks.push(currentHunk);
    }

    return hunks;
  }
}

module.exports = GitHubUtils;
