import type { UserInteraction, UserInteractionType } from "$lib/server/db/types";

interface UserInteractionLimit{
    interactionTypes: UserInteractionType[];
    maxInteractions: number;
    timeframe: number; // in milliseconds
}

export function CanUserDoInteraction(interactionType: UserInteractionType, latestInteractions: UserInteraction[], interactionLimits: UserInteractionLimit[]) : {
    canDoInteraction: true,   
} | {
    canDoInteraction: false;
    timestampWhenCanPost: number;
}{
    const currentTimestamp = Date.now();

    const relevantInteractions = latestInteractions.filter(interaction=>{
        if(interaction.interactionType !== interactionType) return false;
        return true;
    })

    const relevantLimits = interactionLimits.filter(limit=>{
        if(!limit.interactionTypes.includes(interactionType)) return false;
        return true;
    })
    
    const timestampsWhenCanDoInteraction: number[] = [];
    for(const limit of relevantLimits){
        const lastRelevantTimestamp = currentTimestamp - limit.timeframe;

        const relevantInteractionsForLimit = relevantInteractions.filter(interaction=>{
            return interaction.timestamp >= lastRelevantTimestamp;
        })

        if(relevantInteractionsForLimit.length < limit.maxInteractions) {
            continue; // Can do interaction under this limit
        }

        // Sort oldest first
        relevantInteractionsForLimit.sort((a,b)=>a.timestamp - b.timestamp);

        // Find when the user can do the interaction again
        const oldestInteractionTimestamp = relevantInteractionsForLimit[0].timestamp;
        const nextPossibleInteractionTime = oldestInteractionTimestamp + limit.timeframe;
        timestampsWhenCanDoInteraction.push(nextPossibleInteractionTime);
    }

    if(timestampsWhenCanDoInteraction.length <= 0) {
        return {
            canDoInteraction: true
        }
    }else{
        return {
            canDoInteraction: false,
            timestampWhenCanPost: timestampsWhenCanDoInteraction.sort().reverse()[0]
        }
    }
}