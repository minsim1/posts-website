import mongoose, { type Document, Schema } from 'mongoose';

export interface IOTC extends Document {
	code: string;
	ownerUserId: mongoose.Types.ObjectId;
	expiresAtTimestamp: Date;
}

const otcSchema = new Schema<IOTC>(
	{
		code: {
			type: String,
			required: true,
			unique: true
		},
		ownerUserId: {
			type: mongoose.Types.ObjectId,
			required: true,
			ref: 'User'
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

export const OTCs = mongoose.models.OTC || mongoose.model<IOTC>('OTC', otcSchema);