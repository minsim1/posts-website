import mongoose, { type Document, Schema } from 'mongoose';

export interface ISession extends Document {
	hashedToken: string;
	userId: mongoose.Types.ObjectId;
	expiresAtTimestamp: Date;
}

const sessionSchema = new Schema<ISession>(
	{
		hashedToken: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		userId: {
			type: mongoose.Types.ObjectId,
			required: true,
			ref: 'User',
			index: true,
		},
		expiresAtTimestamp: {
			type: Date,
			required: true,
			index: { expires: 0 }
		}
	},
	{
		timestamps: false
	}
);

export const Sessions = mongoose.models.Session || mongoose.model<ISession>('Session', sessionSchema);