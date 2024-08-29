import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import {
  Account,
  Aptos,
  AptosConfig,
  Ed25519PrivateKey,
  Network,
  NetworkToNetworkName,
} from "@aptos-labs/ts-sdk";

dotenv.config();

// Setup the Aptos client
const INITIAL_BALANCE = 100_000_000;
const APTOS_NETWORK =
  NetworkToNetworkName[process.env.APTOS_NETWORK] || Network.TESTNET;
const config = new AptosConfig({ network: APTOS_NETWORK });
const aptos = new Aptos(config);

const bot = new TelegramBot("7437545638:AAEGY-LldtnRzkBOchtngww6A6DIFwMeF5Y"
  , { polling: true });

const users = {}; // { telegramId: { username, walletAddress, twitter, github, contributions, streak, lastContributionDate, aptosAccount, privateKey } }
const issues = {}; // { groupId: [{ number, title, description, status, createdBy, solvedBy }] }

// Command: /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (users[userId]) {
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
  const username = msg.from.username;

  if (users[userId]) {
    bot.sendMessage(chatId, "You already have a profile.");
    return;
  }

  // Create an Aptos account
  const aptosAccount = Account.generate();
  users[userId] = {
    username,
    contributions: 0,
    streak: 0,
    lastContributionDate: null,
    aptosAccount,
    privateKey: aptosAccount.privateKey.toString(),
  };

  bot.sendMessage(
    chatId,
    `Your Aptos account has been created!\nAddress: ${aptosAccount.accountAddress}`
  );
  bot.sendMessage(chatId, "Please enter your Twitter username:");
  users[userId].step = "twitter";

  // Fund the account
  // await aptos.fundAccount({
  //   accountAddress: aptosAccount.accountAddress,
  //   amount: INITIAL_BALANCE,
  // });
});

// Handle profile creation step by step
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;

  if (!users[userId] || !users[userId].step) return;

  const step = users[userId].step;

  if (step === "twitter") {
    users[userId].twitter = text.trim();
    users[userId].step = "github";
    bot.sendMessage(chatId, "Please enter your GitHub username:");
  } else if (step === "github") {
    users[userId].github = text.trim();
    users[userId].step = null;
    bot.sendMessage(chatId, "Profile created successfully!");
  }
});

// Command: /createissue
// bot.onText(/\/createissue/, (msg) => {
//   const chatId = msg.chat.id;
//   const userId = msg.from.id;

//   if (!users[userId]) {
//     bot.sendMessage(
//       chatId,
//       "Please create a profile first using /createprofile."
//     );
//     return;
//   }

//   bot.sendMessage(
//     chatId,
//     "Please enter the issue in the following format:\nTitle: <title>\nDescription: <description>"
//   );
//   users[userId].issueStep = "waiting_for_format";
//   users[userId].currentIssue = {};
// });

// // Handle issue creation step by step
// bot.on("message", (msg) => {
//   const chatId = msg.chat.id;
//   const userId = msg.from.id;
//   const text = msg.text;

//   if (!users[userId] || !users[userId].issueStep) return;

//   if (users[userId].issueStep === "waiting_for_format") {
//     const titleMatch = text.match(/Title: (.+)/i);
//     const descriptionMatch = text.match(/Description:([\s\S]*)/i);

//     if (titleMatch && descriptionMatch) {
//       users[userId].currentIssue.title = titleMatch[1].trim();
//       users[userId].currentIssue.description = descriptionMatch[1].trim();

//       if (!issues[chatId]) {
//         issues[chatId] = [];
//       }

//       const issueCount = issues[chatId].length;
//       const newIssue = {
//         number: issueCount + 1,
//         title: users[userId].currentIssue.title,
//         description: users[userId].currentIssue.description,
//         status: "open",
//         createdBy: userId,
//         createdDate: new Date(),
//         solvedBy: null,
//       };

//       issues[chatId].push(newIssue);
//       bot.sendMessage(
//         chatId,
//         `Issue #${newIssue.number} created: ${newIssue.title}`
//       );
//       users[userId].issueStep = null;
//     } else {
//       bot.sendMessage(
//         chatId,
//         "Invalid format. Please use the format:\nTitle: <title>\nDescription: <description>"
//       );
//     }
//   }
// });

// Command: /createissue
bot.onText(/\/createissue/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!users[userId]) {
    bot.sendMessage(
      chatId,
      "Please create a profile first using /createprofile."
    );
    return;
  }

  bot.sendMessage(chatId, "Let's create an issue. Please enter the title:");
  users[userId].issueStep = "waiting_for_title";
  users[userId].currentIssue = {}; // Initialize the current issue object
});

// Handle issue creation step by step
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text.trim();

  if (!users[userId] || !users[userId].issueStep) return;

  const step = users[userId].issueStep;

  if (step === "waiting_for_title") {
    // Store the title and ask for the description
    users[userId].currentIssue.title = text;
    users[userId].issueStep = "waiting_for_description";
    bot.sendMessage(chatId, "Please enter the description:");
  } else if (step === "waiting_for_description") {
    // Store the description and finalize the issue
    users[userId].currentIssue.description = text;

    if (!issues[chatId]) {
      issues[chatId] = [];
    }

    const issueCount = issues[chatId].length;
    const newIssue = {
      number: issueCount + 1,
      title: users[userId].currentIssue.title,
      description: users[userId].currentIssue.description,
      status: "open",
      createdBy: userId,
      createdDate: new Date(),
      solvedBy: null,
    };

    issues[chatId].push(newIssue);
    bot.sendMessage(
      chatId,
      `Issue #${newIssue.number} created: ${newIssue.title}`
    );

    // Reset the issue creation process
    users[userId].issueStep = null;
    users[userId].currentIssue = null;
  }
});

// Command: /listissues
bot.onText(/\/listissues/, (msg) => {
  const chatId = msg.chat.id;

  if (!issues[chatId] || issues[chatId].length === 0) {
    bot.sendMessage(chatId, "No open issues.");
    return;
  }

  const openIssues = issues[chatId].filter((issue) => issue.status === "open");
  if (openIssues.length === 0) {
    bot.sendMessage(chatId, "No open issues.");
    return;
  }

  const issueList = openIssues
    .map(
      (issue) =>
        `#${issue.number}: ${issue.title}\nDescription: ${
          issue.description
        }\nRaised by: @${
          users[issue.createdBy].username
        }\nDate: ${issue.createdDate.toDateString()}`
    )
    .join("\n\n");
  bot.sendMessage(chatId, `Open issues:\n${issueList}`);
});

// Command: /takeissue
bot.onText(/\/takeissue (\d+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const issueNumber = parseInt(match[1]);

  if (!users[userId]) {
    bot.sendMessage(
      chatId,
      "Please create a profile first using /createprofile."
    );
    return;
  }

  const issue = issues[chatId].find(
    (issue) => issue.number === issueNumber && issue.status === "open"
  );
  if (!issue) {
    bot.sendMessage(chatId, "Issue not found or already taken.");
    return;
  }

  issue.status = "in_progress";
  issue.solvedBy = userId;
  bot.sendMessage(chatId, `Issue #${issueNumber} has been assigned to you.`);
});

// Command: /releaseissue
bot.onText(/\/releaseissue (\d+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const issueNumber = parseInt(match[1]);

  if (!users[userId]) {
    bot.sendMessage(
      chatId,
      "Please create a profile first using /createprofile."
    );
    return;
  }

  const issue = issues[chatId].find(
    (issue) =>
      issue.number === issueNumber &&
      issue.status === "in_progress" &&
      issue.solvedBy === userId
  );
  if (!issue) {
    bot.sendMessage(chatId, "Issue not found or not in progress.");
    return;
  }

  issue.status = "open";
  issue.solvedBy = null;
  bot.sendMessage(
    chatId,
    `Issue #${issueNumber} has been released and is now open.`
  );
});

// Command: /solveissue
bot.onText(/\/solveissue (\d+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const issueNumber = parseInt(match[1]);

  if (!users[userId]) {
    bot.sendMessage(
      chatId,
      "Please create a profile first using /createprofile."
    );
    return;
  }

  const issue = issues[chatId].find(
    (issue) =>
      issue.number === issueNumber &&
      issue.status === "in_progress" &&
      issue.solvedBy === userId
  );
  if (!issue) {
    bot.sendMessage(chatId, "Issue not found or not in progress.");
    return;
  }

  issue.status = "solved";
  bot.sendMessage(
    chatId,
    `Issue #${issueNumber} has been marked as solved. Please use /closeissue ${issueNumber} to close it if you are the creator.`
  );
});

// Command: /closeissue
// bot.onText(/\/closeissue (\d+)/, async (msg, match) => {
//   const chatId = msg.chat.id;
//   const userId = msg.from.id;
//   const issueNumber = parseInt(match[1]);

//   const issue = issues[chatId].find(
//     (issue) =>
//       issue.number === issueNumber &&
//       issue.status === "solved" &&
//       issue.createdBy === userId
//   );
//   if (!issue) {
//     bot.sendMessage(chatId, "Issue not found or not solved.");
//     return;
//   }

//   issue.status = "closed";

//   // Increment contributions for the solver
//   const solver = users[issue.solvedBy];
//   solver.contributions += 1;

//   const now = new Date().toDateString();
//   if (solver.lastContributionDate === now) {
//     solver.streak += 1;
//   } else {
//     solver.streak = 1;
//   }
//   solver.lastContributionDate = now;

//   bot.sendMessage(
//     chatId,
//     `Issue #${issueNumber} has been closed. Solver: @${solver.username} has been credited with 1 contribution.\nCurrent streak: ${solver.streak} days.`
//   );
// });

// Command: /profile
bot.onText(/\/profile(.*)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const queriedUsername = match[1].trim();

  if (!users[userId]) {
    bot.sendMessage(
      chatId,
      "Please create a profile first using /createprofile."
    );
    return;
  }

  let profile;
  if (queriedUsername) {
    profile = Object.values(users).find(
      (user) => user.username.toLowerCase() === queriedUsername.toLowerCase()
    );
    if (!profile) {
      bot.sendMessage(chatId, "Profile not found.");
      return;
    }
  } else {
    profile = users[userId];
  }

  bot.sendMessage(
    chatId,
    `Profile:\nUsername: @${profile.username}\nTwitter: @${profile.twitter}\nGitHub: @${profile.github}\nWallet Address: ${profile.aptosAccount.accountAddress}\nContributions: ${profile.contributions}\nCurrent Streak: ${profile.streak} days`
  );
});

// Command: /tip
// bot.onText(/\/tip (\w+) (\d+)/, async (msg, match) => {
//   const chatId = msg.chat.id;
//   const senderId = msg.from.id;
//   const recipientUsername = match[1];
//   const amount = parseInt(match[2]);

//   const sender = users[senderId];
//   const recipient = Object.values(users).find(
//     (user) => user.username.toLowerCase() === recipientUsername.toLowerCase()
//   );

//   if (!sender) {
//     bot.sendMessage(
//       chatId,
//       "Please create a profile first using /createprofile."
//     );
//     return;
//   }

//   if (!recipient) {
//     bot.sendMessage(chatId, "Recipient profile not found.");
//     return;
//   }

//   if (sender.aptosAccount.balance < amount) {
//     bot.sendMessage(chatId, "Insufficient balance to tip.");
//     return;
//   }

//   // Transfer tokens to the recipient
//   const payload = {
//     type: "entry_function_payload",
//     function: "aptos_account::transfer_coins",
//     arguments: [recipient.aptosAccount.accountAddress, amount],
//   };

//   await aptos.signAndSubmitTransaction(sender.aptosAccount, payload);

//   bot.sendMessage(
//     chatId,
//     `Successfully tipped ${amount} tokens to @${recipient.username}.`
//   );
// });

// Command: /getprivatekey
bot.onText(/\/getprivatekey/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!users[userId]) {
    bot.sendMessage(
      chatId,
      "Please create a profile first using /createprofile."
    );
    return;
  }

  // Send the private key in a private message to the user
  bot.sendMessage(
    userId,
    `Your private key is: ${users[userId].privateKey}\n\nWARNING: Keep this private key secure and do not share it with anyone!`
  );

  // Send a message in the group chat to inform the user to check their private messages
  if (chatId !== userId) {
    bot.sendMessage(
      chatId,
      "I've sent your private key in a private message. Please check your direct messages with me."
    );
  }
});

// Command: /sendTip <amount> <telegram_username>
bot.onText(/\/sendTip (\d+) (\w+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const amount = parseInt(match[1]);
  const recipientUsername = match[2].toLowerCase();

  // Check if sender has a profile
  if (!users[senderId]) {
    bot.sendMessage(
      chatId,
      "Please create a profile first using /createprofile."
    );
    return;
  }

  const sender = users[senderId];
  const recipient = Object.values(users).find(
    (user) => user.username.toLowerCase() === recipientUsername
  );

  // Check if recipient exists
  if (!recipient) {
    bot.sendMessage(chatId, "Recipient profile not found.");
    return;
  }

  if (sender.aptosAccount.balance < amount) {
    bot.sendMessage(chatId, "Insufficient balance to send tokens.");
    return;
  }
  const privateKey = new Ed25519PrivateKey(
    sender.aptosAccount.privateKey.toString()
  );
  const account = Account.fromPrivateKey({ privateKey });
  try {
    const transaction = await aptos.transferCoinTransaction({
      sender: sender.aptosAccount.accountAddress,
      recipient: recipient.aptosAccount.accountAddress,
      amount: amount.toString(),
    });
    const pendingTxn = await aptos.signAndSubmitTransaction({
      signer: account,
      transaction,
    });
    const response = await aptos.waitForTransaction({
      transactionHash: pendingTxn.hash,
    });

    bot.sendMessage(
      chatId,
      `Successfully sent ${amount} tokens to @${recipient.username}. + ${response}`
    );
  } catch (error) {
    console.error("Error sending tip:", error);
    bot.sendMessage(
      chatId,
      "An error occurred while sending the tip. Please try again."
    );
  }
});

bot.on("polling_error", console.error);

// Command: /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;

  const helpMessage = `
Here are the available commands:

/start - Start interacting with the bot and check your profile status.
/createprofile - Create your profile with your social media handles and wallet address.
/createissue - Create a new issue that others can help solve.
/listissues - List all open issues in the current group.
/takeissue <issue_number> - Take an issue to work on it.
/releaseissue <issue_number> - Release an issue if you cannot solve it.
/solveissue <issue_number> - Mark an issue as solved.
/closeissue <issue_number> - Close a solved issue (only the issue creator can do this).
/profile [username] - View your profile or another user's profile.
/tip <username> <amount> - Tip another user with a specified amount of tokens.
/getprivatekey - Get your private key (sent in a private message).
/help - Show this help message with a list of available commands.
`;

  bot.sendMessage(chatId, helpMessage);
});

const mintNFT = () => {
  // Use predefined values or environment variables
  const collectionId =
    "0x25f1f9ed2e111fc21609c5a3696c1fb7ce010c3da3330ddc61a26d7c8c82b54f"; // Replace with your collection ID
  const amount = "1"; // Fixed amount of NFTs to mint, adjust as needed

  // Return the transaction data formatted correctly
  return {
    data: {
      function: `0xb0e4ecdf9e873a6be776d8ed87ea4695f743b4ff0c374b69fddca962743a6a5a::launchpad::mint_nft`, // Function identifier in the smart contract
      typeArguments: [], // If any type arguments are needed, add them here
      functionArguments: [collectionId, amount], // Arguments to be passed to the function
    },
  };
};

// async function mintNFT(solverAccount, title, description) {
//   try {
//     const payload = {
//       type: "entry_function_payload",
//       function: "0x1::Token::create_token_script",
//       arguments: [
//         "MyNFTCollection", // Collection name
//         title, // Token name (can use issue title)
//         description, // Token description (can use issue description)
//         1, // Supply
//         "https://example.com/nft-image.png", // URI (link to an image or metadata)
//       ],
//       type_arguments: [],
//     };

//     const privateKey = new Ed25519PrivateKey(solverAccount.privateKey.toString());
//     const account = Account.fromPrivateKey({ privateKey });

//     const transaction = await aptos.signAndSubmitTransaction({
//       signer: account,
//       transaction: payload,
//     });

//     await aptos.waitForTransaction({ transactionHash: transaction.hash });

//     console.log(`NFT minted for ${solverAccount.accountAddress}`);
//   } catch (error) {
//     console.error("Error minting NFT:", error);
//   }
// }

// Command: /closeissue
bot.onText(/\/closeissue (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const issueNumber = parseInt(match[1]);

  const issue = issues[chatId].find(
    (issue) =>
      issue.number === issueNumber &&
      issue.status === "solved" &&
      issue.createdBy === userId
  );
  if (!issue) {
    bot.sendMessage(chatId, "Issue not found or not solved.");
    return;
  }

  issue.status = "closed";

  // Increment contributions for the solver
  const solver = users[issue.solvedBy];
  solver.contributions += 1;

  const now = new Date().toDateString();
  if (solver.lastContributionDate === now) {
    solver.streak += 1;
  } else {
    solver.streak = 1;
  }
  solver.lastContributionDate = now;

  bot.sendMessage(
    chatId,
    `Issue #${issueNumber} has been closed. Solver: @${solver.username} has been credited with 1 contribution.\nCurrent streak: ${solver.streak} days.`
  );

  // Mint NFT for the solver
  // try {
  //   const mintArgs = {
  //     collectionId: "", // Replace with actual collection ID
  //     amount: 1, // Mint one NFT
  //   };
  //   const mintTransaction = mintNFT();
  //   // const privateKey = new Ed25519PrivateKey(solver.privateKey);
  //   // const account = Account.fromPrivateKey({ privateKey });

  //   const privateKey = new Ed25519PrivateKey(
  //     solver.aptosAccount.privateKey.toString()
  //   );
  //   const account = Account.fromPrivateKey({ privateKey });

  //   console.log(account);

  //   const transaction = await aptos.signAndSubmitTransaction({
  //     signer: account,
  //     transaction: mintTransaction,
  //   });

  //   await aptos.waitForTransaction({ transactionHash: transaction.hash });

  //   bot.sendMessage(
  //     chatId,
  //     `NFT has been successfully minted and assigned to @${solver.username} for solving the issue!`
  //   );
  // } catch (error) {
  //   console.error("Error minting NFT:", error);
  //   bot.sendMessage(
  //     chatId,
  //     "An error occurred while minting the NFT. Please try again."
  //   );
  // }
});