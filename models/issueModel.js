import mongoose from "mongoose";

const issueSchema = new mongoose.Schema({
  groupId: { type: String, required: true },
  number: { type: Number, required: true },
  title: { type: String, required: true },
  description: String,
  status: { type: String, enum: ['open', 'in_progress', 'solved'], default: 'open' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  solvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

// module.exports = mongoose.model('Issue', issueSchema);
export const Issue = mongoose.model('issue', issueSchema);