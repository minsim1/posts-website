import { EmbedBuilder, WebhookClient } from "discord.js"
import type { UserRole } from "../db/types";
import { CONFIG } from "../../../public-config";

interface postMessageData {
    authorRole: "anonymous" | UserRole;
    authorName: string;
    content: string;
    id: string;
}

export class DiscordWebhooks{
    private static sanitizeForDiscord(text: string): string {
        // Escape Discord markdown and mentions
        return text
            .replace(/\\/g, '\\\\')           // Escape backslashes first
            .replace(/\*/g, '\\*')            // Escape asterisks (bold/italic)
            .replace(/_/g, '\\_')             // Escape underscores (italic/underline)
            .replace(/~/g, '\\~')             // Escape tildes (strikethrough)
            .replace(/`/g, '\\`')             // Escape backticks (code)
            .replace(/\|/g, '\\|')            // Escape pipes (spoiler)
            .replace(/@/g, '@\u200b')         // Zero-width space after @ (prevents mentions)
            .replace(/#/g, '#\u200b')         // Zero-width space after # (prevents channel links)
            .replace(/</g, '\\<')             // Escape < (prevents custom emojis/timestamps)
            .replace(/>/g, '\\>')             // Escape >
            .replace(/\[/g, '\\[')            // Escape [ (prevents markdown links)
            .replace(/\]/g, '\\]');           // Escape ]
    }

    private static getPostRedirectLink(domain: string, id: string){
        return `${domain}/posts/${id}`;
    }

    private static getDomain(){
        return process.env.DOMAIN || 'http://localhost:5173';
    }

    private static createMessageEmbed(postData: postMessageData){
        function getColorString(){
            switch (postData.authorRole){
                case "admin":
                    return CONFIG.userColors.admin;
                case "moderator":
                    return CONFIG.userColors.moderator;
                case "user":
                    return CONFIG.userColors.general;
                case "anonymous":
                    return CONFIG.userColors.general
                default:
                    return CONFIG.userColors.general;
            }
        }

        function getColor(){
            const colorString = getColorString();
            // Convert hex color string to integer
            return parseInt(colorString.replace('#', ''), 16);
        }

        function getEmbedDescription(){
            let description = '';

            description += `## **${DiscordWebhooks.sanitizeForDiscord(postData.content)}**`;
            const domain = DiscordWebhooks.getDomain();
            const redirectlink = DiscordWebhooks.getPostRedirectLink(domain, postData.id);
            description += `\n\n[See post here](${redirectlink})`;

            return description;
        }

        return new EmbedBuilder()
            .setColor(getColor())
            // .setTitle(postData.content)
            .setAuthor({ name: DiscordWebhooks.sanitizeForDiscord(postData.authorName) })
            .setTimestamp()
            .setDescription(getEmbedDescription());
    }

    private static async sendPostToChannel(url: string, postData: postMessageData){
        interface result{
            success: boolean;
            messageId?: string;
        }

        return new Promise<result>(async (resolve)=>{
            try{
                const client = new WebhookClient({ url: url });
                const embed = this.createMessageEmbed(postData);
                const res = await client.send({
                    embeds: [embed]
                })
                resolve({ success: true, messageId: res.id });
            }catch(error){
                resolve({ success: false });
            }
        })
    }

    static async SendPostToChannels(urls: string[], postData: postMessageData){
        interface result {
            successfulUrlsAndMessageIds: { url: string; messageId: string }[];
            failedUrls: string[];
        }

        return new Promise<result>(async (resolve)=>{
            const res: result = {
                successfulUrlsAndMessageIds: [],
                failedUrls: []
            }

            for(const url of urls){
                const postRes = await this.sendPostToChannel(url, postData);
                if(postRes.success){
                    res.successfulUrlsAndMessageIds.push({ url: url, messageId: postRes.messageId as string });
                }else{
                    res.failedUrls.push(url);
                }
            }

            resolve(res);
        })
    }

    private static async deleteMessageFromChannel(url: string, messageId: string){
        return new Promise<boolean>(async (resolve)=>{
            try{
                const client = new WebhookClient({ url: url });
                await client.deleteMessage(messageId);
                resolve(true);
            }catch(error){
                resolve(false);
            }
        })
    }

    static async DeleteMessages(urlsAndMessageIds: { url: string; messageId: string }[]){
        interface result {
            numOfSuccessfulDeletions: number;
            numOfFailedDeletions: number;
        }

        return new Promise<result>(async (resolve)=>{
            const res: result = {
                numOfSuccessfulDeletions: 0,
                numOfFailedDeletions: 0
            }

            for(const urlAndMessageId of urlsAndMessageIds){
                const deletionSuccess = await this.deleteMessageFromChannel(urlAndMessageId.url, urlAndMessageId.messageId);
                if(deletionSuccess){
                    res.numOfSuccessfulDeletions += 1;
                }else{
                    res.numOfFailedDeletions += 1;
                }
            }

            resolve(res);
        })
    }
}