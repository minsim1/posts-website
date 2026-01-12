import { Votes, type IVote } from "$lib/server/db/models/vote";
import mongoose from "mongoose";
import { connectDB } from "../db/database";
import { configManager } from "./config-manager";
import { Users, type IUser } from "../db/models/user";
import { CanUserDoInteraction } from "$lib/helpers/rules";
import { Posts, type IPost } from "../db/models/post";
import UserManager from "./user-manager";

export default class VoteManager{
    static async GetUserVotesForPosts(
        userId: string,
        postIds: string[]
    ){
        interface userVoteInfo{
            postId: string;
            voteType: "upvote" | "downvote";
        }

        const res = await Votes.find({
            userId: userId,
            postId: { $in: postIds }
        }) as IVote[];

        return res.map(voteDoc => {
            return {
                postId: voteDoc.postId.toString(),
                voteType: voteDoc.voteType
            } as userVoteInfo;
        });
    }

    static async SetUserVote(
        userId: string,
        postId: string,
        voteType: "upvote" | "downvote" | "remove_vote"
    ){
        await connectDB();
        const session = await mongoose.startSession();

        type returnType = {
            success: true;
            newVoteType: "upvote" | "downvote" | null;
            newScore: number;
        } | {
            success: false;
            error: 'post_not_found' | 'unknown_error' | 'action_violates_limit_rules' | "user_not_found" | "user_suspended";
        }

        let result: returnType = {
            success: false,
            error: 'unknown_error'
        };

        try{
            await session.withTransaction(async () => {
                const config = await configManager.GetConfig();

                const user = await Users.findById(userId).session(session) as IUser;
                if(!user){
                    result = {
                        success: false,
                        error: 'user_not_found'
                    };
                    throw new Error('User not found');
                }

                const suspensionStatus = await UserManager.IsUserSuspended(userId, user, session);
                if(suspensionStatus.suspended == true){
                    result = {
                        success: false,
                        error: 'user_suspended'
                    };
                    throw new Error('User is suspended');
                }

                const post = await Posts.findById(postId).session(session) as IPost;
                if(!post){
                    result = {
                        success: false,
                        error: 'post_not_found'
                    };
                    throw new Error('Post not found');
                }

                const actionCheck = CanUserDoInteraction(
                    'vote',
                    user.latestInteractions,
                    config.userInteractionLimits
                )

                if(!actionCheck.canDoInteraction && user.role !== 'admin'){
                    result = {
                        success: false,
                        error: 'action_violates_limit_rules'
                    };
                    return;
                }

                if(voteType === "remove_vote"){
                    const existingVote = await Votes.findOne({
                        userId: userId,
                        postId: postId
                    }).session(session) as IVote;
                    
                    if(!existingVote){
                        // If no existing vote, nothing to remove
                        result = {
                            success: true,
                            newVoteType: null,
                            newScore: post.upvotesCount - post.downvotesCount
                        }
                    }

                    // Update post
                    await post.updateOne({
                        $inc: {
                            upvotesCount: existingVote.voteType === "upvote" ? -1 : 0,
                            downvotesCount: existingVote.voteType === "downvote" ? -1 : 0
                        }
                    }).session(session);

                    // Delete vote
                    await existingVote.deleteOne().session(session);
                }else{
                    // Cast a vote
                    const existingVote = await Votes.findOne({
                        userId: userId,
                        postId: postId
                    }).session(session) as IVote;

                    if(existingVote){
                        // if existing vote matches, do nothing
                        if(existingVote.voteType === voteType){
                            result = {
                                success: true,
                                newVoteType: existingVote.voteType,
                                newScore: post.upvotesCount - post.downvotesCount
                            }
                            return;
                        }

                        // Existing vote is opposite, switch
                        existingVote.voteType = voteType;
                        await existingVote.save({ session });

                        // Update post (switch vote)
                        await post.updateOne({
                            $inc: {
                                upvotesCount: voteType === "upvote" ? 1 : -1,
                                downvotesCount: voteType === "downvote" ? 1 : -1
                            }
                        }).session(session);
                    }else{
                        // Create new vote
                        const newVote = await Votes.create([{
                            userId: userId,
                            postId: postId,
                            voteType: voteType
                        }], { session });

                        // Update post (new vote)
                        await post.updateOne({
                            $inc: {
                                upvotesCount: voteType === "upvote" ? 1 : 0,
                                downvotesCount: voteType === "downvote" ? 1 : 0
                            }
                        }).session(session);
                    }
                }

                // Update user interactions
                await UserManager.AddInteractionToUser(
                    user,
                    'vote',
                    session
                )

                // Refresh post data to get latest vote counts
                const updatedPost = await Posts.findById(postId).session(session) as IPost;
                if(!updatedPost){
                    result = {
                        success: false,
                        error: 'post_not_found'
                    };
                    throw new Error('Post not found after update');
                }
                
                result = {
                    success: true,
                    newVoteType: voteType === "remove_vote" ? null : voteType,
                    newScore: updatedPost.upvotesCount - updatedPost.downvotesCount
                }
            })
        }catch(error){
            //
        }finally{
            session.endSession();
        }

        return result as returnType;
    }
}