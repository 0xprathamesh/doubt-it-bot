# Telegram Bot - Doubt-It

## Overview

This Telegram bot is designed to facilitate profile management, issue tracking, and incentivization within Telegram groups. It’s particularly useful for technical or knowledge-sharing communities where recognition and rewards are essential for fostering engagement and collaboration.

## Features

- **Profile Management**: Create and view profiles with social media handles and crypto wallet addresses.
- **Issue Tracking**: Create, list, take, release, solve, and close issues to collaborate on problem-solving.
- **Incentivization**: sendTip users with tokens to reward their contributions.
- **Security**: Securely retrieve your private key through a private message.

## Commands

### `/start`
- **Description**: Start interacting with the bot and check your profile status.
- **Usage**: `/start`

### `/createprofile`
- **Description**: Create your profile with social media handles and a wallet address.
- **Usage**: `/createprofile`

### `/createissue`
- **Description**: Create a new issue that others can help solve.
- **Usage**: `/createissue <description>`

### `/listissues`
- **Description**: List all open issues in the current group.
- **Usage**: `/listissues`

### `/takeissue`
- **Description**: Take an issue to work on it.
- **Usage**: `/takeissue <issue_id>`

### `/releaseissue`
- **Description**: Release an issue if you cannot solve it.
- **Usage**: `/releaseissue <issue_id>`

### `/solveissue`
- **Description**: Mark an issue as solved.
- **Usage**: `/solveissue <issue_id>`

### `/closeissue`
- **Description**: Close a solved issue (only the issue creator can do this).
- **Usage**: `/closeissue <issue_id>`

### `/profile [username]`
- **Description**: View your profile or another user's profile.
- **Usage**: `/profile` or `/profile <username>`

### `/sendTip`
- **Description**: sendTip another user with a specified amount of tokens.
- **Usage**: `/sendTip <username> <amount>`

### `/getprivatekey`
- **Description**: Get your private key (sent in a private message).
- **Usage**: `/getprivatekey`

### `/help`
- **Description**: Show this help message with a list of available commands.
- **Usage**: `/help`

## How It Works

1. **Getting Started**: Use `/start` to initiate interaction with the bot.
2. **Profile Creation**: Create your profile using `/createprofile`.
3. **Issue Management**: Manage issues through commands like `/createissue`, `/listissues`, `/takeissue`, `/releaseissue`, `/solveissue`, and `/closeissue`.
4. **sendTipping**: Use `/sendTip` to reward others with tokens.
5. **Private Key Security**: Retrieve your private key securely using `/getprivatekey`.

## Security Notice

Your private key is securely stored and will only be sent to you in a private message. Ensure you never share your private key with others.

## Contribution

Contributions to the bot's development are welcome. You can report issues or submit pull requests via the project’s GitHub repository.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

This bot aims to enhance collaboration and recognition within Telegram groups, making it an invaluable tool for community-driven environments.
