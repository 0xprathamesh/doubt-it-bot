import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: true,
});

// In-memory storage for users and issues
const users = {}; // { telegramId: { username, walletAddress, twitter, github, contributions, lastContribution, streak } }
const issues = {}; // { groupId: [{ number, title, status, createdBy, solvedBy, githubIssueUrl }] }

// GitHub API configuration
const GITHUB_API_TOKEN = "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";
const GITHUB_REPO_OWNER = "your-github-username";
const GITHUB_REPO_NAME = "your-repo-name";

// Helper function to update user streak
function updateStreak(userId) {
  const user = users[userId];
  const now = new Date();
  const lastContribution = new Date(user.lastContribution);

  if (now.toDateString() === lastContribution.toDateString()) {
    // Same day contribution, no streak update needed
    return;
  }

  const daysSinceLastContribution = Math.floor((now - lastContribution) / (1000 * 60 * 60 * 24));

  if (daysSinceLastContribution === 1) {
    // Consecutive day contribution
    user.streak += 1;
  } else if (daysSinceLastContribution > 1) {
    // Streak broken
    user.streak = 1;
  }

  user.lastContribution = now;
}

// Helper function to fetch GitHub issue details
async function getGitHubIssueDetails(issueNumber) {
  try {
    const response = await axios.get(`https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/issues/${issueNumber}`, {
      headers: {
        Authorization: `token ${GITHUB_API_TOKEN}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching GitHub issue details:", error);
    return null;
  }
}

// Bot commands and logic

// ... (keep existing command handlers)

// Modify the /createissue command to include GitHub issue creation
bot.onText(/\/createissue (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const issueTitle = match[1];

  if (!users[userId]) {
    bot.sendMessage(chatId, "Please create a profile first using /createprofile.");
    return;
  }

  if (!issues[chatId]) {
    issues[chatId] = [];
  }

  try {
    // Create GitHub issue
    const response = await axios.post(
      `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/issues`,
      {
        title: issueTitle,
        body: `Created by Telegram user: ${users[userId].username}`,
      },
      {
        headers: {
          Authorization: `token ${GITHUB_API_TOKEN}`,
        },
      }
    );

    const issueCount = issues[chatId].length;
    const newIssue = {
      number: issueCount + 1,
      title: issueTitle,
      status: "open",
      createdBy: userId,
      solvedBy: null,
      githubIssueUrl: response.data.html_url,
      githubIssueNumber: response.data.number,
    };

    issues[chatId].push(newIssue);

    // Create embedded message with GitHub issue details
    const issueDetails = await getGitHubIssueDetails(response.data.number);
    const embedMessage = `
🔔 New Issue Created 🔔
Title: ${issueTitle}
GitHub Issue: #${response.data.number}
Status: Open
Created by: ${users[userId].username}

${issueDetails.body}

View on GitHub: ${response.data.html_url}
    `;

    bot.sendMessage(chatId, embedMessage, { parse_mode: "Markdown" });
  } catch (error) {
    console.error("Error creating GitHub issue:", error);
    bot.sendMessage(chatId, "An error occurred while creating the issue on GitHub.");
  }
});

// Modify the /solveissue command to update streak
bot.onText(/\/solveissue (\d+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const issueNumber = parseInt(match[1]);

  if (!users[userId]) {
    bot.sendMessage(chatId, "Please create a profile first using /createprofile.");
    return;
  }

  const issue = issues[chatId].find(
    (issue) => issue.number === issueNumber && issue.status === "in_progress" && issue.solvedBy === userId
  );
  if (!issue) {
    bot.sendMessage(chatId, "Issue not found or not in progress.");
    return;
  }

  issue.status = "solved";
  users[userId].contributions += 1;
  updateStreak(userId);
  
  bot.sendMessage(chatId, `Issue #${issueNumber} has been marked as solved. Your contribution count and streak have been updated. Please use /closeissue ${issueNumber} to close it if you are the creator.`);
});

// Modify the /myprofile command to include streak information
bot.onText(/\/myprofile/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!users[userId]) {
    bot.sendMessage(chatId, "You don't have a profile yet. Please create one using /createprofile.");
    return;
  }

  const { username, walletAddress, twitter, github, contributions, streak } = users[userId];
  const profileData = `
  Here is your profile information:
  Username: ${username}
  Wallet Address: ${walletAddress}
  Twitter: ${twitter}
  GitHub: ${github}
  Contributions: ${contributions}
  Current Streak: ${streak} days
  `;

  bot.sendMessage(chatId, profileData);
});

console.log("Bot is running...");


// import TelegramBot from "node-telegram-bot-api";
// import dotenv from "dotenv";

// dotenv.config();
// const bot = new TelegramBot("7437545638:AAEGY-LldtnRzkBOchtngww6A6DIFwMeF5Y", { polling: true });

// // In-memory storage for users and issues
// const users = {}; // { telegramId: { username, walletAddress, twitter, github, contributions, streak, lastContributionDate } }
// const issues = {}; // { groupId: [{ number, title, description, status, createdBy, solvedBy }] }

// // Bot commands and logic

// // Command: /start
// bot.onText(/\/start/, (msg) => {
//   const chatId = msg.chat.id;
//   const userId = msg.from.id;

//   if (users[userId]) {
//     bot.sendMessage(chatId, "Welcome back! Use /help to see available commands.");
//   } else {
//     bot.sendMessage(chatId, "Welcome! Please create a profile using /createprofile.");
//   }
// });

// // Command: /createprofile
// bot.onText(/\/createprofile/, (msg) => {
//   const chatId = msg.chat.id;
//   const userId = msg.from.id;
//   const username = msg.from.username;

//   if (users[userId]) {
//     bot.sendMessage(chatId, "You already have a profile.");
//     return;
//   }

//   users[userId] = { username, contributions: 0, streak: 0, lastContributionDate: null };
//   bot.sendMessage(chatId, "Please enter your wallet address:");
//   users[userId].step = "walletAddress";
// });

// // Handle profile creation step by step
// bot.on("message", (msg) => {
//   const chatId = msg.chat.id;
//   const userId = msg.from.id;
//   const text = msg.text;

//   if (!users[userId] || !users[userId].step) return;

//   const step = users[userId].step;

//   if (step === "walletAddress") {
//     users[userId].walletAddress = text.trim();
//     users[userId].step = "twitter";
//     bot.sendMessage(chatId, "Please enter your Twitter username:");
//   } else if (step === "twitter") {
//     users[userId].twitter = text.trim();
//     users[userId].step = "github";
//     bot.sendMessage(chatId, "Please enter your GitHub username:");
//   } else if (step === "github") {
//     users[userId].github = text.trim();
//     users[userId].step = null;
//     bot.sendMessage(chatId, "Profile created successfully!");
//   }
// });

// // Command: /createissue
// bot.onText(/\/createissue/, (msg) => {
//   const chatId = msg.chat.id;
//   const userId = msg.from.id;

//   if (!users[userId]) {
//     bot.sendMessage(chatId, "Please create a profile first using /createprofile.");
//     return;
//   }

//   bot.sendMessage(chatId, "Please enter the issue title:");
//   users[userId].issueStep = "title";
//   users[userId].currentIssue = {};
// });

// // Handle issue creation step by step
// bot.on("message", (msg) => {
//   const chatId = msg.chat.id;
//   const userId = msg.from.id;
//   const text = msg.text;

//   if (!users[userId] || !users[userId].issueStep) return;

//   const issueStep = users[userId].issueStep;

//   if (issueStep === "title") {
//     users[userId].currentIssue.title = text.trim();
//     users[userId].issueStep = "description";
//     bot.sendMessage(chatId, "Please enter the issue description:");
//   } else if (issueStep === "description") {
//     users[userId].currentIssue.description = text.trim();
//     users[userId].issueStep = null;

//     if (!issues[chatId]) {
//       issues[chatId] = [];
//     }

//     const issueCount = issues[chatId].length;
//     const newIssue = {
//       number: issueCount + 1,
//       title: users[userId].currentIssue.title,
//       description: users[userId].currentIssue.description,
//       status: "open",
//       createdBy: userId,
//       solvedBy: null,
//     };

//     issues[chatId].push(newIssue);
//     bot.sendMessage(chatId, `Issue #${newIssue.number} created: ${newIssue.title}`);
//   }
// });

// // Command: /listissues
// bot.onText(/\/listissues/, (msg) => {
//   const chatId = msg.chat.id;

//   if (!issues[chatId] || issues[chatId].length === 0) {
//     bot.sendMessage(chatId, "No open issues.");
//     return;
//   }

//   const openIssues = issues[chatId].filter((issue) => issue.status === "open");
//   if (openIssues.length === 0) {
//     bot.sendMessage(chatId, "No open issues.");
//     return;
//   }

//   const issueList = openIssues.map((issue) => `#${issue.number}: ${issue.title}`).join("\n");
//   bot.sendMessage(chatId, `Open issues:\n${issueList}`);
// });

// // Command: /takeissue
// bot.onText(/\/takeissue (\d+)/, (msg, match) => {
//   const chatId = msg.chat.id;
//   const userId = msg.from.id;
//   const issueNumber = parseInt(match[1]);

//   if (!users[userId]) {
//     bot.sendMessage(chatId, "Please create a profile first using /createprofile.");
//     return;
//   }

//   const issue = issues[chatId].find(
//     (issue) => issue.number === issueNumber && issue.status === "open"
//   );
//   if (!issue) {
//     bot.sendMessage(chatId, "Issue not found or already taken.");
//     return;
//   }

//   issue.status = "in_progress";
//   issue.solvedBy = userId;
//   bot.sendMessage(chatId, `Issue #${issueNumber} has been assigned to you.`);
// });

// // Command: /releaseissue
// bot.onText(/\/releaseissue (\d+)/, (msg, match) => {
//   const chatId = msg.chat.id;
//   const userId = msg.from.id;
//   const issueNumber = parseInt(match[1]);

//   if (!users[userId]) {
//     bot.sendMessage(chatId, "Please create a profile first using /createprofile.");
//     return;
//   }

//   const issue = issues[chatId].find(
//     (issue) => issue.number === issueNumber && issue.status === "in_progress" && issue.solvedBy === userId
//   );
//   if (!issue) {
//     bot.sendMessage(chatId, "Issue not found or not in progress.");
//     return;
//   }

//   issue.status = "open";
//   issue.solvedBy = null;
//   bot.sendMessage(chatId, `Issue #${issueNumber} has been released and is now open.`);
// });

// // Command: /solveissue
// bot.onText(/\/solveissue (\d+)/, (msg, match) => {
//   const chatId = msg.chat.id;
//   const userId = msg.from.id;
//   const issueNumber = parseInt(match[1]);

//   if (!users[userId]) {
//     bot.sendMessage(chatId, "Please create a profile first using /createprofile.");
//     return;
//   }

//   const issue = issues[chatId].find(
//     (issue) => issue.number === issueNumber && issue.status === "in_progress" && issue.solvedBy === userId
//   );
//   if (!issue) {
//     bot.sendMessage(chatId, "Issue not found or not in progress.");
//     return;
//   }

//   issue.status = "solved";
//   bot.sendMessage(chatId, `Issue #${issueNumber} has been marked as solved. Please use /closeissue ${issueNumber} to close it if you are the creator.`);
// });

// // Command: /closeissue
// bot.onText(/\/closeissue (\d+)/, (msg, match) => {
//   const chatId = msg.chat.id;
//   const userId = msg.from.id;
//   const issueNumber = parseInt(match[1]);

//   const issue = issues[chatId].find(
//     (issue) => issue.number === issueNumber && issue.status === "solved" && issue.createdBy === userId
//   );

//   if (!issue) {
//     bot.sendMessage(chatId, "Issue not found or you are not authorized to close it.");
//     return;
//   }

//   // Increment the solver's contributions and update streak
//   const solver = users[issue.solvedBy];
//   solver.contributions += 1;

//   const today = new Date().toISOString().split("T")[0];
//   if (solver.lastContributionDate === today) {
//     // Continue streak
//     solver.streak += 1;
//   } else {
//     // Start new streak
//     solver.streak = 1;
//   }
//   solver.lastContributionDate = today;

//   // Remove the issue from the list
//   issues[chatId] = issues[chatId].filter((issue) => issue.number !== issueNumber);

//   bot.sendMessage(chatId, `Issue #${issueNumber} has been closed. The solver's contributions and streak have been updated.`);
// });

// // Command: /myprofile
// bot.onText(/\/myprofile/, (msg) => {
//   const chatId = msg.chat.id;
//   const userId = msg.from.id;

//   if (!users[userId]) {
//     bot.sendMessage(chatId, "Please create a profile first using /createprofile.");
//     return;
//   }

//   const userProfile = users[userId];
//   bot.sendMessage(
//     chatId,
//     `Profile:\nUsername: @${userProfile.username}\nWallet Address: ${userProfile.walletAddress}\nTwitter: ${userProfile.twitter}\nGitHub: ${userProfile.github}\nContributions: ${userProfile.contributions}\nStreak: ${userProfile.streak}`
//   );
// });

// // Command: /profile <username>
// bot.onText(/\/profile (.+)/, (msg, match) => {
//   const chatId = msg.chat.id;
//   const username = match[1];

//   const user = Object.values(users).find((user) => user.username === username);

//   if (!user) {
//     bot.sendMessage(chatId, "Profile not found.");
//     return;
//   }

//   bot.sendMessage(
//     chatId,
//     `Profile:\nUsername: @${user.username}\nWallet Address: ${user.walletAddress}\nTwitter: ${user.twitter}\nGitHub: ${user.github}\nContributions: ${user.contributions}\nStreak: ${user.streak}`
//   );
// });
// bot.onText(/\/help/, (msg) => {
//   const chatId = msg.chat.id;
//   const helpText = `
//   Available commands:
//   /start - Welcome message
//   /createprofile - Create your profile
//   /createissue <title> - Create a new issue
//   /listissues - List open issues
//   /takeissue <number> - Take an issue
//   /releaseissue <number> - Release an issue
//   /solveissue <number> - Mark an issue as solved
//   /closeissue <number> - Close an issue (only by the creator)
//   /myprofile - View your profile
//   /help - Show this help message
//   `;
//   bot.sendMessage(chatId, helpText);
// });

// // Command: /tip <username> <amount>
// bot.onText(/\/tip (.+) (\d+)/, (msg, match) => {
//   const chatId = msg.chat.id;
//   const userId = msg.from.id;
//   const username = match[1];
//   const amount = parseInt(match[2]);

//   if (!users[userId]) {
//     bot.sendMessage(chatId, "Please create a profile first using /createprofile.");
//     return;
//   }

//   const recipient = Object.values(users).find((user) => user.username === username);

//   if (!recipient) {
//     bot.sendMessage(chatId, "User not found.");
//     return;
//   }

//   // Handle tipping logic here (e.g., send tokens)

//   bot.sendMessage(chatId, `You have tipped @${recipient.username} ${amount} tokens.`);
// });
