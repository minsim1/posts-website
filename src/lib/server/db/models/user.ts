import mongoose, { type Document, Schema } from 'mongoose';

export interface IUser extends Document {
	username: string;
	passwordHash: string;
	role: 'admin' | 'user' | 'moderator';
	canChangeUsername: boolean;
	lastUsernameChangeTimestamp: number;
	latestInteractions: {
		interactionType: 'comment' | 'vote' | 'post';
		timestamp: number;
	}[];
	suspension: {
		reason: string;
		suspendedUntilTimestamp: number | null;
		suspendorUserId: string;
		timestamp: number;
	} | null;
	suspensionHistory: {
		reason: string;
		suspendedUntilTimestamp: number | null;
		suspendorUserId: string;
		timestamp: number;
	}[];
	suspensionLiftHistory: {
		timestamp: number;
		liftorUserId: string;
		reason: string;
	}[];
	moderationLogs: {
		timestamp: number;
		action: "suspend_user" | "lift_suspension" | "delete_post" | "delete_comment";
		targetUserId: string | null;
		reason: string | null;
		content: string | null;
		contentType: "post" | "comment" | null;
		suspensionDuration: number | null;
		suspensionApplied: boolean;
		attemptedToApplySuspension: boolean;
	}[];
}

const userSchema = new Schema<IUser>(
	{
		username: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		passwordHash: {
			type: String,
			required: true
		},
		role: {
			type: String,
			enum: ['admin', 'user', 'moderator'],
			default: 'user'
		},
		canChangeUsername: {
			type: Boolean,
			default: true
		},
		lastUsernameChangeTimestamp: {
			type: Number,
			default: () => Date.now(),
		},
		latestInteractions: {
			type: [
				{
					interactionType: {
						type: String,
						enum: ['comment', 'vote', 'post'],
						required: true
					},
					timestamp: {
						type: Number,
						required: true
					}
				}
			],
			default: []
		},
		suspension: {
			type: {
				reason: {
					type: String,
					required: true
				},
				suspendedUntilTimestamp: {
					type: Number,
					default: null
				},
				suspendorUserId: {
					type: String,
					required: true
				},
				timestamp: {
					type: Number,
					required: true
				}
			},
			default: null
		},
		suspensionHistory: {
			type: [
				{
					reason: {
						type: String,
						required: true
					},
					suspendedUntilTimestamp: {
						type: Number,
						default: null
					},
					timestamp: {
						type: Number,
						required: true
					},
					suspendorUserId: {
						type: String,
						required: true
					}
				}
			],
			default: []
		},
		suspensionLiftHistory: {
			type: [
				{
					timestamp: {
						type: Number,
						required: true
					},
					liftorUserId: {
						type: String,
						required: true
					},
					reason: {
						type: String,
						required: true
					},
				}
			],
			default: []
		},
		moderationLogs: {
			type: [
				{
					timestamp: {
						type: Number,
						required: true
					},
					action: {
						type: String,
						enum: ["suspend_user", "lift_suspension", "delete_post", "delete_comment"],
						required: true
					},
					targetUserId: {
						type: String,
						// required: true
					},
					reason: {
						type: String,
						default: null
					},
					content: {
						type: String,
						default: null
					},
					contentType: {
						type: String,
						enum: ["post", "comment", null],
						default: null
					},
					suspensionDuration: {
						type: Number,
						default: null
					},
					suspensionApplied: {
						type: Boolean,
						default: false
					},
					attemptedToApplySuspension: {
						type: Boolean,
						default: false
					}
				}
			],
			default: []
		},
	},
	{
		timestamps: false
	}
);

export const Users = mongoose.models.User || mongoose.model<IUser>('User', userSchema);