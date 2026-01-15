/**
 * This is accessible both to the client and the server, so not sensitive information must not be stored here.
 * It contains configuration values that are safe to be known by the client.
 * However, this config should not have values that change between development and production environments.
 */
export const CONFIG = {
    username:{
        minLength: 3,
        maxLength: 30
    },
    password:{
        minLength: 8,
        maxLength: 100
    },
    posts:{
        query:{
            maxDateRange: 1000 * 60 * 60 * 24 * 7, // 7 days
            timeframeToQuery: 1000 * 60 * 60 * 24 * 3 // 3 days
        }
    },
    comments:{
        initialCountToShow: 2,
        showMoreIncrement: 5,
    },
    moderation:{
        maxModContentQueryRange: 1000 * 60 * 60 * 24 * 7, // 7 days
        defaultContentFetchRange: 1000 * 60 * 60 * 24 * 4 // 4 days
    },
    notifications:{
        maxDisplayCount: 5
    },
    userColors:{
        // Make sure they match colors.css
        admin: '#427fc4',
        moderator: '#299b3c',
        general: '#555555'
    },
    instagram:{
        images:{
            bestForLastImageText: "And now, the best posts for last...",
            bestPostTopText: "Top Rated Posts",
            carouselCaptionText: "You can find the link to the website in the bio if you want to post yourself!",
        }
    },
    jwt:{
        /**
         * Specifies the maximum lifetime that can be configured for a JWT (by an administrator).
         */
        maxConfigurableLifetime: 1000 * 60 * 60 * 24, // 24 hours
        /**
         * Specifies the minimum lifetime that can be configured for a JWT (by an administrator).
         * Keep this above at least 1 minute to prevent issues with very short-lived JWTs.
         */
        minConfigurableLifetime: 1000 * 60 * 1, // 1 minute
        heartbeat:{
            /**
             * How often the client checks if a JWT refresh is needed.
             */
            interval: 1000 * 60 * 1, // 1 minute
            /**
             * If the JWT is set to expire in less than this time, the client will request a refresh.
             */
            refreshIfTimeLeftLessThan: 1000 * 60 * 2 // 2 minutes
        }
    },
    sessions:{
        /**
         * Since sessions can be refreshed, they can last indefinitely.
         * This value only marks the maximum time a session can last before the user must re-authenticate,
         * assuming he does not refresh it.
         * Refresing a session issues a new session with a new max lifetime.
         */
        maxInstanceLifetime: 1000 * 60 * 60 * 24 * 30 // 30 days
    }
}