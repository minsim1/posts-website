import { CanUserDoInteraction } from "$lib/helpers/rules";
import type { UserInteraction, UserInteractionLimit, UserInteractionType } from "$lib/server/db/types";

const START_TIME = Date.now();

function ConstructUserInteraction(type: UserInteractionType, howLongAgo: number): UserInteraction{
    const timestamp = START_TIME - howLongAgo;
    return {
        interactionType: type,
        timestamp
    }
}

function ConstructLimit(interactionTypes: UserInteractionType[], maxInteractions: number, timeframe: number): UserInteractionLimit{
    return {
        interactionTypes,
        maxInteractions,
        timeframe,
        limitId: 'test-limit'
    }
}

describe("User interaction tests", () =>{
    it('User can not make interaction when exceeding limit (1)', () => {
        const userInteractions: UserInteraction[] = [
            ConstructUserInteraction('post', 1000 * 60 * 30), // 30 minutes ago
            ConstructUserInteraction('post', 1000 * 60 * 90), // 90 minutes ago
        ]

        const interactionLimits: UserInteractionLimit[] = [
            ConstructLimit(['post'], 1, 1000 * 60 * 60) // 1 post per hour
        ]

        const canDoInteraction = CanUserDoInteraction('post', userInteractions, interactionLimits);
        expect(canDoInteraction.canDoInteraction).toBe(false);
        expect(canDoInteraction.canDoInteraction == false ? canDoInteraction.timestampWhenCanPost : 0).toBe(START_TIME + (1000 * 60 * 30));
    })

    it('User can not make interaction when exceeding limit (2)', () => {
        const userInteractions: UserInteraction[] = [
            ConstructUserInteraction('post', 1000 * 60 * 30), // 30 minutes ago
            ConstructUserInteraction('post', 1000 * 60 * 40), // 40 minutes ago
        ]

        const interactionLimits: UserInteractionLimit[] = [
            ConstructLimit(['post'], 2, 1000 * 60 * 60) // 2 posts per hour
        ]

        const canDoInteraction = CanUserDoInteraction('post', userInteractions, interactionLimits);
        expect(canDoInteraction.canDoInteraction).toBe(false);
        expect(canDoInteraction.canDoInteraction == false ? canDoInteraction.timestampWhenCanPost : 0).toBe(START_TIME + (1000 * 60 * 20));
    })

    it('User can make interaction when not exceeding limit (1)', () => {
        const userInteractions: UserInteraction[] = [
            ConstructUserInteraction('post', 1000 * 60 * 30), // 30 minutes ago
            ConstructUserInteraction('post', 1000 * 60 * 90), // 90 minutes ago
        ]

        const interactionLimits: UserInteractionLimit[] = [
            ConstructLimit(['post'], 2, 1000 * 60 * 60) // 2 posts per hour
        ]

        const canDoInteraction = CanUserDoInteraction('post', userInteractions, interactionLimits);
        expect(canDoInteraction.canDoInteraction).toBe(true);
    })

    it('User can make interaction when he has not made that interaction yet', () => {
        const userInteractions: UserInteraction[] = [
            ConstructUserInteraction('post', 1000 * 60 * 30), // 30 minutes ago
            ConstructUserInteraction('post', 1000 * 60 * 40), // 40 minutes ago
        ]

        const interactionLimits: UserInteractionLimit[] = [
            ConstructLimit(['comment'], 2, 1000 * 60 * 60) // 2 comments per hour
        ]

        const canDoInteraction = CanUserDoInteraction('post', userInteractions, interactionLimits);
        expect(canDoInteraction.canDoInteraction).toBe(true);
    })

    it('Longer limit should apply', () => {
        const userInteractions: UserInteraction[] = [
            ConstructUserInteraction('post', 1000 * 60 * 10), // 10 minutes ago
            ConstructUserInteraction('post', 1000 * 60 * 40), // 40 minutes ago
        ]

        const interactionLimits: UserInteractionLimit[] = [
            ConstructLimit(['post'], 2, 1000 * 60 * 60), // 2 posts per hour
            ConstructLimit(['post'], 1, 1000 * 60 * 40) // 1 posts per 40 minutes
        ]

        // As per the first rule, the user can post again in 20 minutes
        // As per the second rule, the user can post again in 30 minutes
        // Therefore, the longer limit (30 minutes) should apply

        const canDoInteraction = CanUserDoInteraction('post', userInteractions, interactionLimits);
        expect(canDoInteraction.canDoInteraction).toBe(false);
        expect(canDoInteraction.canDoInteraction == false ? canDoInteraction.timestampWhenCanPost : 0).toBe(START_TIME + (1000 * 60 * 30)); // Longer limit applies
    })
})