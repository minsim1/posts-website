import mongoose, { type Document, Schema } from 'mongoose';
import type { UserInteractionType } from '../types';

export interface IConfig extends Document {
	userInteractionLimits: {
		limitId: string;
		timeframe: number;
		maxInteractions: number;
		interactionTypes: UserInteractionType[];
	}[];
	postingRules: string[];
	postsDiscordWebhookUrls: string[];
	disallowedUsernamePatterns: string[];
	limits:{
		maxInteractionsToSave: number;
		maxInteractionAgeToSave: number;
		maxPostLength: number;
		maxCommentLength: number;
		maxJwtAge: number;
		maxPostAgeToAllowDelete: number;
		maxCommentAgeToAllowDelete: number;
		maxPostAgeToComment: number;
		minWaitToChangeUsername: number;
		maxModerationLogAgeToSave: number;
	}
}

const configSchema = new Schema<IConfig>(
	{
		userInteractionLimits: {
			type: [
				{
					limitId: {
						type: String,
						required: true,
						default: () => crypto.randomUUID()
					},
					timeframe: {
						type: Number,
						required: true
					},
					maxInteractions: {
						type: Number,
						required: true
					},
					interactionTypes: {
						type: [String],
						enum: ['comment', 'vote', 'post'],
						required: true
					}
				}
			],
			default: [],
		},
		postingRules: {
			type: [String],
			default: [],
			validate: {
				validator: function(v: string[]) {
					// Ensure no duplicate posting rules
					return Array.isArray(v) && new Set(v).size === v.length;
				},
				message: 'Posting rules must be an array of unique strings.'
			}
		},
		postsDiscordWebhookUrls: {
			type: [String],
			default: [],
			validate: {
				validator: function(v: string[]) {
					// Ensure no duplicate webhook URLs
					return Array.isArray(v) && new Set(v).size === v.length;
				},
				message: 'Posts Discord webhook URLs must be an array of unique strings.'
			}
		},
		disallowedUsernamePatterns: {
			type: [String],
			default: [],
			validate: {
				validator: function(v: string[]) {
					// Ensure no duplicate posting rules
					return Array.isArray(v) && new Set(v).size === v.length;
				},
				message: 'Disallowed username patterns must be an array of unique strings.'
			}
		},
		limits:{
			maxInteractionAgeToSave: {
				type: Number,
				default: 1000 * 60 * 60 * 24 * 2 // 2 days
			},
			maxInteractionsToSave: {
				type: Number,
				default: 100
			},
			maxPostLength: {
				type: Number,
				default: 5000
			},
			maxCommentLength: {
				type: Number,
				default: 1000
			},
			maxJwtAge: {
				type: Number,
				default: 1000 * 60 * 60 * 24 * 45 // 45 days
			},
			maxPostAgeToAllowDelete: {
				type: Number,
				default: 1000 * 60 * 60 * 24 * 7 // 7 days
			},
			maxCommentAgeToAllowDelete: {
				type: Number,
				default: 1000 * 60 * 60 * 24 * 7 // 7 days
			},
			maxPostAgeToComment: {
				type: Number,
				default: 1000 * 60 * 60 * 24 * 30 // 30 days
			},
			minWaitToChangeUsername: {
				type: Number,
				default: 1000 * 60 * 60 * 24 * 7 // 7 days
			},
			maxModerationLogAgeToSave: {
				type: Number,
				default: 1000 * 60 * 60 * 24 * 90 // 90 days
			}
		}
	},
	{
		timestamps: false
	}
);

export const Config = mongoose.models.Config || mongoose.model<IConfig>('Config', configSchema);