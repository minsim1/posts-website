import { ErrorCode, type AllErrorCodes } from "$lib/api/types";

export const LT_errorStrings: Record<AllErrorCodes, string> = {
    [ErrorCode.Auth.INVALID_CREDENTIALS]: "Neteisingas vartotojo vardas arba slaptažodis.",
    [ErrorCode.Auth.USERNAME_TAKEN]: "Vartotojo vardas jau užimtas.",
    [ErrorCode.Auth.USERNAME_INVALID]: "Vartotojo vardas yra neteisingas.",
    [ErrorCode.Auth.USERNAME_UNAVAILABLE]: "Vartotojo vardas yra nepasiekiamas.",
    [ErrorCode.Auth.OTC_INVALID]: "Vienkartinis kodas yra neteisingas.",
    [ErrorCode.Auth.PASSWORD_INVALID]: "Slaptažodis neatitinka reikalavimų.",

    [ErrorCode.User.USER_NOT_FOUND]: "Vartotojas nerastas.",
    [ErrorCode.User.NOT_ALLOWED_TO_CHANGE_USERNAME]: "Jums neleidžiama keisti savo vartotojo vardo.",
    [ErrorCode.User.USERNAME_TAKEN]: "Vartotojo vardas jau užimtas.",
    [ErrorCode.User.SUSPENDED]: "Vartotojo paskyra yra sustabdyta.",
    [ErrorCode.User.USERNAME_CHANGE_TOO_SOON]: "Negalite taip greitai keisti savo vartotojo vardo po paskutinio pakeitimo.",

    [ErrorCode.Posts.POST_NOT_FOUND]: "Įrašas nerastas.",
    [ErrorCode.Posts.CONTENT_INVALID]: "Turinys yra neteisingas.",
    [ErrorCode.Posts.QUERY_DATE_RANGE_TOO_LARGE]: "Užklausos datos intervalas yra per didelis.",
    [ErrorCode.Posts.NON_OWNER_CAN_NOT_DELETE]: "Jūs nesate šio įrašo savininkas ir negalite jo ištrinti.",
    [ErrorCode.Posts.POST_TOO_OLD_TO_DELETE]: "Šis įrašas yra per senas, kad būtų ištrintas.",
    [ErrorCode.Posts.POSTING_VIOLATES_LIMIT_RULES]: "Įrašymas pažeidžia nustatytas ribojimo taisykles.",
    [ErrorCode.Posts.POST_TOO_LONG]: "Įrašas viršija leistiną maksimalų ilgį.",

    [ErrorCode.Moderation.UNAUTHORIZED_SUSPENSION]: "Jūs nesate įgaliotas sustabdyti šio vartotojo.",
}