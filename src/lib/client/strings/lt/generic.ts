import type { GenericStrings } from "../types";

export const LT_genericStrings: GenericStrings = {
    unknownError: "Įvyko nežinoma klaida.",
    login:{
        suspension:{
            main: "Jūsų paskyra buvo sustabdyta",
            reasonPrefix: "Priežastis: ",
            suspendedUntilPrefix: "Sustabdyta iki: ",
            permanentSuspension: "Sustabdymas yra nuolatinis",
        }
    },
    auth:{
        username: "Vartotojo vardas",
        password: "Slaptažodis",
    },
    posts:{
        create:{
            placeholderSlogans: [
                "Pasidalink savo nefiltruotomis mintimis...",
                "Rašyk ką nors įdomaus...",
                "Pasakyk ką nors naujo..."
            ]
        }
    },
    comments:{
        create:{
            placeholder: "Parašyk savo komentarą čia..."
        }
    }
}