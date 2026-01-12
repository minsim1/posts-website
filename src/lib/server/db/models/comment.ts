import mongoose, { type Document, Schema } from 'mongoose';
import type { UserRole } from '../types';

export interface IComment extends Document {
	postId: mongoose.Types.ObjectId;
    authorUserId: mongoose.Types.ObjectId | null;
    authorUsername: string;
	authorRole: UserRole | "anonymous";
	anonymous: boolean;
    content: string;
    createdAt: number;
}

const commentSchema = new Schema<IComment>(
	{
		authorUserId: {
			type: mongoose.Types.ObjectId,
			// required: true,
			ref: 'User'
		},
		// data denormalization for faster lookups
		authorUsername: {
			type: String,
			required: true
		},
		authorRole: {
			type: String,
			enum: ['admin', 'user', 'moderator', 'anonymous'],
			required: true
		},
		anonymous: {
			type: Boolean,
			required: true,
		},
		content: {
			type: String,
			required: true
		},
		createdAt: {
			type: Number,
			required: true
		},
		postId: {
			type: mongoose.Types.ObjectId,
			required: true,
			ref: 'Post'
		}
	},
	{
		timestamps: false
	}
);

export const Comments = mongoose.models.Comment || mongoose.model<IComment>('Comment', commentSchema);
