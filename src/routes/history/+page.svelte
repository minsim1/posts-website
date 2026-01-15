<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import ContentContainer from "$lib/client/components/general/ContentContainer.svelte";
    import Post from "$lib/client/components/posts/Post.svelte";
    import LoadingIcon from "$lib/client/components/icons/LoadingIcon.svelte";
    import CenterCard from "$lib/client/components/general/CenterCard.svelte";
    import { API } from "$lib/api/api";
    import type { SanitizedPost } from "$lib/api/types";
    import { showNotification } from "$lib/client/stores/notifications";
    import { STRINGS } from "$lib/client/strings/main";
    import { LogOut } from "$lib/helpers/logout";
    import ReturnToPageLink from "$lib/client/components/general/ReturnToPageLink.svelte";
    import Posts from "$lib/client/components/posts/Posts.svelte";

    let selectedDate = $state("");
    let loading = $state(true);
    let posts = $state<SanitizedPost[]>([]);
    let error = $state("");

    function dateToYYYYMMDD(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function getDateRangeForDay(dateStr: string): { start: number; end: number } {
        const [year, month, day] = dateStr.split('-').map(Number);
        const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
        const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
        
        return {
            start: startOfDay.getTime(),
            end: endOfDay.getTime()
        };
    }

    async function loadPosts(dateStr: string) {
        if (!dateStr) return;

        loading = true;
        error = "";
        posts = [];

        const { start, end } = getDateRangeForDay(dateStr);
        const response = await API.posts.query(start, end);
        loading = false;

        if (response.success) {
            posts = response.data.posts;
        } else {
            if (response.status === 401 || response.status === 403) {
                await LogOut();
                return;
            }

            if (response.error) {
                showNotification('error', STRINGS.errors[response.error.code]);
                error = "Failed to load posts for this date.";
            } else {
                showNotification('error', STRINGS.generic.unknownError + ` (${response.status})`);
                error = "Failed to load posts for this date.";
            }
        }
    }

    function handleDateChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const newDate = target.value;
        
        if (newDate) {
            selectedDate = newDate;
            goto(`/history?date=${newDate}`, { replaceState: true });
            loadPosts(newDate);
        }
    }

    function handlePostRefresh() {
        if (selectedDate) {
            loadPosts(selectedDate);
        }
    }

    onMount(() => {
        loading = true;

        const urlDate = $page.url.searchParams.get('date');
        
        if (urlDate && /^\d{4}-\d{2}-\d{2}$/.test(urlDate)) {
            // Valid date format in URL
            selectedDate = urlDate;
            loadPosts(urlDate);
        } else {
            // Default to today
            const today = dateToYYYYMMDD(new Date());
            selectedDate = today;
            goto(`/history?date=${today}`, { replaceState: true });
            loadPosts(today);
        }
    });
</script>

<svelte:head>
	<title>History</title>
</svelte:head>

<ContentContainer>
    <ReturnToPageLink text="Back to Home" href="/home"/>
    <div class="history-page">
        <div class="date-selector">
            <label for="date-input">Select Date:</label>
            <input 
                id="date-input"
                type="date" 
                value={selectedDate}
                oninput={handleDateChange}
                onchange={handleDateChange}
                max={dateToYYYYMMDD(new Date())}
            />
            <p class="posts-count">{posts.length} post{posts.length !== 1 ? 's' : ''} found</p>
        </div>

        {#if loading}
            <div class="loading-container">
                <LoadingIcon size={48} />
            </div>
        {:else if error}
            <p class="error-message">{error}</p>
        {:else if posts.length === 0}
            <p>No posts found for this date :(</p>
        {:else}
            <div class="posts-container">
                <Posts
                    {posts}
                    postsRefreshCallback={handlePostRefresh}
                />
            </div>
        {/if}
    </div>
</ContentContainer>

<style>
    .history-page {
        width: 100%;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .date-selector {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 2rem;
        max-width: 300px;
        min-width: 200px;
    }

    .date-selector label {
        font-weight: 600;
        font-size: 1rem;
    }

    .date-selector input[type="date"] {
        padding: 0.75rem;
        font-size: 1rem;
        border: 1px solid var(--color-border);
        border-radius: 4px;
        background-color: var(--color-bg-light);
        color: var(--color-text);
    }

    .date-selector input[type="date"]:focus {
        outline: none;
        border-color: var(--color-primary);
    }

    .loading-container {
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .error-message {
        color: var(--color-error);
        margin: 0;
    }

    .posts-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: 100%;
    }

    .posts-count {
        color: var(--color-text-secondary);
        font-style: italic;
        margin: 0 0 1rem 0;
    }
</style>
