export function GetApprxTimeDifferenceString(time1: number, time2: number): string {
    let remainingMS = Math.abs(time2 - time1);
    if(remainingMS <= 0) return "0 seconds";

    const seconds = Math.floor((remainingMS / 1000) % 60);
    const minutes = Math.floor((remainingMS / (1000 * 60)) % 60);
    const hours = Math.floor((remainingMS / (1000 * 60 * 60)) % 24);
    const days = Math.floor(remainingMS / (1000 * 60 * 60 * 24));

    const parts: string[] = [];
    if(days > 0){
        return `${days} day${days !== 1 ? 's' : ''}`;
    }
    
    if(hours > 0 || minutes > 0){
        if(hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
        if(minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
        return parts.join(', ');
    }else{
        if(seconds > 0){
            parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);
            return parts.join(', ');
        }else{
            return "0 seconds";
        }
    }
}

export function GetExactTimeDifferenceString(time1: number, time2: number): string {
    let remainingMS = Math.abs(time2 - time1);
    if(remainingMS <= 0) return "0 seconds";

    const seconds = Math.floor((remainingMS / 1000) % 60);
    const minutes = Math.floor((remainingMS / (1000 * 60)) % 60);
    const hours = Math.floor((remainingMS / (1000 * 60 * 60)) % 24);
    const days = Math.floor(remainingMS / (1000 * 60 * 60 * 24));

    const parts: string[] = [];
    if(days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
    if(hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
    if(minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
    if(seconds > 0) parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);

    return parts.join(', ');
}

export function GetDateTimeString(timestamp: number, secondPrecision = false): string {
    const date = new Date(timestamp);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    if(!secondPrecision) {
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    }
    
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}