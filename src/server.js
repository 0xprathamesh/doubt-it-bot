import TelegramBot from "node-telegram-bot-api";
import mongoose from "mongoose";
import dotenv from "dotenv";
import validator from "validator";

// Load environment variables from .env file
dotenv.config();

const token = "7437545638:AAEGY-LldtnRzkBOchtngww6A6DIFwMeF5Y";
const mongoUri ="mongodb+srv://prathameshpatil6499:HrT6MAj1zvNpOg1i@cluster0.zuvo7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// MongoDB connection
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("Failed to connect to MongoDB", err));

// Define User schema
const userSchema = new mongoose.Schema({
    telegramId: String,
    username: String,
    walletAddress: String,
    twitterUsername: String,
    githubUsername: String,
    dailyContributions: [{ date: String, contributions: Number }]
});

// Define Issue schema
const issueSchema = new mongoose.Schema({
    groupId: String,
    issueId: Number,
    description: String,
    createdBy: String,
    status: String,
    assignedTo: String
});

const User = mongoose.model('User', userSchema);
const Issue = mongoose.model('Issue', issueSchema);

const bot = new TelegramBot(token, { polling: true });

// Track issue counter per group
let issueCounters = {};

// Function to validate wallet address (example for Ethereum)
function isValidWalletAddress(address) {
    return validator.isEthereumAddress(address);
}

// Middleware to check if user profile exists
async function checkProfile(chatId, telegramId) {
    try {
        let user = await User.findOne({ telegramId });
        if (!user) {
            bot.sendMessage(chatId, "Please create your profile first. Send your wallet address.");
            bot.once("message", async (msg) => {
                const walletAddress = msg.text;
                if (!isValidWalletAddress(walletAddress)) {
                    bot.sendMessage(chatId, "Invalid wallet address. Please try again.");
                    return;
                }
                await askForProfileDetails(chatId, telegramId, walletAddress);
            });
            return false;
        }
        return true;
    } catch (err) {
        bot.sendMessage(chatId, "An error occurred while checking your profile.");
        console.error("Error checking profile:", err);
        return false;
    }
}

// Ask user for profile details
async function askForProfileDetails(chatId, telegramId, walletAddress) {
    try {
        bot.sendMessage(chatId, "What's your Twitter username?");
        bot.once("message", async (msg) => {
            const twitterUsername = msg.text;
            bot.sendMessage(chatId, "What's your GitHub username?");
            bot.once("message", async (msg) => {
                const githubUsername = msg.text;
                const username = msg.from.username;

                await createProfile(telegramId, username, walletAddress, twitterUsername, githubUsername);
                bot.sendMessage(chatId, "Profile created successfully! You can now use the bot.");
            });
        });
    } catch (err) {
        bot.sendMessage(chatId, "An error occurred while creating your profile.");
        console.error("Error creating profile:", err);
    }
}

// Create profile in MongoDB
async function createProfile(telegramId, username, walletAddress, twitterUsername, githubUsername) {
    try {
        const newUser = new User({
            telegramId,
            username,
            walletAddress,
            twitterUsername,
            githubUsername,
            dailyContributions: []
        });
        await newUser.save();
    } catch (err) {
        console.error("Error saving profile:", err);
    }
}

// Command to view own profile
bot.onText(/\/profile$/, async (msg) => {
    try {
        const chatId = msg.chat.id;
        const telegramId = msg.from.id;

        const profileExists = await checkProfile(chatId, telegramId);
        if (!profileExists) return;

        const user = await User.findOne({ telegramId });
        bot.sendMessage(chatId, `Profile:\nUsername: @${user.username}\nWallet: ${user.walletAddress}\nTwitter: @${user.twitterUsername}\nGitHub: @${user.githubUsername}`);
    } catch (err) {
        bot.sendMessage(chatId, "An error occurred while retrieving your profile.");
        console.error("Error fetching profile:", err);
    }
});

// Command to view someone else's profile
bot.onText(/\/profile (\w+)/, async (msg, match) => {
    try {
        const chatId = msg.chat.id;
        const username = match[1];

        const user = await User.findOne({ username });
        if (user) {
            bot.sendMessage(chatId, `Profile:\nUsername: @${user.username}\nWallet: ${user.walletAddress}\nTwitter: @${user.twitterUsername}\nGitHub: @${user.githubUsername}`);
        } else {
            bot.sendMessage(chatId, `User @${username} not found.`);
        }
    } catch (err) {
        bot.sendMessage(chatId, "An error occurred while retrieving the profile.");
        console.error("Error fetching profile:", err);
    }
});

// Command to create a new issue
bot.onText(/\/create_issue (.+)/, async (msg, match) => {
    try {
        const chatId = msg.chat.id;
        const telegramId = msg.from.id;

        const profileExists = await checkProfile(chatId, telegramId);
        if (!profileExists) return;

        const issueDescription = match[1];
        const groupId = chatId.toString();

        if (!issueCounters[groupId]) {
            issueCounters[groupId] = 1;
        }

        const issueId = issueCounters[groupId]++;
        const newIssue = new Issue({
            groupId,
            issueId,
            description: issueDescription,
            createdBy: msg.from.username,
            status: "open",
            assignedTo: null
        });
        await newIssue.save();

        bot.sendMessage(chatId, `Issue #${issueId} created: ${issueDescription}`);
    } catch (err) {
        bot.sendMessage(chatId, "An error occurred while creating the issue.");
        console.error("Error creating issue:", err);
    }
});

// Command for a developer to take an issue
bot.onText(/\/take_issue (\d+)/, async (msg, match) => {
    try {
        const chatId = msg.chat.id;
        const issueId = parseInt(match[1]);
        const groupId = chatId.toString();

        const issue = await Issue.findOne({ groupId, issueId });
        if (issue && issue.status === "open") {
            issue.status = "in progress";
            issue.assignedTo = msg.from.username;
            await issue.save();

            bot.sendMessage(chatId, `Issue #${issueId} has been taken by @${msg.from.username}`);
        } else {
            bot.sendMessage(chatId, `Issue #${issueId} is not available.`);
        }
    } catch (err) {
        bot.sendMessage(chatId, "An error occurred while taking the issue.");
        console.error("Error taking issue:", err);
    }
});

// Command to release an issue
bot.onText(/\/release_issue (\d+)/, async (msg, match) => {
    try {
        const chatId = msg.chat.id;
        const issueId = parseInt(match[1]);
        const groupId = chatId.toString();

        const issue = await Issue.findOne({ groupId, issueId });
        if (issue && issue.status === "in progress" && issue.assignedTo === msg.from.username) {
            issue.status = "open";
            issue.assignedTo = null;
            await issue.save();

            bot.sendMessage(chatId, `Issue #${issueId} has been released by @${msg.from.username}`);
        } else {
            bot.sendMessage(chatId, `Issue #${issueId} cannot be released.`);
        }
    } catch (err) {
        bot.sendMessage(chatId, "An error occurred while releasing the issue.");
        console.error("Error releasing issue:", err);
    }
});

// Command to mark an issue as solved
bot.onText(/\/issue_solved (\d+)/, async (msg, match) => {
    try {
        const chatId = msg.chat.id;
        const issueId = parseInt(match[1]);
        const groupId = chatId.toString();

        const issue = await Issue.findOne({ groupId, issueId });
        if (issue && issue.status === "in progress" && issue.assignedTo === msg.from.username) {
            issue.status = "solved";
            await issue.save();

            // Track daily contribution
            await trackContribution(msg.from.id);

            bot.sendMessage(chatId, `Issue #${issueId} has been solved by @${msg.from.username}`);
        } else {
            bot.sendMessage(chatId, `Issue #${issueId} cannot be marked as solved.`);
        }
    } catch (err) {
        bot.sendMessage(chatId, "An error occurred while marking the issue as solved.");
        console.error("Error marking issue as solved:", err);
    }
});

// Track user contribution
async function trackContribution(telegramId) {
    try {
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const user = await User.findOne({ telegramId });

        const contribution = user.dailyContributions.find(c => c.date === today);
        if (contribution) {
            contribution.contributions++;
        } else {
            user.dailyContributions.push({ date: today, contributions: 1 });
        }
        await user.save();
    } catch (err) {
        console.error("Error tracking contribution:", err);
    }
}


// Command to close an issue
bot.onText(/\/close_issue (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const issueId = parseInt(match[1]);
    const groupId = chatId.toString();

    const issue = await Issue.findOne({ groupId, issueId });
    if (issue && issue.status === "solved") {
        issue.status = "closed";
        await issue.save();

        bot.sendMessage(chatId, `Issue #${issueId} has been closed by @${msg.from.username}`);
    } else {
        bot.sendMessage(chatId, `Issue #${issueId} cannot be closed.`);
    }
});

// Command to view all open issues
bot.onText(/\/list_issues/, async (msg) => {
    const chatId = msg.chat.id;
    const groupId = chatId.toString();

    const issues = await Issue.find({ groupId, status: { $ne: "closed" } });
    let response = "Open Issues:\n\n";
    issues.forEach(issue => {
        response += `#${issue.issueId}: ${issue.description} (Status: ${issue.status})\n`;
    });

    bot.sendMessage(chatId, response);
});

bot.on("message", (msg) => {
    const chatId = msg.chat.id;

    if (msg.text.toLowerCase() === "hello") {
        bot.sendMessage(chatId, "Hello! Use /create_issue to create a new issue.");
    }
});

