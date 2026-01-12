import mongoose, { type Document, Schema } from 'mongoose';

export interface IVote extends Document {
	postId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    voteType: 'upvote' | 'downvote';
}

const voteSchema = new Schema<IVote>(
	{
		userId: {
			type: mongoose.Types.ObjectId,
			required: true,
			index: true,
			ref: 'User'
		},
		// data denormalization for faster lookups
		postId: {
			type: mongoose.Types.ObjectId,
			required: true,
			index: true,
			ref: 'Post'
		},
		voteType: {
			type: String,
			required: true,
			enum: ['upvote', 'downvote']
		}
	},
	{
		timestamps: false
	}
);

export const Votes = mongoose.models.Vote || mongoose.model<IVote>('Vote', voteSchema);