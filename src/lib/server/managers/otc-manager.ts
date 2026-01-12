import { connectDB } from "../db/database";
import { OTCs } from "../db/models/otc";
import { Users } from "../db/models/user";
import crypto from "crypto";
import type { UserRole } from "../db/types";
import UserManager from "./user-manager";

export default class OTCManager{
    /**
     * Generate a random OTC code
     */
    private static generateCode(): string {
        return crypto.randomBytes(16).toString('hex');
    }

    static async CreateOTC(ownerUserId: string, expiresInMs: number, count: number = 1) {
        type returnType = {
            success: true;
        } | {
            success: false;
            error: "user_not_found" | "unknown_error";
        }

        let result: returnType = {
            success: false,
            error: "unknown_error"
        }

        await connectDB();
        
        const expiresAtTimestamp = new Date(Date.now() + expiresInMs);
        const maxAttempts = 5;

        const user = await UserManager.GetUserById(ownerUserId);
        if(!user) {
            result = {
                success: false,
                error: "user_not_found"
            }
            return result;
        }
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                // Generate all codes at once
                const otcDocs = Array.from({ length: count }, () => ({
                    code: this.generateCode(),
                    ownerUserId,
                    expiresAtTimestamp
                }));

                // Bulk insert
                const otcs = await OTCs.insertMany(otcDocs, { ordered: false });
                result = {
                    success: true
                }
                return result;
            } catch (error: any) {
                // If duplicate key error and not last attempt, retry entire batch
                if (error.code === 11000 && attempt < maxAttempts - 1) {
                    continue;
                }
                throw error;
            }
        }

        throw new Error('Failed to create OTCs after maximum attempts');
    }

    static async CreateOTCForRoles(
        roles: UserRole[],
        expiresInMs: number,
        count: number = 1
    ) {
        await connectDB();

        // Remove duplicates from roles array
        const uniqueRoles = [...new Set(roles)];

        // Get all users with specified roles
        const users = await Users.find({ role: { $in: uniqueRoles } }).select('_id').lean();

        if (users.length === 0) return;

        const expiresAtTimestamp = new Date(Date.now() + expiresInMs);
        const maxAttempts = 5;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                // Generate OTCs for all users
                const otcDocs = users.flatMap(user => 
                    Array.from({ length: count }, () => ({
                        code: this.generateCode(),
                        ownerUserId: user._id,
                        expiresAtTimestamp
                    }))
                );

                // Bulk insert all OTCs
                await OTCs.insertMany(otcDocs, { ordered: false });
                return;
            } catch (error: any) {
                // If duplicate key error and not last attempt, retry entire batch
                if (error.code === 11000 && attempt < maxAttempts - 1) {
                    continue;
                }
                throw error;
            }
        }

        throw new Error('Failed to create OTCs for roles after maximum attempts');
    }

    /**
     * Delete an OTC by its ID
     * Returns true if deletion was successful, false otherwise (e.g., OTC not found)
     * DO NOT USE WHEN CONSUMING AN OTC
     */
    static async DeleteOTCById(otcId: string) {
        await connectDB();

        const result = await OTCs.deleteOne({ _id: otcId });
        return result.deletedCount === 1;
    }

    static async DeleteUserOTCs(ownerUserId: string) {
        await connectDB();
        
        await OTCs.deleteMany({ ownerUserId });
    }

    static async GetUserOTCs(ownerUserId: string) {
        await connectDB();
        
        return await OTCs.find({ ownerUserId }).select('code expiresAtTimestamp').lean();
    }

    static async DeleteAllOTCs() {
        await connectDB();
        
        await OTCs.deleteMany({});
    }

    static async GetTotalOTCCount(){
        await connectDB();
        return await OTCs.countDocuments();
    }
}