import { Users, type IUser } from '../db/models/user';
import { connectDB } from '../db/database';
import { Posts, type IPost } from '../db/models/post';
import { Comments } from '../db/models/comment';
import { Votes } from '../db/models/vote';
import mongoose from 'mongoose';
import UserManager from './user-manager';
import type { UserRole } from '$lib/server/db/types';
import { configManager } from './config-manager';
import { CanUserSuspendUser, ShouldDeleteContent } from '../helpers/rules';
import { CanUserDoInteraction } from '$lib/helpers/rules';
import { DiscordWebhooks } from '../helpers/discord-webhooks';

interface CreatePostParams{
	authorUserId: string;
	anonymous: boolean;
	body: string;
}

export default class PostManager {
	/**
	 * Creates a post.
	 * Checks if the user is suspended before allowing post creation.
	 */
	static async CreatePost(params: CreatePostParams) {
		type resultType = {
			success: true;
			postId: string;
		} | {
			success: false;
			error: "user_not_found" | "user_suspended" | "unknown_error" | "posting_violates_limit_rules" | "post_too_long";
		}

		let result: resultType = {
			success: false,
			error: "unknown_error"
		}

		await connectDB();

		const session = await mongoose.startSession();
		let webhookUrls: string[] = [];
		let posterRole: "anonymous" | UserRole = "anonymous";
		let authorUsername = "";

		try{
			await session.withTransaction(async () => {
				const config = await configManager.GetConfig();
				webhookUrls = config.postsDiscordWebhookUrls;

				if(params.body.length > config.limits.maxPostLength){
					result = { success: false, error: "post_too_long" }
					throw new Error("post_too_long")
				}

				const user = await Users.findOne({
					_id: params.authorUserId
				}).session(session) as IUser;

				if(!user){
					result = { success: false, error: "user_not_found" }
					throw new Error("user_not_found");
				}

				const isSuspendedRes = await UserManager.IsUserSuspended(params.authorUserId, undefined, session);
				if(isSuspendedRes.suspended == true){
					result = { success: false, error: "user_suspended" }
					throw new Error("user_suspended")
				}

				const canPost = CanUserDoInteraction(
					'post',
					user.latestInteractions,
					config.userInteractionLimits
				)

				if(canPost.canDoInteraction == false && user.role !== 'admin'){
					result = { success: false, error: "posting_violates_limit_rules" }
					throw new Error("posting_violates_limit_rules");
				}

				if(params.anonymous){
					authorUsername = "Anonymous"
					posterRole = "anonymous";
				}else{
					authorUsername = user.username;
					posterRole = user.role;
				}
		
				// Create post
				const createdPosts = await Posts.create([{
					authorUserId: params.authorUserId,
					authorUsername: authorUsername,
					anonymous: params.anonymous,
					content: params.body,
					authorRole: params.anonymous ? "anonymous" : user.role,
				}], {session})

				if (!createdPosts || createdPosts.length === 0) {
					result = { success: false, error: "unknown_error" }
					throw new Error("post_creation_failed");
				}
		
				// Add interaction log to user
				await UserManager.AddInteractionToUser(
					user,
					'post',
					session
				)

				result = {
					success: true,
					postId: createdPosts[0]._id.toString()
				}
			})
		}catch(err){
			// console.log(err);
		}finally{
			session.endSession();
		}

		result = result as resultType;

		if(result.success === true && webhookUrls.length > 0){
			// Send to discord webhook after transaction is complete
			// We dont care about failures here
			let postId = result.postId;

			DiscordWebhooks.SendPostToChannels(
				webhookUrls,
				{
					authorRole: posterRole,
					authorName: authorUsername,
					content: params.body,
					id: result.postId
				}
			).then(res => {
				// Update post with webhook message IDs
				if(res.successfulUrlsAndMessageIds.length > 0){
					const discordWebhookMessages = res.successfulUrlsAndMessageIds.map(r => ({ messageId: r.messageId, webhookUrl: r.url }));
					Posts.updateOne(
						{ _id: postId },
						{ $set:
							{
								discordWebhookMessages: discordWebhookMessages
							}
						}
					).then(()=>{}).catch(err=>{})// Need to "await" otherwise the operation doesnt finish
				}
			}).catch(err=>{
				// console.log(err);
			})
		}
		
		return result;
	}

	static async GetPostById(postId: string): Promise<IPost>{
		await connectDB();
		
		const post = await Posts.findOne({ _id: postId });

		return post;
	}

	/**
	 * Gets all the posts made on that day
	 */
	static async GetPostsByDateRange(dateRangeStart: number, dateRangeEnd: number): Promise<IPost[]>{
		await connectDB();

		const posts = await Posts.find({
			timestamp: {
				$gte: dateRangeStart,
				$lte: dateRangeEnd
			}
		}).sort({ timestamp: -1 });

		return posts;
	}

	/**
	 * Gets all posts created after a specific timestamp, sorted by most recent first
	 */
	static async GetPostsAfterTimestamp(timestamp: number): Promise<IPost[]>{
		await connectDB();

		const posts = await Posts.find({
			timestamp: {
				$gte: timestamp
			}
		}).sort({ timestamp: -1 });

		return posts;
	}

	static async DeletePost(
		postId: string,
		deletorUserId: string,
		deletorRole: UserRole,
		suspension?:{
			reason: string;
			duration: number | null;
		}
	) {
		type resultType = {
			success: true;
			suspensionApplied?: "applied" | "not_applied_new_is_shorter"
		} | {
			success: false;
			error: "post_not_found" | "user_not_found" | "unknown_error" | "unauthorized_suspension" | "not_owner" | "too_old_to_delete" | "unauthorized_deletion" | "deletor_suspended";
		}

		let result: resultType = {
			success: false,
			error: "unknown_error"
		}

		await connectDB();
		const session = await mongoose.startSession();
		let discordMessagesToDelete: { messageId: string; webhookUrl: string }[] = [];

		try{
			const config = await configManager.GetConfig();
			await session.withTransaction(async ()=>{
				const post = await Posts.findOne({ _id: postId }).session(session) as IPost | null;
				if(!post){
					result = {
						success: false,
						error: "post_not_found"
					}
					throw new Error("post_not_found")
				}

				const postCreator = await Users.findOne({ _id: post.authorUserId }).session(session).catch(() => null) as IUser | null;
				
				let postCreatorRole: UserRole;
				if(!postCreator){
					// If post creator no longer exists, treat them as a normal user
					postCreatorRole = "user";
				}else{
					postCreatorRole = postCreator.role;
				}

				const postDeletor = await Users.findOne({ _id: deletorUserId }).session(session) as IUser;
				if(!postDeletor){
					result = {
						success: false,
						error: "user_not_found"
					}
					throw new Error("user_not_found")
				}

				const deletorSuspensionStatus = await UserManager.IsUserSuspended(postDeletor._id.toString(), postDeletor, session)
				if(deletorSuspensionStatus.suspended == true){
					result = {
						success: false,
						error: "deletor_suspended"
					}
					throw new Error("deletor_suspended");
				}

				let deletorIsAuthor = post.authorUserId ? post.authorUserId.toString() === deletorUserId : false;

				const shouldDelete = ShouldDeleteContent({
					authorRole: post.anonymous ? "anonymous" : postCreatorRole,
					contentCreationTimestamp: post.timestamp,
					deletorIsAuthor: deletorIsAuthor,
					deletorRole: deletorRole,
					maxDeletableContentAge: config.limits.maxPostAgeToAllowDelete
				})

				if(shouldDelete.shouldDelete === false){
					if(shouldDelete.reason === "not_owner"){
						result = {
							success: false,
							error: "not_owner"
						}
						throw new Error("not_owner");
					}

					if(shouldDelete.reason === "insufficient_permissions"){
						result = {
							success: false,
							error: "unauthorized_deletion"
						}
						throw new Error("unauthorized_deletion");
					}

					if(shouldDelete.reason === "too_old_to_delete"){
						result = {
							success: false,
							error: "too_old_to_delete"
						}
						throw new Error("too_old_to_delete");
					}
				}

				// Delete associated comments
				await Comments.deleteMany({ postId: post._id }).session(session);

				// Delete associated votes
				await Votes.deleteMany({ postId: post._id }).session(session);

				// Delete the post
				await Posts.deleteOne({ _id: post._id }).session(session);

				let suspensionApplied = false;
				let newSuspensionIsShorter = false;
				// Suspend the author if needed
				if(suspension){
					const shouldSuspend = CanUserSuspendUser({
						suspenderRole: deletorRole,
						suspendeeRole: postCreatorRole,
						content: {
							wasAnonymous: post.anonymous
						}
					})

					if(shouldSuspend.actionToTake === "silently_ignore"){
						result = {
							success: true
						}
					}else if(shouldSuspend.actionToTake === "disallow"){
						result = {
							success: false,
							error: "unauthorized_suspension"
						}
						throw new Error("unauthorized_suspension");
					}else if(!postCreator){
						result = {
							success: false,
							error: "user_not_found"
						}
						throw new Error("user_not_found");
					}else if(shouldSuspend.actionToTake === "suspend"){
						const isNewSuspensionLonger = UserManager.IsNewSuspensionDurationLonger(
							postCreator,
							suspension.duration
						);

						if(isNewSuspensionLonger){
							suspensionApplied = true;
							await UserManager.SuspendUser(
								postCreator,
								suspension.reason,
								suspension.duration,
								deletorUserId,
								session
							)
						}else{
							newSuspensionIsShorter = true;
						}
					}
				}

				if(deletorIsAuthor){
					// Post deleted by someone other than the author, add moderation log
					await UserManager.AddModerationLogToUser(
						{
							type: "content_deletion",
							session: session,
							content: post.content,
							contentType: "post",
							targetUserId: post.authorUserId ? post.authorUserId.toString() : undefined,
							moderatorUserId: deletorUserId,
							suspensionApplied: suspensionApplied,
							attemptedToApplySuspension: suspension ? true : false,
						}
					)
				}

				discordMessagesToDelete = post.discordWebhookMessages || [];

				result = {
					success: true,
					suspensionApplied: suspensionApplied ? "applied" : (newSuspensionIsShorter ? "not_applied_new_is_shorter" : undefined)
				}
			})
		}catch(error){
			// 
		}finally{
			session.endSession();
		}

		result = result as resultType;

		if(result.success === true && discordMessagesToDelete.length > 0){
			// Delete discord webhook messages after transaction is complete
			// We dont care about failures here
			DiscordWebhooks.DeleteMessages(
				discordMessagesToDelete.map(d => {
					return {
						messageId: d.messageId,
						url: d.webhookUrl
					}
				}),
			).catch(err=>{
				// console.log(err);
			})
		}

		return result;
	}

	static async GetLastAuthorSuspension(
		postId: string
	){
		await connectDB();

		type returnType = {
			success: true;
			suspension: {
				timestamp: number;
				suspendedUntilTimestamp: number | null;
				reason: string;
			} | null;
		} | {
			success: false;
			error: "post_not_found" | "user_not_found" | "unknown_error" | "author_id_expunged";
		}

		let result: returnType = {
			success: false,
			error: "unknown_error"
		}

		const session = await mongoose.startSession();

		try{
			await session.withTransaction(async () => {
				const post = await Posts.findById(postId).session(session) as IPost | null;
				if(!post){
					result = {
						success: false,
						error: "post_not_found"
					}
					throw new Error("post_not_found");
				}

				if(!post.authorUserId){
					result = {
						success: false,
						error: "author_id_expunged"
					}
					throw new Error("author_id_expunged");
				}
				
				const postAuthor = await Users.findById(post.authorUserId).session(session);
				if(!postAuthor){
					result = {
						success: false,
						error: "user_not_found"
					}
					throw new Error("user_not_found");
				}

				const lastSuspension = await UserManager.GetLastUserSuspension(postAuthor, session);
				if(!lastSuspension){
					result = {
						success: true,
						suspension: null
					}
					return;
				}

				result = {
					success: true,
					suspension: {
						timestamp: lastSuspension.timestamp,
						suspendedUntilTimestamp: lastSuspension.suspendedUntilTimestamp,
						reason: lastSuspension.reason
					}
				}
			})	
		}catch(err){
			// console.log(err);
		}finally{
			session.endSession();
		}

		return result as returnType;
	}

	static async GetNumOfAnonPostsWithPresentAuthorIdBeforeTimestamp(timestamp: number){
		await connectDB();

		const result = await Posts.aggregate([
			{$match: { "authorUserId": { $ne: null }, "anonymous": true, "timestamp": { $lt: timestamp } }},
			{$count: "total"}
		])

		return result.length > 0 ? result[0].total : 0;
	}

	static async DeleteAnonPostsWithPresentAuthorIdBeforeTimestamp(cutoffTimestamp: number){
		await connectDB();

		const result = await Posts.updateMany(
			{
				timestamp: {$lt: cutoffTimestamp},
				anonymous: true,
				authorUserId: { $ne: null }
			},
			{
				$set:{
					"authorUserId": null,
				}
			}
		)

		return result.modifiedCount;
	}
}