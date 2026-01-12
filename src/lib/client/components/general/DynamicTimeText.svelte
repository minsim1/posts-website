<script lang='ts'>
    import { onMount, onDestroy } from "svelte";
    import { GetApprxTimeDifferenceString, GetExactTimeDifferenceString } from "$lib/client/helpers/time";

    let {
        timestamp,
        type,
        precision
    }: {
        timestamp: number;
        type: "time_since" | "time_until";
        precision?: "exact" | "approximate";
    } = $props();

    let displayText = $state("");
    let intervalId: number | null = null;

    function getTimeStringFunction(){
        if(precision === "exact"){
            return (from: number, to: number) => {
                return GetExactTimeDifferenceString(from, to);
            };
        }else{
            return (from: number, to: number) => {
                return GetApprxTimeDifferenceString(from, to);
            };
        }
    }

    function getUpdateInterval(diffMs: number): number {
        const seconds = Math.floor(diffMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if(days > 0) {
            return 1000 * 60 * 60; // Update every hour for days
        } else if(hours > 0) {
            return 1000 * 60 * 5; // Update every 5 minutes for hours
        } else if(minutes > 0) {
            return 1000 * 30; // Update every 30 seconds for minutes
        } else {
            return 1000; // Update every second for seconds
        }
    }

    function updateText() {
        const now = Date.now();
        const diff = type === "time_since" 
            ? now - timestamp 
            : timestamp - now;

        if(type === "time_since") {
            displayText = getTimeStringFunction()(timestamp, now);
        } else {
            if(diff <= 0) {
                displayText = "now";
            } else {
                displayText = getTimeStringFunction()(now, timestamp);
            }
        }

        // Clear existing interval
        if(intervalId !== null) {
            clearInterval(intervalId);
            intervalId = null;
        }

        // Calculate new interval based on current time difference
        const updateInterval = getUpdateInterval(Math.abs(diff));
        
        // Set new interval that will recalculate on next tick
        intervalId = setInterval(updateText, updateInterval) as unknown as number;
    }

    onMount(() => {
        updateText();
    });

    onDestroy(() => {
        if(intervalId !== null) {
            clearInterval(intervalId);
        }
    });
</script>

{displayText}
