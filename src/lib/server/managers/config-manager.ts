import { connectDB } from "../db/database";
import { Config, type IConfig } from "../db/models/config";
import type { UserInteractionType } from "../db/types";

export default class ConfigManager{
    private cachedConfig: IConfig | null = null;
    private lastFetchTimestamp: number | null = null;

    constructor(
        private maxCacheAgeMs: number = 1000 * 60 * 60 * 3 // 3 hours
    ){}

    private async updateCache() {
        await connectDB();

        const config = await Config.findOne({});
        if (!config) {
            throw new Error('Configuration not found in database.');
        }

        this.cachedConfig = config;
        this.lastFetchTimestamp = Date.now();
    }

    async GetConfig(ignoreCache: boolean = false): Promise<IConfig> {
        const now = Date.now();

        if(ignoreCache) this.lastFetchTimestamp = null;

        if (
            this.cachedConfig && 
            this.lastFetchTimestamp && 
            (now - this.lastFetchTimestamp) < this.maxCacheAgeMs
        ) {
            return this.cachedConfig;
        }

        await this.updateCache();
        return this.cachedConfig as IConfig;
    }

    async AddUserInteractionLimit(
        timeframe: number,
        maxInteractions: number,
        interactionTypes: UserInteractionType[]
    ){
        await Config.updateOne({},
            {
                $push: {
                    userInteractionLimits: {
                        limitId: crypto.randomUUID(),
                        timeframe,
                        maxInteractions,
                        interactionTypes
                    }
                }
            }
        ).exec();

        // Invalidate cache
        this.cachedConfig = null;
        this.lastFetchTimestamp = null;
        await this.updateCache();
    }

    async RemoveUserInteractionLimit(limitId: string){
        await Config.updateOne({},
            {
                $pull: {
                    userInteractionLimits: {
                        limitId
                    }
                }
            }
        ).exec();
        
        // Invalidate cache
        this.cachedConfig = null;
        this.lastFetchTimestamp = null;
        await this.updateCache();
    }

    async UpdateUserInteractionLimit(
        limitId: string,
        timeframe: number,
        maxInteractions: number,
        interactionTypes: UserInteractionType[]
    ){
        await Config.updateOne(
            { "userInteractionLimits.limitId": limitId },
            {
                $set: {
                    "userInteractionLimits.$.timeframe": timeframe,
                    "userInteractionLimits.$.maxInteractions": maxInteractions,
                    "userInteractionLimits.$.interactionTypes": interactionTypes
                }
            }
        ).exec();

        // Invalidate cache
        this.cachedConfig = null;
        this.lastFetchTimestamp = null;
        await this.updateCache();
    }

    async AddPostingRule(rule: string){
        await Config.updateOne({},
            {
                $push: {
                    postingRules: rule
                }
            }
        ).exec();

        // Invalidate cache
        this.cachedConfig = null;
        this.lastFetchTimestamp = null;
        await this.updateCache();
    }

    async RemovePostingRule(rule: string){
        await Config.updateOne({},
            {
                $pull: {
                    postingRules: rule
                }
            }
        ).exec();

        // Invalidate cache
        this.cachedConfig = null;
        this.lastFetchTimestamp = null;
        await this.updateCache();
    }

    async AddPostsDiscordWebhookUrl(url: string){
        await Config.updateOne({},
            {
                $push: {
                    postsDiscordWebhookUrls: url
                }
            }
        ).exec();

        // Invalidate cache
        this.cachedConfig = null;
        this.lastFetchTimestamp = null;
        await this.updateCache();
    }

    async RemovePostsDiscordWebhookUrl(url: string){
        await Config.updateOne({},
            {
                $pull: {
                    postsDiscordWebhookUrls: url
                }
            }
        ).exec();

        // Invalidate cache
        this.cachedConfig = null;
        this.lastFetchTimestamp = null;
        await this.updateCache();
    }

    async AddDisallowedUsernamePattern(pattern: string){
        await Config.updateOne({},
            {
                $push: {
                    disallowedUsernamePatterns: pattern
                }
            }
        ).exec();

        // Invalidate cache
        this.cachedConfig = null;
        this.lastFetchTimestamp = null;
        await this.updateCache();
    }
    
    async RemoveDisallowedUsernamePattern(pattern: string){
        await Config.updateOne({},
            {
                $pull: {
                    disallowedUsernamePatterns: pattern
                }
            }
        ).exec();

        // Invalidate cache
        this.cachedConfig = null;
        this.lastFetchTimestamp = null;
        await this.updateCache();
    }

    async SetMaxInteractionAgeToSave(age: number){
        await Config.updateOne({},
            {
                $set: {
                    "limits.maxInteractionAgeToSave": age
                }
            }
        )

        // Invalidate cache
        this.cachedConfig = null;
        this.lastFetchTimestamp = null;
        await this.updateCache();
    }

    async SetMaxInteractionsToSave(num: number){
        await Config.updateOne({},
            {
                $set: {
                    "limits.maxInteractionsToSave": num
                }
            }
        )

        // Invalidate cache
        this.cachedConfig = null;
        this.lastFetchTimestamp = null;
        await this.updateCache();
    }

    async SetMaxPostLength(length: number){
        await Config.updateOne({},
            {
                $set: {
                    "limits.maxPostLength": length
                }
            }
        )

        // Invalidate cache
        this.cachedConfig = null;
        this.lastFetchTimestamp = null;
        await this.updateCache();
    }

    async SetMaxCommentLength(length: number){
        await Config.updateOne({},
            {
                $set: {
                    "limits.maxCommentLength": length
                }
            }
        )

        // Invalidate cache
        this.cachedConfig = null;
        this.lastFetchTimestamp = null;
        await this.updateCache();
    }

    async SetMaxJwtAge(age: number){
        await Config.updateOne({},
            {
                $set: {
                    "limits.maxJwtAge": age
                }
            }
        )

        // Invalidate cache
        this.cachedConfig = null;
        this.lastFetchTimestamp = null;
        await this.updateCache();
    }

    async SetMaxPostAgeToAllowDelete(age: number){
        await Config.updateOne({},
            {
                $set: {
                    "limits.maxPostAgeToAllowDelete": age
                }
            }
        )
        // Invalidate cache
        this.cachedConfig = null;
        this.lastFetchTimestamp = null;
        await this.updateCache();
    }
    
    async SetMaxCommentAgeToAllowDelete(age: number){
        await Config.updateOne({},
            {
                $set: {
                    "limits.maxCommentAgeToAllowDelete": age
                }
            }
        )
        // Invalidate cache
        this.cachedConfig = null;
        this.lastFetchTimestamp = null;
        await this.updateCache();
    }

    async SetMaxPostAgeToComment(age: number){
        await Config.updateOne({},
            {
                $set: {
                    "limits.maxPostAgeToComment": age
                }
            }
        )
        // Invalidate cache
        this.cachedConfig = null;
        this.lastFetchTimestamp = null;
        await this.updateCache();
    }

    async SetMinWaitToChangeUsername(duration: number){
        await Config.updateOne({},
            {
                $set: {
                    "limits.minWaitToChangeUsername": duration
                }
            }
        )
        // Invalidate cache
        this.cachedConfig = null;
        this.lastFetchTimestamp = null;
        await this.updateCache();
    }

    async SetMaxModerationLogAgeToSave(duration: number){
        await Config.updateOne({},
            {
                $set: {
                    "limits.maxModerationLogAgeToSave": duration
                }
            }
        )
        // Invalidate cache
        this.cachedConfig = null;
        this.lastFetchTimestamp = null;
        await this.updateCache();
    }
}   

export const configManager = new ConfigManager(

)