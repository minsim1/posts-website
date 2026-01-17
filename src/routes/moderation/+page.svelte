<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import LocalStorageHelper from "$lib/client/helpers/local-storage";
    import ContentContainer from "$lib/client/components/general/ContentContainer.svelte";
    import LoadingIcon from "$lib/client/components/icons/LoadingIcon.svelte";
    import { type SanitizedPost, type SanitizedComment } from "$lib/api/types";
    import { API } from "$lib/api/api";
    import { LogOut } from "$lib/helpers/logout";
    import { STRINGS } from "$lib/client/strings/main";
    import { showNotification } from "$lib/client/stores/notifications";
    import CenterCard from "$lib/client/components/general/CenterCard.svelte";
    import ReturnToPageLink from "../../lib/client/components/general/ReturnToPage/ReturnToPageLink.svelte";
    import ContentItem from "$lib/client/components/moderation/ContentItem.svelte";
    import { CONFIG } from "../../public-config";
    import SmartReturnLink from "$lib/client/components/general/ReturnToPage/SmartReturnLink.svelte";

    interface UserData {
        id: string;
        username: string;
        role: 'admin' | 'user' | 'moderator';
    }

    type ContentWithType = {
        item: SanitizedComment;
        type: "comment";
        timestamp: number;
    } | {
        type: "post";
        item: SanitizedPost;
        timestamp: number;
    }

    let user = $state<UserData | null>(null);
    let error = $state("");
    let loading = $state(true);
    let content = $state<ContentWithType[]>([]);

    const now = Date.now();
    const day24 = 24 * 60 * 60 * 1000;
    const day48 = 48 * 60 * 60 * 1000;

    let last24Hours = $derived(content.filter(c => now - c.timestamp < day24));
    let last48Hours = $derived(content.filter(c => now - c.timestamp >= day24 && now - c.timestamp < day48));
    let olderThan48Hours = $derived(content.filter(c => now - c.timestamp >= day48));

    async function loadUserData(): Promise<boolean> {
        const userData = await LocalStorageHelper.GetUserData();
        
        if (!userData) {
            goto('/home');
            return false;
        }

        if (userData.role !== 'moderator' && userData.role !== 'admin') {
            goto('/home');
            return false;
        }

        user = userData;
        return true;
    }

    async function loadContent() {
        loading = true;
        const after = Date.now() - CONFIG.moderation.defaultContentFetchRange;
        const response = await API.moderation.getLatestContent(after);
        loading = false;

        if (response.success) {
            const posts: ContentWithType[] = response.data.posts.map(post => ({
                item: post,
                type: "post" as const,
                timestamp: post.createdAt
            }));

            const comments: ContentWithType[] = response.data.comments.map(comment => ({
                item: comment,
                type: "comment" as const,
                timestamp: comment.createdAt
            }));

            // Combine and sort by timestamp (most recent first)
            content = [...posts, ...comments].sort((a, b) => b.timestamp - a.timestamp);
        } else {
            if (response.status == 401 || response.status == 403) {
                await LogOut();
                return;
            }

            if (response.error) {
                showNotification('error', STRINGS.errors[response.error.code]);
            } else {
                showNotification('error', STRINGS.generic.unknownError + ` (${response.status})`);
            }
            error = "Failed to load content. Please try again.";
        }
    }

    // Type correction helper
    function getContentItemData(item: ContentWithType) {
        if(item.type === "post"){
            return {
                type: item.type,
                item: item.item
            };
        }else{
            return {
                type: item.type,
                item: item.item
            };
        }
    }

    onMount(async () => {
        const hasUser = await loadUserData();
        if (hasUser) {
            await loadContent();
        }
    });
</script>

<svelte:head>
	<title>Moderation</title>
</svelte:head>

<ContentContainer>
    <div class="moderation-page">
        <div class="header">
            <SmartReturnLink />
            <h1>Recent Content Moderation</h1>
            <p class="description">
                Showing content from the last {CONFIG.moderation.defaultContentFetchRange / (24 * 60 * 60 * 1000)} days
            </p>
        </div>

        {#if loading}
            <div class="loading-container">
                <LoadingIcon size={48} />
            </div>
        {:else if error}
            <CenterCard>
                <p class="error-message">{error}</p>
            </CenterCard>
        {:else if content.length === 0}
            <CenterCard>
                <p>No recent content.</p>
            </CenterCard>
        {:else}
            <div class="content-sections">
                {#if last24Hours.length > 0}
                    <section class="time-section">
                        <h2>Last 24 Hours</h2>
                        <div class="content-list">
                            {#each last24Hours as item}
                                <ContentItem data={getContentItemData(item)} />
                            {/each}
                        </div>
                    </section>
                {/if}

                {#if last48Hours.length > 0}
                    <section class="time-section">
                        <h2>Last 48 Hours</h2>
                        <div class="content-list">
                            {#each last48Hours as item}
                                <ContentItem data={getContentItemData(item)} />
                            {/each}
                        </div>
                    </section>
                {/if}

                {#if olderThan48Hours.length > 0}
                    <section class="time-section">
                        <h2>More than 48 Hours Old</h2>
                        <div class="content-list">
                            {#each olderThan48Hours as item}
                                <ContentItem data={getContentItemData(item)} />
                            {/each}
                        </div>
                    </section>
                {/if}
            </div>
        {/if}
    </div>
</ContentContainer>

<style>
    .moderation-page {
        width: 100%;
        margin: 0 auto;
        padding: 2rem 1rem;
    }

    .header {
        margin-bottom: 2rem;
    }

    .header h1 {
        margin: 1rem 0 0.5rem 0;
        font-size: 2rem;
    }

    .description {
        color: var(--color-text-secondary);
        margin: 0;
    }

    .loading-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 200px;
    }

    .error-message {
        color: var(--color-error);
        margin: 0;
    }

    .content-sections {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .time-section {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .time-section h2 {
        margin: 0;
        font-size: 1.5rem;
        color: var(--color-primary);
        border-bottom: 2px solid var(--color-border);
        padding-bottom: 0.5rem;
    }

    .content-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
</style>
