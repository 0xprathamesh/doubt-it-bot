import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import {
  Account,
  Aptos,
  AptosConfig,
  Ed25519PrivateKey,
  Network,
  NetworkToNetworkName,
} from "@aptos-labs/ts-sdk";

dotenv.config();

// Setup MongoDB client
const client = new MongoClient("mongodb+srv://prathameshpatil6499:ZJ7qQiU5XfUGeaeP@doubtit.lzppn.mongodb.net/?retryWrites=true&w=majority&appName=doubtit", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let db;

client.connect((err) => {
  if (err) {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  }
  db = client.db("doubtit"); // Use your database name
  console.log("Connected to MongoDB");
});

// Setup the Aptos client
const INITIAL_BALANCE = 100_000_000;
const APTOS_NETWORK =
  NetworkToNetworkName[process.env.APTOS_NETWORK] || Network.TESTNET;
const config = new AptosConfig({ network: APTOS_NETWORK });
const aptos = new Aptos(config);

const bot = new TelegramBot("7437545638:AAEGY-LldtnRzkBOchtngww6A6DIFwMeF5Y", { polling: true });

// Command: /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  const user = await db.collection("users").findOne({ userId });
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
  const username = msg.from.username;

  const user = await db.collection("users").findOne({ userId });
  if (user) {
    bot.sendMessage(chatId, "You already have a profile.");
    return;
  }
  
  // Create an Aptos account
  const aptosAccount = Account.generate();
  const newUser = {
    userId,
    username,
    contributions: 0,
    streak: 0,
    lastContributionDate: null,
    aptosAccount: {
      accountAddress: aptosAccount.accountAddress,
      privateKey: aptosAccount.privateKey.toString(),
    },
  };

  await db.collection("users").insertOne(newUser);

  bot.sendMessage(
    chatId,
   ` Your Aptos account has been created!\nAddress: ${aptosAccount.accountAddress}`
  );
  bot.sendMessage(chatId, "Please enter your Twitter username:");
  await db.collection("users").updateOne(
    { userId },
    { $set: { step: "twitter" } }
  );

  // Fund the account
  await aptos.fundAccount({
    accountAddress: aptosAccount.accountAddress,
    amount: INITIAL_BALANCE,
  });
});

// Handle profile creation step by step
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text.trim();

  const user = await db.collection("users").findOne({ userId });
  if (!user || !user.step) return;

  const step = user.step;

  if (step === "twitter") {
    await db.collection("users").updateOne(
      { userId },
      { $set: { twitter: text, step: "github" } }
    );
    bot.sendMessage(chatId, "Please enter your GitHub username:");
  } else if (step === "github") {
    await db.collection("users").updateOne(
      { userId },
      { $set: { github: text, step: null } }
    );
    bot.sendMessage(chatId, "Profile created successfully!");
  }
});

// Command: /createissue
bot.onText(/\/createissue/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  const user = await db.collection("users").findOne({ userId });
  if (!user) {
    bot.sendMessage(
      chatId,
      "Please create a profile first using /createprofile."
    );
    return;
  }

  bot.sendMessage(chatId, "Let's create an issue. Please enter the title:");
  await db.collection("users").updateOne(
    { userId },
    { $set: { issueStep: "waiting_for_title", currentIssue: {} } }
  );
});

// Handle issue creation step by step
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text.trim();

  const user = await db.collection("users").findOne({ userId });
  if (!user || !user.issueStep) return;

  const step = user.issueStep;

  if (step === "waiting_for_title") {
    await db.collection("users").updateOne(
      { userId },
      { $set: { "currentIssue.title": text, issueStep: "waiting_for_description" } }
    );
    bot.sendMessage(chatId, "Please enter the description:");
  } else if (step === "waiting_for_description") {
    const newIssue = {
      number: await db.collection("issues").countDocuments({ chatId }) + 1,
      title: user.currentIssue.title,
      description: text,
      status: "open",
      createdBy: userId,
      createdDate: new Date(),
      solvedBy: null,
    };

    await db.collection("issues").insertOne({ ...newIssue, chatId });

    bot.sendMessage(
      chatId,
   `   Issue #${newIssue.number} created: ${newIssue.title}`
    );

    await db.collection("users").updateOne(
      { userId },
      { $unset: { issueStep: "", currentIssue: "" } }
    );
  }
});

// Command: /listissues
bot.onText(/\/listissues/, async (msg) => {
  const chatId = msg.chat.id;

  const issues = await db
    .collection("issues")
    .find({ chatId, status: "open" })
    .toArray();

  if (issues.length === 0) {
    bot.sendMessage(chatId, "No open issues.");
    return;
  }

  const issueList = issues
    .map(
      (issue) =>
       ` #${issue.number}: ${issue.title}\nDescription: ${issue.description}\nRaised by: @${issue.createdBy}\nDate: ${issue.createdDate.toDateString()}`
    )
    .join("\n\n");

  bot.sendMessage(chatId, `Open issues:\n${issueList}`);
});

// Command: /takeissue
bot.onText(/\/takeissue (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const issueNumber = parseInt(match[1]);

  const user = await db.collection("users").findOne({ userId });
  if (!user) {
    bot.sendMessage(
      chatId,
      "Please create a profile first using /createprofile."
    );
    return;
  }

  const issue = await db
    .collection("issues")
    .findOne({ chatId, number: issueNumber, status: "open" });

  if (!issue) {
    bot.sendMessage(chatId, "Issue not found or already taken.");
    return;
  }

  await db
    .collection("issues")
    .updateOne({ chatId, number: issueNumber }, { $set: { status: "in_progress", solvedBy: userId } });

  bot.sendMessage(chatId, `Issue #${issueNumber} has been assigned to you.`);
});

// Command: /releaseissue
bot.onText(/\/releaseissue (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const issueNumber = parseInt(match[1]);

  const issue = await db
    .collection("issues")
    .findOne({ chatId, number: issueNumber, status: "in_progress", solvedBy: userId });

  if (!issue) {
    bot.sendMessage(chatId, "Issue not found or not in progress.");
    return;
  }

  await db
    .collection("issues")
    .updateOne({ chatId, number: issueNumber }, { $set: { status: "open", solvedBy: null } });

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

  const issue = await db
    .collection("issues")
    .findOne({ chatId, number: issueNumber, status: "in_progress", solvedBy: userId });

  if (!issue) {
    bot.sendMessage(chatId, "Issue not found or not in progress.");
    return;
  }

  await db
    .collection("issues")
    .updateOne({ chatId, number: issueNumber }, { $set: { status: "solved" } });

  bot.sendMessage(
    chatId,
   ` Issue #${issueNumber} has been marked as solved. Please use /closeissue ${issueNumber} to close it if you are the creator.`
  );
});

// Command: /closeissue
bot.onText(/\/closeissue (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const issueNumber = parseInt(match[1]);

  const issue = await db
    .collection("issues")
    .findOne({ chatId, number: issueNumber, status: "solved", createdBy: userId });

  if (!issue) {
    bot.sendMessage(chatId, "Issue not found or not solved.");
    return;
  }

  await db
    .collection("issues")
    .updateOne({ chatId, number: issueNumber }, { $set: { status: "closed" } });

  // Increment contributions for the solver
  const solver = await db.collection("users").findOne({ userId: issue.solvedBy });
  const now = new Date().toDateString();

  await db.collection("users").updateOne(
    { userId: solver.userId },
    {
      $inc: { contributions: 1 },
      $set: { lastContributionDate: now },
      $inc: { streak: solver.lastContributionDate === now ? 1 : 0 },
    }
  );

  bot.sendMessage(
    chatId,
  `  Issue #${issueNumber} has been closed. Solver: @${solver.username} has been credited with 1 contribution.\nCurrent streak: ${solver.streak} days.`
  );

  // Mint NFT for the solver
  try {
    const mintArgs = {
      collectionId: "", // Replace with actual collection ID
      amount: 1, // Mint one NFT
    };
    const mintTransaction = mintNFT();

    const privateKey = new Ed25519PrivateKey(
      solver.aptosAccount.privateKey.toString()
    );
    const account = Account.fromPrivateKey({ privateKey });

    const transaction = await aptos.signAndSubmitTransaction({
      signer: account,
      transaction: mintTransaction,
    });

    await aptos.waitForTransaction({ transactionHash: transaction.hash });

    bot.sendMessage(
      chatId,
     ` NFT has been successfully minted and assigned to @${solver.username} for solving the issue!`
    );
  } catch (error) {
    console.error("Error minting NFT:", error);
    bot.sendMessage(
      chatId,
      "An error occurred while minting the NFT. Please try again."
    );
  }
});

// Command: /profile
bot.onText(/\/profile(.*)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const queriedUsername = match[1].trim();

  let profile;
  if (queriedUsername) {
    profile = await db.collection("users").findOne({ username: queriedUsername.toLowerCase() });
    if (!profile) {
      bot.sendMessage(chatId, "Profile not found.");
      return;
    }
  } else {
    profile = await db.collection("users").findOne({ userId });
    if (!profile) {
      bot.sendMessage(chatId, "Profile not found.");
      return;
    }
  }

  bot.sendMessage(
    chatId,
   ` Profile:\nUsername: @${profile.username}\nTwitter: @${profile.twitter}\nGitHub: @${profile.github}\nWallet Address: ${profile.aptosAccount.accountAddress}\nContributions: ${profile.contributions}\nCurrent Streak: ${profile.streak} days`
  );
});

// Command: /getprivatekey
bot.onText(/\/getprivatekey/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  const user = await db.collection("users").findOne({ userId });
  if (!user) {
    bot.sendMessage(
      chatId,
      "Please create a profile first using /createprofile."
    );
    return;
  }

  // Send the private key in a private message to the user
  bot.sendMessage(
    userId,
`    Your private key is: ${user.aptosAccount.privateKey}\n\nWARNING: Keep this private key secure and do not share it with anyone!`
  );

  // Send a message in the group chat to inform the user to check their private messages
  if (chatId !== userId) {
    bot.sendMessage(
      chatId,
      "I've sent your private key in a private message. Please check your direct messages with me."
    );
  }
});

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
      function: "0xb0e4ecdf9e873a6be776d8ed87ea4695f743b4ff0c374b69fddca962743a6a5a::launchpad::mint_nft", // Function identifier in the smart contract
      typeArguments: [], // If any type arguments are needed, add them here
      functionArguments: [collectionId, amount], // Arguments to be passed to the function
    },
  };
};

// Close MongoDB connection when bot stops
process.on("SIGINT", () => {
  client.close();
  process.exit();
});

bot.on("polling_error", console.error);