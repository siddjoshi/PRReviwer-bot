# PR Reviewer Bot

This is a simple GitHub App built with [Probot](https://probot.github.io/) that automatically comments on newly opened pull requests.

## Features
- Listens for the `pull_request.opened` event.
- Posts a friendly comment to welcome contributors when a new pull request is opened.

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
