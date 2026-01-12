<script lang="ts">
    import { showNotification } from "$lib/client/stores/notifications";
    import DynamicTimeText from "../general/DynamicTimeText.svelte";

    let {
        code,
        expiresAtTimestamp
    } : {
        code: string;
        expiresAtTimestamp: number;
    } = $props();

    function copyRegistrationUrl(){
        const registrationUrl = `${window.location.origin}/register?otc=${code}`;
        navigator.clipboard.writeText(registrationUrl);
        showNotification("success", "Registration URL copied to clipboard.");
    }
</script>

<div class="otc-item">
    <div class="otc-code">
        {code}
        <button class="copy-button" onclick={copyRegistrationUrl} aria-label="Copy registration URL">
            Copy Registration URL
        </button>
    </div>
    <div class="otc-expiry">
        Expires: <DynamicTimeText timestamp={expiresAtTimestamp} type="time_until" />
    </div>
</div>

<style>
    .otc-item {
		background-color: var(--color-bg-main);
		padding: 1rem;
		border-radius: 4px;
		border: 1px solid var(--color-border);
	}

    .copy-button {
        font-size: 0.875rem;
        color: var(--color-text);
        background-color: transparent;
        border: none;
        text-decoration: underline;
        cursor: pointer;
    }

	.otc-code {
		font-family: monospace;
		font-size: 1rem;
		color: var(--color-text);
		margin-bottom: 0.5rem;
		word-break: break-all;
	}

	.otc-expiry {
		color: var(--color-text-secondary);
		font-size: 0.875rem;
	}
</style>