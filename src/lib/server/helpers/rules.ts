import type { UserRole } from "../db/types";

interface ShouldDeleteContentParams{
    authorRole: UserRole | "anonymous";
    deletorRole: UserRole;
    deletorIsAuthor: boolean;
    contentCreationTimestamp: number;
    maxDeletableContentAge: number;
}

type ShouldDeleteContentResult = {
    shouldDelete: true
} | {
    shouldDelete: false;
    reason: "insufficient_permissions" | "not_owner" | "too_old_to_delete"
}

/**
 * Given the state of the content and deletor, determine if the content should be deleted and if not - why.
 * Works for posts and comments.
 */
export function ShouldDeleteContent(params: ShouldDeleteContentParams): ShouldDeleteContentResult{
    // Any old post can not be deleted by anyone
    // This can be circumvented if the admin temporarily changes maxDeletableContentAge to a high value
    if(params.contentCreationTimestamp + params.maxDeletableContentAge < Date.now()){
        return {
            shouldDelete: false,
            reason: "too_old_to_delete"
        }
    }

    // Users can only delete their own content
    if(params.deletorRole === "user") {
        if(params.deletorIsAuthor){
            return {
                shouldDelete: true
            }
        }else{
            return {
                shouldDelete: false,
                reason: "not_owner"
            }
        }
    }

    // * Only admins and moderators past here

    // Any admin or moderator can delete any anonymous content
    if(params.authorRole === "anonymous"){
        return {
            shouldDelete: true
        };
    }

    // moderators cannot delete admin content
    if(params.authorRole === "admin" && params.deletorRole === "moderator"){
        return {
            shouldDelete: false,
            reason: "insufficient_permissions"
        }
    }

    // Moderators can delete moderator and user content
    // Admins can delete any content
    return {
        shouldDelete: true
    };
}

interface ShouldSuspendUserParams{
    suspendeeRole: UserRole;
    suspenderRole: UserRole;
    content?:{
        wasAnonymous: boolean;
    }
}

type ShouldSuspendUserResult = {
    actionToTake: "suspend"
} | {
    actionToTake: "silently_ignore"
} | {
    actionToTake: "disallow"
}

/**
 * Determines if a user can suspend another user, or if the action should be silently ignored.
 * Works for posts, comments and regular suspensions without any special conditions (like content).
 */
export function CanUserSuspendUser(params: ShouldSuspendUserParams): ShouldSuspendUserResult{
    // Users can not suspend anyone
    if(params.suspenderRole === "user"){
        return {
            actionToTake: "disallow"
        }
    }

    const roleHierarchy: Record<UserRole, number> = {
        "user": 1,
        "moderator": 2,
        "admin": 3
    };

    if(params.content == undefined){
        // There is no content, user just wants to suspend another user
        // Do not allow the same role to suspend each other

        return {
            actionToTake: roleHierarchy[params.suspenderRole] > roleHierarchy[params.suspendeeRole]
                ? "suspend"
                : "disallow"
        }
    }

    // There was content involved in the suspension

    if(params.content.wasAnonymous){
        // The content was anonymous
        if(params.suspendeeRole === "admin"){
            // Noone can actually suspend an admin, but throwing an error would reveal the post creators role
            return {
                actionToTake: "silently_ignore"
            }
        }

        if(params.suspendeeRole === "moderator" && params.suspenderRole === "moderator"){
            // Moderators cannot suspend other moderators for anonymous content, but throwing an error would reveal the post creators role
            return {
                actionToTake: "silently_ignore"
            }
        }

        // Possible left suspensions (suspendor -> suspendee):
        // 1. moderator -> user
        // 2. admin -> user
        // 3. admin -> moderator

        return {
            actionToTake: "suspend"
        }
    }else{
        // The content was not anonymous, follow normal rules
        return {
            actionToTake: roleHierarchy[params.suspenderRole] > roleHierarchy[params.suspendeeRole]
                ? "suspend"
                : "disallow"
        }      
    }
}