import mongoose from "mongoose";
import { connectDB } from "../db/database";
import { Users, type IUser } from "../db/models/user";
import UserManager from "./user-manager";
import { configManager } from "./config-manager";
import { CanUserDoInteraction } from "$lib/helpers/rules";
import { Comments, type IComment } from "../db/models/comment";
import { CanUserSuspendUser, ShouldDeleteContent } from "../helpers/rules";
import type { UserRole } from "../db/types";
import { Posts, type IPost } from "../db/models/post";

export default class CommentManager{
    static async CreateComment(
        postId: string,
        authorUserId: string,
        content: string,
        anonymous: boolean
    ){
        await connectDB();

        type returnType = {
            success: true;
        } | {
            success: false;
            error: 'post_not_found' | 'user_not_found' | 'commenting_violates_limits' | 'user_suspended' | 'unknown_error' | 'comment_too_long' | 'post_too_old_to_comment_on';
        }

        let result: returnType = {
            success: false,
            error: 'unknown_error'
        };

        const session = await mongoose.startSession();
        try{
            await session.withTransaction(async () => {
                const config = await configManager.GetConfig();
                if(content.length > config.limits.maxCommentLength){
                    result = {
                        success: false,
                        error: 'comment_too_long'
                    };
                    throw new Error('Comment too long');
                }

                const user = await Users.findById(authorUserId).session(session) as IUser;
                if(!user){
                    result = {
                        success: false,
                        error: 'user_not_found'
                    };
                    throw new Error('User not found');
                }

                const post = await Posts.findById(postId).session(session) as IPost;
                if(!post){
                    result = {
                        success: false,
                        error: 'post_not_found'
                    };
                    throw new Error('Post not found');
                }

                if(post.timestamp + config.limits.maxPostAgeToComment < Date.now()){
                    result = {
                        success: false,
                        error: 'post_too_old_to_comment_on'
                    };
                    throw new Error('Post too old to comment on');
                }

                const suspensionStatus = await UserManager.IsUserSuspended(authorUserId, user, session);
                if(suspensionStatus.suspended == true){
                    result = {
                        success: false,
                        error: 'user_suspended'
                    };
                    throw new Error('User is suspended');
                }

                const canDoInteraction = CanUserDoInteraction(
                    'comment',
                    user.latestInteractions,
                    config.userInteractionLimits
                )

                if(!canDoInteraction.canDoInteraction && user.role !== 'admin'){
                    result = {
                        success: false,
                        error: 'commenting_violates_limits'
                    };
                    throw new Error('Commenting violates limits');
                }

                await Comments.create([{
                    postId,
                    authorUserId,
                    content,
                    authorRole: anonymous ? "anonymous" : user.role,
                    anonymous,
                    authorUsername: anonymous ? "anonymous" : user.username,
                    createdAt: Date.now()
                }], { session });

                // Increment comment count on post
                await post.updateOne({
                    $inc: { commentsCount: 1 }
                }).session(session);

                // Update user's latest interactions
                await UserManager.AddInteractionToUser(
                    user,
                    'comment',
                    session
                )

                result = {
                    success: true
                }
            })
        }catch(err){

        }finally{
            session.endSession();
        }

        return result as returnType;
    }

    static async DeleteComment(
        commentId: string,
        postId: string,
        deletorUserId: string,
        suspension?: { reason: string; duration: number | null }
    ){
        await connectDB();

        type returnType = {
            success: true;
            suspensionApplied?: "applied" | "not_applied_new_is_shorter"
        } | {
            success: false;
            error: 'comment_not_found' | 'user_not_found' | 'comment_too_old_to_delete' | 'deletor_suspended' | 'unauthorized_deletion' | 'unknown_error' | 'unauthorized_suspension' | 'not_owner' | 'post_not_found';
        }

        let result: returnType = {
            success: false,
            error: 'unknown_error'
        };

        const session = await mongoose.startSession();
        try{
            await session.withTransaction(async () => {
                const user = await Users.findById(deletorUserId).session(session) as IUser;
                if(!user){
                    result = {
                        success: false,
                        error: 'user_not_found'
                    };
                    throw new Error('User not found');
                }

                const post = await Posts.findOne({ _id: postId }).session(session) as IPost | null;
                if(!post){
                    result = {
                        success: false,
                        error: 'post_not_found'
                    };
                    throw new Error('Post not found for comment');
                }

                const suspensionStatus = await UserManager.IsUserSuspended(deletorUserId, user, session);
                if(suspensionStatus.suspended == true){
                    result = {
                        success: false,
                        error: 'deletor_suspended'
                    };
                    throw new Error('Deletor is suspended');
                }

                const comment = await Comments.findById(commentId).session(session) as IComment;
                if(!comment){
                    result = {
                        success: false,
                        error: 'comment_not_found'
                    };
                    throw new Error('Comment not found');
                }

                const config = await configManager.GetConfig();

                const commentAuthor = await Users.findById(comment.authorUserId).session(session) as IUser;
                let commentAuthorRole: UserRole;
                if(!commentAuthor){
                    // If comment author no longer exists, treat them as a normal user
                    commentAuthorRole = 'user';
                }else{
                    commentAuthorRole = commentAuthor.role;
                }

                let deletorIsAuthor = comment.authorUserId ? comment.authorUserId.toString() === deletorUserId : false;

                const shouldDeleteComment = ShouldDeleteContent({
                    authorRole: comment.anonymous ? "anonymous" : commentAuthorRole,
                    contentCreationTimestamp: comment.createdAt,
                    deletorRole: user.role,
                    deletorIsAuthor: deletorIsAuthor,
                    maxDeletableContentAge: config.limits.maxCommentAgeToAllowDelete
                })

                if(!shouldDeleteComment.shouldDelete){
                    if(shouldDeleteComment.reason == "not_owner"){
                        result = {
                            success: false,
                            error: 'not_owner'
                        };
                        throw new Error('Deletor is not the owner of the comment');
                    }

                    if(shouldDeleteComment.reason == "insufficient_permissions"){
                        result = {
                            success: false,
                            error: 'unauthorized_deletion'
                        };
                        throw new Error('Deletor has insufficient permissions to delete the comment');
                    }

                    if(shouldDeleteComment.reason == "too_old_to_delete"){
                        result = {
                            success: false,
                            error: 'comment_too_old_to_delete'
                        };
                        throw new Error('Comment is too old to delete');
                    }
                }

                // Delete the comment
                await Comments.deleteOne({ _id: commentId }).session(session);

                // Decrement comment count on post
                await post.updateOne({
                    $inc: { commentsCount: -1 }
                }).session(session);

                let suspensionApplied = false;
                let newSuspensionIsShorter = false;
                if(suspension){
                    const shouldSuspend = CanUserSuspendUser({
                        suspenderRole: user.role,
                        suspendeeRole: commentAuthorRole,
                        content: {
                            wasAnonymous: comment.anonymous
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
                    }else if(!commentAuthor){
                        result = {
                            success: false,
                            error: "user_not_found"
                        }
                        throw new Error("user_not_found");
                    }else if(shouldSuspend.actionToTake === "suspend"){
                        const isNewSuspensionLonger = UserManager.IsNewSuspensionDurationLonger(commentAuthor, suspension.duration);
                        if(isNewSuspensionLonger){
                            suspensionApplied = true;
                            await UserManager.SuspendUser(
                                commentAuthor,
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

                if(!deletorIsAuthor){
                    // Comment deleted by someone other than the author, add moderation log
                    await UserManager.AddModerationLogToUser({
                        type: "content_deletion",
                        contentType: "comment",
                        content: comment.content,
                        session: session,
                        targetUserId: comment.authorUserId ? comment.authorUserId.toString() : undefined,
                        moderatorUserId: deletorUserId,
                        suspensionApplied: suspensionApplied,
                        attemptedToApplySuspension: suspension ? true : false,
                    })
                }

                result = {
                    success: true,
                    suspensionApplied: suspensionApplied ? "applied" : (newSuspensionIsShorter ? "not_applied_new_is_shorter" : undefined)
                }
            })
        }catch(err){
            
        }finally{
            session.endSession();
        }

        return result as returnType;
    }

    static async GetCommentsForPost(
        postId: string
    ){
        await connectDB();

        const comments = await Comments.find({ postId }).sort({ createdAt: 1 }).lean();

        return comments as IComment[];
    }

    static async GetCommentById(
        commentId: string
    ){
        await connectDB();

        const comment = await Comments.findById(commentId).lean();

        return comment as IComment | null;
    }

    /**
     * Gets all comments created after a specific timestamp, sorted by most recent first
     */
    static async GetCommentsAfterTimestamp(timestamp: number): Promise<IComment[]>{
        await connectDB();

        const comments = await Comments.find({
            createdAt: {
                $gte: timestamp
            }
        }).sort({ createdAt: -1 }).lean();

        return comments as IComment[];
    }

    static async GetLastAuthorSuspension(
        commentId: string
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
            error: "comment_not_found" | "user_not_found" | "unknown_error" | "author_id_expunged";
        }

        let result: returnType = {
            success: false,
            error: "unknown_error"
        }

        const session = await mongoose.startSession();

        try{
            await session.withTransaction(async () => {
                const comment = await Comments.findById(commentId).session(session);
                if(!comment){
                    result = {
                        success: false,
                        error: "comment_not_found"
                    }
                    throw new Error("comment_not_found");
                }

                if(!comment.authorUserId){
                    result = {
                        success: false,
                        error: "author_id_expunged"
                    }
                    throw new Error("author_id_expunged");
                }
                
                const commentAuthor = await Users.findById(comment.authorUserId).session(session);
                if(!commentAuthor){
                    result = {
                        success: false,
                        error: "user_not_found"
                    }
                    throw new Error("user_not_found");
                }

                const lastSuspension = await UserManager.GetLastUserSuspension(commentAuthor, session);
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

    static async GetNumOfAnonCommentsWithPresentAuthorIdBeforeTimestamp(cutoffTimestamp: number){
        await connectDB();

        const result = await Comments.aggregate([
            {$match: { "authorUserId": { $ne: null }, "anonymous": true, "createdAt": { $lt: cutoffTimestamp } }},
            {$count: "total"}
        ])

        return result.length > 0 ? result[0].total : 0;
    }

    static async DeleteAnonCommentsWithPresentAuthorIdBeforeTimestamp(cutoffTimestamp: number){
        await connectDB();

        const result = await Comments.updateMany(
            {
                createdAt: {$lt: cutoffTimestamp},
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