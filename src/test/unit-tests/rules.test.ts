import { CanUserDoInteraction } from "$lib/helpers/rules";
import type { UserInteraction, UserInteractionLimit, UserInteractionType } from "$lib/server/db/types";

function ConstructUserInteraction(type: UserInteractionType, howLongAgo: number): UserInteraction{
    const timestamp = Date.now() - howLongAgo;
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
        expect(canDoInteraction.canDoInteraction == false ? canDoInteraction.timestampWhenCanPost : 0).toBeGreaterThan(Date.now());
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
        expect(canDoInteraction.canDoInteraction == false ? canDoInteraction.timestampWhenCanPost : 0).toBeGreaterThan(Date.now());
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
})