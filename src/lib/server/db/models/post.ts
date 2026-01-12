import mongoose, { type Document, Schema } from 'mongoose';
import type { UserRole } from '../types';

export interface IPost extends Document {
    authorUserId: mongoose.Types.ObjectId | null;
    authorUsername: string;
	authorRole: UserRole | "anonymous";
    content: string;
    timestamp: number;
    commentsCount: number;
	discordWebhookMessages: {
		messageId: string;
		webhookUrl: string;
	}[];
    upvotesCount: number;
    downvotesCount: number;
	anonymous: boolean;
}

const postSchema = new Schema<IPost>(
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
		timestamp: {
			type: Number,
			required: true,
			default: () => Date.now()
		},
		discordWebhookMessages: {
			type: [
				{
					messageId: {
						type: String,
						required: true
					},
					webhookUrl: {
						type: String,
						required: true
					}
				}
			],
			default: []
		},
		commentsCount: {
			type: Number,
			default: 0
		},
		upvotesCount: {
			type: Number,
			default: 0
		},
		downvotesCount: {
			type: Number,
			default: 0
		}
	},
	{
		timestamps: false
	}
);

export const Posts = mongoose.models.Post || mongoose.model<IPost>('Post', postSchema);
