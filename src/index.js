// import TelegramBot from "node-telegram-bot-api";

// // const token = "7437545638:AAEGY-LldtnRzkBOchtngww6A6DIFwMeF5Y";
// // // Create a bot that uses 'polling' to fetch new updates
// // const bot = new TelegramBot(token, { polling: true });
// // bot.on("message", (message) => {
// //     console.log(message.text);

// const token = "7437545638:AAEGY-LldtnRzkBOchtngww6A6DIFwMeF5Y";

// const bot = new TelegramBot(token, { polling: true });

// let profiles = {}; // Stores user profiles
// let groupIssues = {}; // Stores issues separately for each group

// // Command to create a user profile
// bot.onText(/\/start/, (msg) => {
//   const chatId = msg.chat.id;
//   const userId = msg.from.id;

//   if (!profiles[userId]) {
//     bot.sendMessage(chatId, "Welcome! Let's create your profile.");
//     bot.sendMessage(chatId, "Please enter your wallet address:");

//     bot.once("message", (msg) => {
//       profiles[userId] = { walletAddress: msg.text };

//       bot.sendMessage(chatId, "Please enter your Twitter username:");

//       bot.once("message", (msg) => {
//         profiles[userId].twitter = msg.text;

//         bot.sendMessage(chatId, "Please enter your GitHub username:");

//         bot.once("message", (msg) => {
//           profiles[userId].github = msg.text;

//           bot.sendMessage(
//             chatId,
//             "Profile created successfully! You can now create issues using /create_issue <description>."
//           );
//         });
//       });
//     });
//   } else {
//     bot.sendMessage(chatId, "Your profile is already created.");
//   }
// });

// // Command to create a new issue
// bot.onText(/\/create_issue (.+)/, (msg, match) => {
//   const chatId = msg.chat.id;
//   const issueDescription = match[1];

//   if (!groupIssues[chatId]) {
//     groupIssues[chatId] = {
//       issueCounter: 1,
//       issues: {},
//     };
//   }

//   const issueId = groupIssues[chatId].issueCounter++;
//   groupIssues[chatId].issues[issueId] = {
//     description: issueDescription,
//     createdBy: msg.from.username,
//     status: "open",
//     assignedTo: null,
//   };

//   bot.sendMessage(chatId, `Issue #${issueId} created: ${issueDescription}`);
// });

// // Command for a developer to take an issue
// bot.onText(/\/take_issue (\d+)/, (msg, match) => {
//   const chatId = msg.chat.id;
//   const issueId = parseInt(match[1]);

//   if (
//     groupIssues[chatId] &&
//     groupIssues[chatId].issues[issueId] &&
//     groupIssues[chatId].issues[issueId].status === "open"
//   ) {
//     groupIssues[chatId].issues[issueId].status = "in progress";
//     groupIssues[chatId].issues[issueId].assignedTo = msg.from.username;

//     bot.sendMessage(
//       chatId,
//       `Issue #${issueId} has been taken by @${msg.from.username}`
//     );
//   } else {
//     bot.sendMessage(chatId, `Issue #${issueId} is not available.`);
//   }
// });

// // Command to release an issue
// bot.onText(/\/release_issue (\d+)/, (msg, match) => {
//   const chatId = msg.chat.id;
//   const issueId = parseInt(match[1]);

//   if (
//     groupIssues[chatId] &&
//     groupIssues[chatId].issues[issueId] &&
//     groupIssues[chatId].issues[issueId].status === "in progress" &&
//     groupIssues[chatId].issues[issueId].assignedTo === msg.from.username
//   ) {
//     groupIssues[chatId].issues[issueId].status = "open";
//     groupIssues[chatId].issues[issueId].assignedTo = null;

//     bot.sendMessage(
//       chatId,
//       `Issue #${issueId} has been released by @${msg.from.username}`
//     );
//   } else {
//     bot.sendMessage(chatId, `Issue #${issueId} cannot be released.`);
//   }
// });

// // Command to mark an issue as solved
// bot.onText(/\/issue_solved (\d+)/, (msg, match) => {
//   const chatId = msg.chat.id;
//   const issueId = parseInt(match[1]);

//   if (
//     groupIssues[chatId] &&
//     groupIssues[chatId].issues[issueId] &&
//     groupIssues[chatId].issues[issueId].status === "in progress" &&
//     groupIssues[chatId].issues[issueId].assignedTo === msg.from.username
//   ) {
//     groupIssues[chatId].issues[issueId].status = "solved";

//     bot.sendMessage(
//       chatId,
//       `Issue #${issueId} has been solved by @${msg.from.username}`
//     );
//   } else {
//     bot.sendMessage(chatId, `Issue #${issueId} cannot be marked as solved.`);
//   }
// });

// // Command to close an issue
// bot.onText(/\/close_issue (\d+)/, (msg, match) => {
//   const chatId = msg.chat.id;
//   const issueId = parseInt(match[1]);

//   if (
//     groupIssues[chatId] &&
//     groupIssues[chatId].issues[issueId] &&
//     groupIssues[chatId].issues[issueId].status === "solved"
//   ) {
//     groupIssues[chatId].issues[issueId].status = "closed";

//     bot.sendMessage(
//       chatId,
//       `Issue #${issueId} has been closed by @${msg.from.username}`
//     );
//   } else {
//     bot.sendMessage(chatId, `Issue #${issueId} cannot be closed.`);
//   }
// });

// // Command to view all open issues in the current group
// bot.onText(/\/list_issues/, (msg) => {
//   const chatId = msg.chat.id;
//   let response = "Open Issues:\n\n";

//   if (groupIssues[chatId]) {
//     for (const [issueId, issue] of Object.entries(groupIssues[chatId].issues)) {
//       if (issue.status !== "closed") {
//         response += `#${issueId}: ${issue.description} (Status: ${issue.status})\n`;
//       }
//     }
//   } else {
//     response = "No issues have been created in this group.";
//   }

//   bot.sendMessage(chatId, response);
// });

// bot.on("message", (msg) => {
//   console.log(msg.text);
//   const chatId = msg.chat.id;

//   if (msg.text.toLowerCase() === "hello") {
//     bot.sendMessage(chatId, "Hello! Use /create_issue to create a new issue.");
//   }
// });

// // const token = "7437545638:AAEGY-LldtnRzkBOchtngww6A6DIFwMeF5Y";
// // const bot = new TelegramBot(token, { polling: true });

// // let issueCounter = 1;
// // let issues = {}; // Stores issues with details
// // let awaitingIssueDescription = {}; // Tracks users awaiting issue descriptions

// // // Command to start creating a new issue
// // bot.onText(/\/create_issue/, (msg) => {
// //     const chatId = msg.chat.id;
// //     awaitingIssueDescription[chatId] = true;

// //     bot.sendMessage(chatId, "Please enter the description for the new issue:");
// // });

// // // Handle user input after they are prompted for issue description
// // bot.on("message", (msg) => {
// //     const chatId = msg.chat.id;

// //     if (awaitingIssueDescription[chatId]) {
// //         const issueDescription = msg.text;
// //         const issueId = issueCounter++;

// //         issues[issueId] = {
// //             description: issueDescription,
// //             createdBy: msg.from.username,
// //             status: "open",
// //             assignedTo: null,
// //         };

// //         bot.sendMessage(chatId, `Issue #${issueId} created: ${issueDescription}`);

// //         // Clear the awaiting state
// //         delete awaitingIssueDescription[chatId];
// //     } else if (msg.text.toLowerCase() === "hello") {
// //         bot.sendMessage(chatId, "Hello! Use /create_issue to create a new issue.");
// //     }
// // });

// // // Command for a developer to take an issue
// // bot.onText(/\/take_issue (\d+)/, (msg, match) => {
// //     const chatId = msg.chat.id;
// //     const issueId = parseInt(match[1]);

// //     if (issues[issueId] && issues[issueId].status === "open") {
// //         issues[issueId].status = "in progress";
// //         issues[issueId].assignedTo = msg.from.username;

// //         bot.sendMessage(
// //             chatId,
// //             `Issue #${issueId} has been taken by @${msg.from.username}`
// //         );
// //     } else {
// //         bot.sendMessage(chatId, `Issue #${issueId} is not available.`);
// //     }
// // });

// // // Command to mark an issue as solved
// // bot.onText(/\/issue_solved (\d+)/, (msg, match) => {
// //     const chatId = msg.chat.id;
// //     const issueId = parseInt(match[1]);

// //     if (
// //         issues[issueId] &&
// //         issues[issueId].status === "in progress" &&
// //         issues[issueId].assignedTo === msg.from.username
// //     ) {
// //         issues[issueId].status = "solved";

// //         bot.sendMessage(
// //             chatId,
// //             `Issue #${issueId} has been solved by @${msg.from.username}`
// //         );
// //     } else {
// //         bot.sendMessage(chatId, `Issue #${issueId} cannot be marked as solved.`);
// //     }
// // });

// // // Command to close an issue
// // bot.onText(/\/close_issue (\d+)/, (msg, match) => {
// //     const chatId = msg.chat.id;
// //     const issueId = parseInt(match[1]);

// //     if (issues[issueId] && issues[issueId].status === "solved") {
// //         issues[issueId].status = "closed";

// //         bot.sendMessage(
// //             chatId,
// //             `Issue #${issueId} has been closed by @${msg.from.username}`
// //         );
// //     } else {
// //         bot.sendMessage(chatId, `Issue #${issueId} cannot be closed.`);
// //     }
// // });

// // // Command to view all open issues
// // bot.onText(/\/list_issues/, (msg) => {
// //     const chatId = msg.chat.id;
// //     let response = "Open Issues:\n\n";

// //     for (const [issueId, issue] of Object.entries(issues)) {
// //         if (issue.status !== "closed") {
// //             response += `#${issueId}: ${issue.description} (Status: ${issue.status})\n`;
// //         }
// //     }

// //     bot.sendMessage(chatId, response);
// // });

// require('dotenv').config();

import TelegramBot from "node-telegram-bot-api";
import mongoose from "mongoose";
import { User } from './models/userModel.js';
import { Issue } from "../models/issueModel.js";
import dotenv from "dotenv";

dotenv.config();
const bot = new TelegramBot("7437545638:AAEGY-LldtnRzkBOchtngww6A6DIFwMeF5Y", {
  polling: true,
});

mongoose.connect(
  "mongodb+srv://prathameshpatil6499:HrT6MAj1zvNpOg1i@cluster0.zuvo7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
  { useNewUrlParser: true, useUnifiedTopology: true }
);

// Bot commands and logic will be added here

// ... (previous code)

// Command: /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  const user = await User.findOne({ telegramId: userId });
  if (user) {
    bot.sendMessage(
      chatId,
      "Welcome back! Use /help to see available commands."
    );
  } else {
    bot.sendMessage(
      chatId,
      "Welcome! Please create a profile using /createprofile."
    );
  }
});

// Command: /createprofile
bot.onText(/\/createprofile/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  const user = await User.findOne({ telegramId: userId });
  if (user) {
    bot.sendMessage(chatId, "You already have a profile.");
    return;
  }

  bot.sendMessage(
    chatId,
    "Please provide your information in the following format:\n\nusername,wallet_address,twitter,github"
  );
});

// Handle profile creation
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;

  if (text.includes(",")) {
    const [username, walletAddress, twitter, github] = text.split(",");

    const newUser = new User({
      telegramId: userId,
      username: username.trim(),
      walletAddress: walletAddress.trim(),
      twitter: twitter.trim(),
      github: github.trim(),
    });

    await newUser.save();
    bot.sendMessage(chatId, "Profile created successfully!");
  }
});

// Command: /createissue

bot.onText(/\/createissue (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const issueTitle = match[1];

  const user = await User.findOne({ telegramId: userId });
  if (!user) {
    bot.sendMessage(
      chatId,
      "Please create a profile first using /createprofile."
    );
    return;
  }

  const issueCount = await Issue.countDocuments({ groupId: chatId.toString() });
  const newIssue = new Issue({
    groupId: chatId.toString(),
    number: issueCount + 1,
    title: issueTitle,
    createdBy: user._id,
  });

  await newIssue.save();
  bot.sendMessage(chatId, `Issue #${newIssue.number} created: ${issueTitle}`);
});

// Command: /listissues
bot.onText(/\/listissues/, async (msg) => {
  const chatId = msg.chat.id;

  const issues = await Issue.find({
    groupId: chatId.toString(),
    status: "open",
  });
  if (issues.length === 0) {
    bot.sendMessage(chatId, "No open issues.");
    return;
  }

  const issueList = issues
    .map((issue) => `#${issue.number}: ${issue.title}`)
    .join("\n");
  bot.sendMessage(chatId, `Open issues:\n${issueList}`);
});

// Command: /takeissue
bot.onText(/\/takeissue (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const issueNumber = parseInt(match[1]);

  const user = await User.findOne({ telegramId: userId });
  if (!user) {
    bot.sendMessage(
      chatId,
      "Please create a profile first using /createprofile."
    );
    return;
  }

  const issue = await Issue.findOne({
    groupId: chatId.toString(),
    number: issueNumber,
    status: "open",
  });
  if (!issue) {
    bot.sendMessage(chatId, "Issue not found or already taken.");
    return;
  }

  issue.status = "in_progress";
  await issue.save();
  bot.sendMessage(chatId, `Issue #${issueNumber} has been assigned to you.`);
});

// Command: /releaseissue
bot.onText(/\/releaseissue (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const issueNumber = parseInt(match[1]);

  const user = await User.findOne({ telegramId: userId });
  if (!user) {
    bot.sendMessage(
      chatId,
      "Please create a profile first using /createprofile."
    );
    return;
  }

  const issue = await Issue.findOne({
    groupId: chatId.toString(),
    number: issueNumber,
    status: "in_progress",
  });
  if (!issue) {
    bot.sendMessage(chatId, "Issue not found or not in progress.");
    return;
  }

  issue.status = "open";
  await issue.save();
  bot.sendMessage(
    chatId,
    `Issue #${issueNumber} has been released and is now open.`
  );
});

// Command: /solveissue
bot.onText(/\/solveissue (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const issueNumber = parseInt(match[1]);

  const user = await User.findOne({ telegramId: userId });
  if (!user) {
    bot.sendMessage(
      chatId,
      "Please create a profile first using /createprofile."
    );
    return;
  }

  const issue = await Issue.findOne({
    groupId: chatId.toString(),
    number: issueNumber,
    status: "in_progress",
  });
  if (!issue) {
    bot.sendMessage(chatId, "Issue not found or not in progress.");
    return;
  }

  issue.status = "solved";
  issue.solvedBy = user._id;
  await issue.save();
  bot.sendMessage(chatId, `Issue #${issueNumber} has been marked as solved.`);
});

// Command: /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpText = `
  Available commands:
  /start - Welcome message
  /createprofile - Create your profile
  /myprofile - View your own profile
  /getprofile <username> - View another user's profile
  /createissue - Create a new issue using a standard format
  /listissues - List all open issues with details
  /takeissue <number> - Take an issue to solve
  /releaseissue <number> - Release an issue back to open status
  /solveissue <number> - Mark an issue as solved
  /closeissue <number> - Close a solved issue (only issue creator)
  /help - Show this help message
  `;
  bot.sendMessage(chatId, helpText);
});

// ... (rest of the code)

bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Handle commands and messages here
});

console.log("Bot is running...");
//



// Command to run the bot
// The First is  - The /start command that will start the bot and make the bot to message the user regarding the 
// Second