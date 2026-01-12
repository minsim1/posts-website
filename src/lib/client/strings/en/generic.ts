import type { GenericStrings } from "../types";

export const EN_genericStrings: GenericStrings = {
    unknownError: "An unknown error has occurred.",
    login:{
        suspension:{
            main: "Your account has been suspended",
            reasonPrefix: "Reason: ",
            suspendedUntilPrefix: "Suspended until: ",
            permanentSuspension: "The suspension is permanent",
        }
    },
    auth:{
        username: "Username",
        password: "Password",
    },
    posts:{
        create:{
            placeholderSlogans: [
                "Share your unfiltered thoughts...",
                "What are you thinking today?",
                "Write something interesting...",
                "Say something new...",
                "Write something stupid..."
            ]
        }
    },
    comments:{
        create:{
            placeholder: "Write your comment here..."
        }
    }
}