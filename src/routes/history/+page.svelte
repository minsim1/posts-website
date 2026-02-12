<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import ContentContainer from "$lib/client/components/general/ContentContainer.svelte";
    import Post from "$lib/client/components/posts/Post.svelte";
    import LoadingIcon from "$lib/client/components/icons/LoadingIcon.svelte";
    import CenterCard from "$lib/client/components/general/CenterCard.svelte";
    import { API } from "$lib/api/api";
    import type { SanitizedPost, SanitizedUser } from "$lib/api/types";
    import { showNotification } from "$lib/client/stores/notifications";
    import { STRINGS } from "$lib/client/strings/main";
    import { LogOut } from "$lib/helpers/logout";
    import ReturnToPageLink from "../../lib/client/components/general/ReturnToPage/ReturnToPageLink.svelte";
    import Posts from "$lib/client/components/posts/Posts.svelte";
    import LocalStorageHelper from "$lib/client/helpers/local-storage";

    let selectedDate = $state("");
    let loading = $state(true);
    let posts = $state<SanitizedPost[]>([]);
    let error = $state("");
    let user = $state<SanitizedUser | null>(null);

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

    function goToPreviousDay() {
        const [year, month, day] = selectedDate.split('-').map(Number);
        const currentDate = new Date(year, month - 1, day);
        currentDate.setDate(currentDate.getDate() - 1);
        const newDate = dateToYYYYMMDD(currentDate);
        selectedDate = newDate;
        goto(`/history?date=${newDate}`, { replaceState: true });
        loadPosts(newDate);
    }

    function goToNextDay() {
        const [year, month, day] = selectedDate.split('-').map(Number);
        const currentDate = new Date(year, month - 1, day);
        currentDate.setDate(currentDate.getDate() + 1);
        const newDate = dateToYYYYMMDD(currentDate);
        selectedDate = newDate;
        goto(`/history?date=${newDate}`, { replaceState: true });
        loadPosts(newDate);
    }

    function isNextDayInFuture(): boolean {
        const [year, month, day] = selectedDate.split('-').map(Number);
        const currentDate = new Date(year, month - 1, day);
        currentDate.setDate(currentDate.getDate() + 1);
        const today = new Date();
        return currentDate > today;
    }

    onMount(() => {
        loading = true;

        LocalStorageHelper.GetUserData().then(data => user = data);

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
            <label for="date-input" class="date-label">Select Date:</label>
            <div class="date-controls">
                <button 
                    class="nav-button"
                    onclick={goToPreviousDay}
                    aria-label="Go to previous day"
                >
                    {"<="}
                </button>
                <input 
                    id="date-input"
                    type="date" 
                    value={selectedDate}
                    oninput={handleDateChange}
                    onchange={handleDateChange}
                    max={dateToYYYYMMDD(new Date())}
                />
                <button 
                    class="nav-button"
                    onclick={goToNextDay}
                    disabled={isNextDayInFuture()}
                    aria-label="Go to next day"
                >
                    {"=>"}
                </button>
            </div>
            <p class="posts-count">{posts.length} post{posts.length !== 1 ? 's' : ''} found</p>
        </div>

        {#if loading}
            <div class="loading-container">
                <LoadingIcon size={48} />
            </div>
        {:else if error}
            <p class="error-message">{error}</p>
        {:else if posts.length === 0}
            <!-- <p>No posts found for this date :(</p> -->
        {:else}
            <div class="posts-container">
                <Posts
                    {posts}
                    postsRefreshCallback={handlePostRefresh}
                    returnLocation="history"
                    showModerationRedirect={user ? user.role === 'moderator' || user.role === 'admin' : false}
                />
            </div>
        {/if}
    </div>
</ContentContainer>

<style>
    .date-label{
        text-align: center;
    }

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
        max-width: 400px;
        min-width: 250px;
    }

    .date-selector label {
        font-weight: 600;
        font-size: 1rem;
    }

    .date-controls {
        display: flex;
        gap: 0.75rem;
        align-items: center;
        justify-content: center;
    }

    .nav-button {
        padding: 0.5rem 0.75rem;
        font-size: 1.2rem;
        border: 1px solid var(--color-border);
        border-radius: 4px;
        background-color: var(--color-bg-light);
        color: var(--color-text);
        cursor: pointer;
        transition: background-color 0.2s, border-color 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 40px;
        height: 40px;
    }

    .nav-button:hover:not(:disabled) {
        background-color: var(--color-primary);
        color: white;
        border-color: var(--color-primary);
    }

    .nav-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .date-selector input[type="date"] {
        padding: 0.75rem;
        font-size: 1rem;
        border: 1px solid var(--color-border);
        border-radius: 4px;
        background-color: var(--color-bg-light);
        color: var(--color-text);
        flex: 1;
        min-width: 150px;
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
        text-align: center;
    }
</style>
