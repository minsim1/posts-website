import mongoose from "mongoose";
import { CONFIG } from "../../../public-config";
import { Sessions, type ISession } from "../db/models/session";
import { HashStringSHA256 } from "../helpers/hashing";
import { GetRandomSessionId } from "../helpers/random";

export class SessionManager{
    static async IssueSessionForUser(userId: string): Promise<string>{
        const mongoSession = await mongoose.startSession();
        let issuedSessionId = '';
        try{
            await mongoSession.withTransaction(async () => {
                issuedSessionId = await this.issueSessionForUser(userId, mongoSession);
            });
        }catch(e){
            throw e; // lol
        }finally{
            mongoSession.endSession();
        }

        return issuedSessionId;
    }
    /**
     * Returns a new session token for the user and saves it in the database
     */
    private static async issueSessionForUser(userId: string, mongoSession: mongoose.ClientSession): Promise<string>{
        const numOfTries = 5;
        let issuedSessionId = '';

        for(let i = 0; i < numOfTries; i++){
            const randomSessionId = GetRandomSessionId();
            const hashedSessionId = HashStringSHA256(randomSessionId);
            const doesExist = await this.doesSessionExist(hashedSessionId, mongoSession);
            if(doesExist) continue; // try again
            
            issuedSessionId = randomSessionId;
            await this.createSession(hashedSessionId, userId, mongoSession);
            break;
        }

        if(!issuedSessionId) throw new Error('Could not issue session ID after multiple attempts');
        return issuedSessionId;
    }

    private static async deleteSessionByUserId(userId: string, mongoSession: mongoose.ClientSession): Promise<void>{
        await Sessions.deleteMany({ userId }).session(mongoSession).exec();
    }

    private static async createSession(hashedSessionId: string, userId: string, mongoSession: mongoose.ClientSession): Promise<void>{
        const expiresAtTime = CONFIG.sessions.maxInstanceLifetime + Date.now();
        await Sessions.create([{
            hashedToken: hashedSessionId,
            userId,
            expiresAtTimestamp: new Date(expiresAtTime)
        }], {session: mongoSession});
    }

    private static async doesSessionExist(hashedSessionId: string, mongoSession?: mongoose.ClientSession): Promise<boolean>{
        const session = await Sessions.findOne({ hashedToken: hashedSessionId }).session(mongoSession ?? null).exec();
        return session !== null;
    }

    /**
     * Returns a new session token, deletes the old one
     */
    static async RefreshSession(sessionId: string){
        interface returnType{
            newSessionId: string;
            userId: string;
        }

        return new Promise<returnType>(async (resolve, reject) => {
            const mongoSession = await mongoose.startSession();
            try{
                await mongoSession.withTransaction(async () => {
                    // Does current session exist and is valid?
                    const hashedSessionId = HashStringSHA256(sessionId);
                    const existingSession = await Sessions.findOne({ hashedToken: hashedSessionId }).session(mongoSession).exec() as ISession;
                    if(!existingSession) throw new Error('session_not_found');
                    if(existingSession.expiresAtTimestamp.getTime() < Date.now()) throw new Error('session_expired');
    
                    // Delete old session
                    await Sessions.deleteOne({ hashedToken: hashedSessionId }).session(mongoSession).exec();
    
                    // Issue new session
                    const newSessionId = await this.issueSessionForUser(existingSession.userId.toString(), mongoSession);

                    resolve({ newSessionId, userId: existingSession.userId.toString() });
                })
            }catch(e){
                return reject(e);
            }finally{
                mongoSession.endSession();
            }
        })
    }

    static async DeleteSession(sessionId: string): Promise<void>{
        const hashedSessionId = HashStringSHA256(sessionId);
        await Sessions.deleteOne({ hashedToken: hashedSessionId }).exec();
    }

    static async DeleteAllSessionsByUserId(userId: string): Promise<void>{
        await Sessions.deleteMany({ userId }).exec();
    }
}