import { Users, type IUser } from '../db/models/user';
import { connectDB } from '../db/database';
import { CompareStringWithHash, HashString } from '../helpers/hashing';
import { OTCs } from '../db/models/otc';
import mongoose, { type ClientSession } from 'mongoose';
import type { UserInteractionType, UserRole } from '../db/types';
import { configManager } from './config-manager';
import { Posts } from '../db/models/post';
import { Comments } from '../db/models/comment';

export default class UserManager {
	/**
	 * Get user by username and password
	 * Hashes the password before querying the database
	 */
	static async GetUserByCredentials(username: string, rawPassword: string, session?: ClientSession): Promise<IUser | null> {
		await connectDB();
		
		const user = await Users.findOne({ 
			username, 
		}).session(session || null);
		if(!user) return null;

		const hashesMatch = await CompareStringWithHash(rawPassword, user.passwordHash);
		if(!hashesMatch) return null;
		
		return user;
	}

	static IsNewSuspensionDurationLonger(user: IUser, newDuration: number | null): boolean {
		if(user.suspension == null) return true;
		if(user.suspension.suspendedUntilTimestamp == null) return false;
		if(newDuration == null) return true;
		const currentTimestamp = Date.now();
		const newReleaseTimestamp = currentTimestamp + newDuration;
		const currentRemainingDuration = user.suspension.suspendedUntilTimestamp;
		return newReleaseTimestamp > currentRemainingDuration;
	}

	static async ChangeUserPassword(userId: string, oldPassword: string, newPassword: string,) {
		const hashedNewPassword = await HashString(newPassword);

		type resultType = {
			success: true,
		} | {
			success: false;
			error: "unknown_error" | "incorrect_credentials" | "user_does_not_exist"
		}

		let result: resultType = {
			success: false,
			error: "unknown_error"
		}

		await connectDB();

		const session = await mongoose.startSession();
		try{
			await session.withTransaction(async ()=>{
				// Get user
				const user = await Users.findOne({ _id: userId }).session(session);
				if(!user) {
					result = {
						success: false,
						error: "user_does_not_exist"
					}
					throw new Error("user_does_not_exist");
				}

				// Check old password
				const hashesMatch = await CompareStringWithHash(oldPassword, user.passwordHash);
				if(!hashesMatch) {
					result = {
						success: false,
						error: "incorrect_credentials"
					}
					throw new Error("incorrect_credentials");
				}

				// Update password
				await Users.updateOne(
					{ _id: userId },
					{ $set: { passwordHash: hashedNewPassword } }
				).session(session);

				result = {
					success: true,
				};
			})
		}catch(err){
			//
		}finally{
			session.endSession();
		}

		return result as resultType;
	}

	/**
	 * Get user by ID
	 */
	static async GetUserById(userId: string): Promise<IUser | null> {
		await connectDB();
		
		const user = await Users.findById(userId);
		return user;
	}

	/**
	 * Get user by username
	 */
	static async GetUserByUsername(username: string): Promise<IUser | null> {
		await connectDB();
		
		const user = await Users.findOne({ username });
		return user;
	}

	/**
	 * Create a new user with protection against race conditions
	 */
	static async CreateRegularUser(
		username: string, 
		rawPassword: string, 
		registrationOTC: string,
	) {
		type result = {
			success: true;
			user: IUser;
		} | {
			success: false;
			error: "otc_invalid" | "username_taken" | "validation_error" | "unknown_error";
		}

		return new Promise<result>(async (resolve, reject) => {
			const hashedPassword = await HashString(rawPassword);
	
			await connectDB();

			const session = await mongoose.startSession();
			session.startTransaction();

			try {
				// Check if OTC exists
				const otc = await OTCs.findOne({ 
					code: registrationOTC
				}).session(session);

				if (!otc) {
					await session.abortTransaction();
					session.endSession();
					return resolve({ 
						success: false, 
						error: 'otc_invalid' 
					});
				}

				if(otc.expiresAtTimestamp <= new Date()){
					await session.abortTransaction();
					session.endSession();
					return resolve({
						success: false,
						error: 'otc_invalid'
					});
				}

				// Remove the OTC
				await OTCs.deleteOne({ _id: otc._id }).session(session);

				// Create the new user
				const user = await Users.create([{
					username,
					passwordHash: hashedPassword,
					role: "user",
					latestInteractions: [],
					registrationOTCs: [],
					suspension: null
				}], { session });

				await session.commitTransaction();
				session.endSession();

				return resolve({ success: true, user: user[0] });
			} catch (error: any) {
				await session.abortTransaction();
				session.endSession();
				if (error.code === 11000) {
					return resolve({ 
						success: false, 
						error: 'username_taken' 
					});
				}

				if (error.name === 'ValidationError') {
					return resolve({ 
						success: false, 
						error: 'validation_error' 
					});
				}

				return resolve({ 
					success: false, 
					error: 'unknown_error' 
				});
			}
		})
	}

	/**
	 * Create a new administrator user
	 */
	static async CreateAdministratorUser(
		username: string, 
		rawPassword: string, 
	) {
		type result = {
			success: true;
			user: IUser;
		} | {
			success: false;
			error:  "username_taken" | "validation_error" | "unknown_error";
		}

		return new Promise<result>(async (resolve, reject) => {
			const hashedPassword = await HashString(rawPassword);
	
			await connectDB();

			const session = await mongoose.startSession();
			session.startTransaction();

			try {
				// Create the new user
				const user = await Users.create([{
					username,
					passwordHash: hashedPassword,
					role: "admin",
				}], { session });

				await session.commitTransaction();
				session.endSession();

				return resolve({ success: true, user: user[0] });
			} catch (error: any) {
				await session.abortTransaction();
				session.endSession();
				if (error.code === 11000) {
					return resolve({ 
						success: false, 
						error: 'username_taken' 
					});
				}

				if (error.name === 'ValidationError') {
					return resolve({ 
						success: false, 
						error: 'validation_error' 
					});
				}

				return resolve({ 
					success: false, 
					error: 'unknown_error' 
				});
			}
		})
	}

	/**
	 * Check if username exists
	 */
	static async DoesUsernameExist(username: string): Promise<boolean> {
		await connectDB();
		
		const count = await Users.countDocuments({ username });
		return count > 0;
	}

	static async IsUserSuspended(userId: string, user?: IUser, session?: ClientSession): Promise<{
		suspended: false;
	} | {
		suspended: true;
		suspensionReason: string;
		suspendedUntilTimestamp: number | null;
	}> {
		await connectDB();
		
		if(!user){
			if(session){
				user = await Users.findById(userId).session(session) as IUser;	
			}else{
				user = await Users.findById(userId) as IUser;
			}
			if(!user) throw new Error('User not found');
		}

		if(user.suspension == null) return {
			suspended: false
		}

		if(user.suspension.suspendedUntilTimestamp === null) return {
			suspended: true,
			suspensionReason: user.suspension.reason,
			suspendedUntilTimestamp: null
		}

		const currentTimestamp = Date.now();
		if(user.suspension.suspendedUntilTimestamp <= currentTimestamp) return {
			suspended: false
		}

		return {
			suspended: true,
			suspensionReason: user.suspension.reason,
			suspendedUntilTimestamp: user.suspension.suspendedUntilTimestamp
		};
	}

	/**
	 * Does not check for the existance of the user.
	 * Suspends user, adds to history and moderation log.
	 */
	static async SuspendUser(user: IUser, reason: string, duration: number | null, suspendorUserId: string, session: ClientSession){
		await connectDB();

		const timestamp: number = Date.now();
		const suspendUntilTimestamp: number | null = duration === null ? null : timestamp + duration;

		// Create suspension object
		await Users.updateOne(
			{ _id: user._id },
			{ 
				suspension: {
					reason: reason,
					suspendedUntilTimestamp: suspendUntilTimestamp,
					timestamp: timestamp,
					suspendorUserId: suspendorUserId
				}
			}
		).session(session);

		// Add to suspension history
		await Users.updateOne(
			{ _id: user._id },
			{ 
				$push: {
					suspensionHistory: {
						reason: reason,
						suspendedUntilTimestamp: suspendUntilTimestamp,
						timestamp: timestamp,
						suspendorUserId: suspendorUserId
					}
				}
			}
		).session(session);

		// Add moderation log
		await this.AddModerationLogToUser({
			type: "suspension",
			targetUserId: user._id.toString(),
			reason: reason,
			suspensionDuration: duration,
			moderatorUserId: suspendorUserId,
			session: session
		});
	}

	static async ChangeUsername(userId: string, newUsername: string, rawPassword: string){
		type resultType = {
			success: boolean,
			error?: "unknown_error" | "username_taken" | "user_can_not_change_username" | "username_change_too_soon" | "user_does_not_exist" | "incorrect_credentials"
		}

		let result: resultType = {
			success: false,
			error: "unknown_error"
		}

		await connectDB();
		const session = await mongoose.startSession();
	
		try{
			const config = await configManager.GetConfig();
			await session.withTransaction(async ()=>{
				// Check if change can happen
				const user = await Users.findOne({_id: userId}).session(session) as IUser;
				if(!user) {
					result = {
						success: false,
						error: "user_does_not_exist"
					}
					throw new Error("user_does_not_exist");
				}

				const timeSinceLastChange = user.lastUsernameChangeTimestamp 
					? Date.now() - user.lastUsernameChangeTimestamp 
					: Infinity;
				
				if(timeSinceLastChange < config.limits.minWaitToChangeUsername && user.role !== "admin"){
					result = {
						success: false,
						error: "username_change_too_soon"
					}
					throw new Error("username_change_too_soon");
				}

				if(user.canChangeUsername == false){
					result = {
						success: false,
						error: "user_can_not_change_username"
					}
					throw new Error("user_can_not_change_username");
				}

				const hashCompare = await CompareStringWithHash(rawPassword, user.passwordHash);
				if(!hashCompare){
					result = {
						success: false,
						error: "incorrect_credentials"
					}
					throw new Error("incorrect_credentials");
				}

				const userWithNewUsername = await Users.findOne({username: newUsername}).session(session);
				if(userWithNewUsername){
					result = {
						success: false,
						error: "username_taken"
					}
					throw new Error("username_taken");
				}

				// Update username
				await Users.updateOne({
					_id: userId,
				},{
					$set:{
						username: newUsername,
						lastUsernameChangeTimestamp: Date.now()
					}
				},{session})

				// Update username in posts
				await Posts.updateMany({
					authorUserId: userId,
					anonymous: false,
				},{
					$set:{
						authorUsername: newUsername
					}
				}, {session})

				// Update username in comments
				await Comments.updateMany({
					authorUserId: userId,
					anonymous: false
				},{
					$set:{
						authorUsername: newUsername
					}
				},{session})

				result = {
					success: true
				}
			})
		}catch(e){
			//
		}finally{
			session.endSession();
		}

		return result as resultType;	
	}

	/**
	 * Does not check for limits, cleans up old interactions
	 */
	static async AddInteractionToUser(user: IUser, interactionType: UserInteractionType, session: ClientSession){
		await connectDB();

		const config = await configManager.GetConfig();
		// Insert interaction
		await Users.updateOne({
			_id: user._id,
		},{
			$push: {
				latestInteractions: {
					interactionType: interactionType,
					timestamp: Date.now()
				}
			}
		}, {session})

		// Remove interactions older than the limit
		const cutoffTimestamp = Date.now() - config.limits.maxInteractionAgeToSave;
		await Users.updateOne({
			_id: user._id,
		},{
			$pull: {
				latestInteractions: {
					timestamp: { $lt: cutoffTimestamp }
				}
			}
		}, {session})

		// Remove interactions if exceeding max count
		if(user.latestInteractions.length > config.limits.maxInteractionsToSave){
			const interactionsToRemove = user.latestInteractions.length - config.limits.maxInteractionsToSave;
			// Sort interactions by timestamp ascending
			const sortedInteractions = user.latestInteractions.sort((a, b) => a.timestamp - b.timestamp);
			const timestampsToRemove = sortedInteractions.slice(0, interactionsToRemove).map(interaction => interaction.timestamp);

			await Users.updateOne({
				_id: user._id,
			},{
				$pull: {
					latestInteractions: {
						timestamp: { $in: timestampsToRemove }
					}
				}
			}, {session})
		}
	}

	static async AddModerationLogToUser(params: {
		type: "content_deletion",
		contentType: "post" | "comment",
		targetUserId?: string,
		content: string,

		moderatorUserId: string,
		session: ClientSession,
		suspensionApplied: boolean,
		attemptedToApplySuspension: boolean,
	} | {
		type: "suspension",
		targetUserId?: string,
		reason: string,
		suspensionDuration: number | null,

		moderatorUserId: string,
		session: ClientSession,
	} | {
		type: "suspension_lift",
		targetUserId?: string,
		reason: string,

		moderatorUserId: string,
		session: ClientSession,
	}){
		await connectDB();
		
		const timestamp: number = Date.now();
		let action: "suspend_user" | "lift_suspension" | "delete_post" | "delete_comment";
		let contentType: "post" | "comment" | null = null;
		let content: string | null = null;
		let suspensionDuration: number | null = null;
		let suspensionApplied: boolean = false;
		let attemptedToApplySuspension: boolean = false;
		let targetUserId = params.targetUserId ? params.targetUserId : null;

		if(params.type === "content_deletion"){
			action = "delete_" + params.contentType;
			contentType = params.contentType;
			content = params.content;
			suspensionApplied = params.suspensionApplied;
			attemptedToApplySuspension = params.attemptedToApplySuspension;
		}else if(params.type === "suspension"){
			action = "suspend_user";
			suspensionDuration = params.suspensionDuration;
		}else if(params.type === "suspension_lift"){
			action = "lift_suspension";
		}else{
			throw new Error("Invalid moderation log type");
		}

		await Users.updateOne(
			{ _id: params.moderatorUserId },
			{ 
				$push: {
					moderationLogs: {
						timestamp: timestamp,
						action: action,
						targetUserId: targetUserId,
						reason: 'reason' in params ? params.reason : null,
						content: content,
						contentType: contentType,
						suspensionDuration: suspensionDuration,
						suspensionApplied: suspensionApplied,
						attemptedToApplySuspension: attemptedToApplySuspension
					}
				}
			},
			{ session: params.session }
		);
	}

	static async GetLastUserSuspension(user: IUser, session: ClientSession){
		await connectDB();

		if(user.suspensionHistory.length === 0) return null;

		// Sort by timestamp descending
		const sortedHistory = user.suspensionHistory.sort((a, b) => b.timestamp - a.timestamp);
		return sortedHistory[0];
	}

	/**
	 * Create a moderator user (admin only)
	 */
	static async CreateModeratorUser(username: string, rawPassword: string) {
		type result = {
			success: true;
			user: IUser;
		} | {
			success: false;
			error: "username_taken" | "validation_error" | "unknown_error";
		}

		const hashedPassword = await HashString(rawPassword);
		await connectDB();

		const session = await mongoose.startSession();
		session.startTransaction();

		try {
			const user = await Users.create([{
				username,
				passwordHash: hashedPassword,
				role: "moderator",
			}], { session });

			await session.commitTransaction();
			session.endSession();

			return { success: true, user: user[0] } as result;
		} catch (error: any) {
			await session.abortTransaction();
			session.endSession();

			if (error.code === 11000) {
				return { success: false, error: 'username_taken' } as result;
			}

			if (error.name === 'ValidationError') {
				return { success: false, error: 'validation_error' } as result;
			}

			return { success: false, error: 'unknown_error' } as result;
		}
	}

	/**
	 * Delete user by ID (admin only)
	 */
	static async DeleteUserById(userId: string) {
		await connectDB();

		const result = await Users.deleteOne({ _id: userId });
		return result.deletedCount === 1;
	}

	/**
	 * Admin verify user password
	 */
	static async VerifyUserPassword(userId: string, password: string): Promise<boolean | null> {
		await connectDB();
		
		const user = await Users.findById(userId);
		if (!user) {
			return null;
		}

		const isCorrect = await CompareStringWithHash(password, user.passwordHash);
		return isCorrect;
	}

	/**
	 * Admin change user password (without requiring old password)
	 */
	static async AdminChangeUserPassword(userId: string, newPassword: string) {
		const hashedPassword = await HashString(newPassword);
		await connectDB();

		const result = await Users.updateOne(
			{ _id: userId },
			{ 
				$set: { 
					passwordHash: hashedPassword,
					lastPasswordChangeTimestamp: Date.now()
				} 
			}
		);

		return result.modifiedCount === 1;
	}

	/**
	 * Admin change username (without requiring password)
	 */
	static async AdminChangeUsername(userId: string, newUsername: string) {
		type result = {
			success: true;
		} | {
			success: false;
			error: "user_not_found" | "username_taken" | "unknown_error";
		}

		await connectDB();

		const session = await mongoose.startSession();
		try {
			await session.withTransaction(async () => {
				const user = await Users.findOne({ _id: userId }).session(session);
				if (!user) {
					throw new Error("user_not_found");
				}

				const result = await Users.updateOne(
					{ _id: userId },
					{ 
						$set: { 
							username: newUsername,
							lastUsernameChangeTimestamp: Date.now()
						} 
					}
				).session(session);

				if (result.modifiedCount === 0) {
					throw new Error("unknown_error");
				}
			});

			session.endSession();
			return { success: true } as result;
		} catch (error: any) {
			session.endSession();

			if (error.message === "user_not_found") {
				return { success: false, error: "user_not_found" } as result;
			}

			if (error.code === 11000) {
				return { success: false, error: "username_taken" } as result;
			}

			return { success: false, error: "unknown_error" } as result;
		}
	}

	/**
	 * Set whether user can change their username
	 */
	static async SetCanChangeUsername(userId: string, canChangeUsername: boolean) {
		await connectDB();

		const result = await Users.updateOne(
			{ _id: userId },
			{ $set: { canChangeUsername } }
		);

		return result.modifiedCount === 1;
	}

	/**
	 * Get all users (optionally filtered by role or username)
	 */
	static async GetAllUsers(roleFilter?: UserRole, username?: string) {
		await connectDB();

		const query: any = {};
		if (roleFilter) {
			query.role = roleFilter;
		}
		if (username) {
			query.username = username;
		}

		return await Users.find(query).select('_id username role').lean();
	}

	/**
	 * Admin suspend user - does not require session, creates one internally
	 */
	static async AdminSuspendUser(userId: string, duration: number | null, suspendorUserId: string, reason?: string) {
		type resultType = {
			success: true;
		} | {
			success: false;
			error: "user_not_found" | "unknown_error";
		}
		let result: resultType = { success: false, error: "unknown_error" };

		await connectDB();

		const session = await mongoose.startSession();
		try {

			await session.withTransaction(async () => {
				const user = await Users.findById(userId).session(session);
				if (!user) {
					result = { success: false, error: "user_not_found" };
					throw new Error("user_not_found");
				}

				await this.SuspendUser(user, reason ?? "", duration, suspendorUserId, session);
				result = { success: true };
			});

			session.endSession();
		} catch (error: any) {
			if (error.message === "user_not_found") {
				result = { success: false, error: "user_not_found" };
			}else{
				result = { success: false, error: "unknown_error" };
			}
		}finally{
			session.endSession();
			return result;
		}
	}

	/**
	 * Admin lift user suspension - does not require session, creates one internally
	 */
	static async AdminLiftSuspension(userId: string, liftorUserId: string, reason: string | null) {
		type result = {
			success: true;
		} | {
			success: false;
			error: "user_not_found" | "no_active_suspension" | "unknown_error";
		}

		await connectDB();

		const session = await mongoose.startSession();
		try {
			let result: result = { success: false, error: "unknown_error" };

			await session.withTransaction(async () => {
				const user = await Users.findById(userId).session(session);
				if (!user) {
					result = { success: false, error: "user_not_found" };
					throw new Error("user_not_found");
				}

				if (!user.suspension) {
					result = { success: false, error: "no_active_suspension" };
					throw new Error("no_active_suspension");
				}

				const timestamp = Date.now();

				// Remove suspension
				await Users.updateOne(
					{ _id: userId },
					{ $unset: { suspension: "" } }
				).session(session);

				// Add to suspension lift history
				await Users.updateOne(
					{ _id: userId },
					{
						$push: {
							suspensionLiftHistory: {
								timestamp: timestamp,
								liftorUserId: liftorUserId,
								reason: reason || null
							}
						}
					}
				).session(session);

				// Add moderation log
				await this.AddModerationLogToUser({
					type: "suspension_lift",
					targetUserId: userId,
					reason: reason || "No reason provided",
					moderatorUserId: liftorUserId,
					session: session
				});

				result = { success: true };
			});

			session.endSession();
			return result;
		} catch (error: any) {
			session.endSession();
			if (error.message === "user_not_found") {
				return { success: false, error: "user_not_found" } as result;
			}
			if (error.message === "no_active_suspension") {
				return { success: false, error: "no_active_suspension" } as result;
			}
			return { success: false, error: "unknown_error" } as result;
		}
	}

	static async GetNumOfModLogsOlderThan(timestampCutoff: number): Promise<number> {
		await connectDB();
		
		const result = await Users.aggregate([
			{ $unwind: "$moderationLogs" },
			{ $match: { "moderationLogs.timestamp": { $lt: timestampCutoff } } },
			{ $count: "total" }
		]);

		return result.length > 0 ? result[0].total : 0;
	}

	/**
	 * Returns the number of affected users whose mod logs were deleted
	 */
	static async DeleteModLogsOlderThan(timestampCutoff: number){
		await connectDB();

		const result = await Users.updateMany(
			{},
			{
				$pull: {
					moderationLogs: {
						timestamp: { $lt: timestampCutoff }
					}
				}
			}
		);

		return result.modifiedCount;
	}
}
