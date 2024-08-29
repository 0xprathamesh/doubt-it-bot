import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  walletAddress: String,
  twitter: String,
  github: String
});

export const User = mongoose.model('user', userSchema);