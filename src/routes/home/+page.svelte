<script lang="ts">
	import { text } from '@sveltejs/kit';
	import { onMount } from 'svelte';
    import CreatePostForm from '$lib/client/components/posts/CreatePost.svelte';
    import ContentContainer from '$lib/client/components/general/ContentContainer.svelte';
    import LocalStorageHelper from '$lib/client/helpers/local-storage';
    import { LogOut } from '$lib/helpers/logout';
    import Posts from '$lib/client/components/posts/Posts.svelte';
    import { API } from '$lib/api/api';
    import type { SanitizedPost } from '$lib/api/types';
    import { CONFIG } from '../../public-config';
    import { STRINGS } from '$lib/client/strings/main';
    import Alert from '$lib/client/components/Alert.svelte';
    import LoadingIcon from '$lib/client/components/icons/LoadingIcon.svelte';
    import { GetApprxTimeDifferenceString } from '$lib/client/helpers/time';

	interface UserData {
		id: string;
		username: string;
		role: 'admin' | 'user' | 'moderator';
	}

	let user = $state<UserData | null>(null);
	let loading = $state(true);
	let error = $state('');
	let posts = $state<SanitizedPost[]>([]);
	let postsLoading = $state(true);

	async function fetchPosts(){
		error = "";

		const currentTimestamp = Date.now();
		const pastTimestamp = currentTimestamp - CONFIG.posts.query.timeframeToQuery;

		postsLoading = true;
		const response = await API.posts.query(pastTimestamp, currentTimestamp);
		postsLoading = false;

		if(response.success){
			posts = response.data.posts;
		}else{
			if(response.status == 401 || response.status == 403){
				LocalStorageHelper.ClearUserDataCache();
				window.location.href = "/login"
				return;
			}

			if(response.error){
				error = STRINGS.errors[response.error.code]
				return;
			}else{
				error = STRINGS.generic.unknownError + ` (${response.status})`
			}
		}
	}

	onMount(async () => {
        loading = true;
		error = '';

		const userData = await LocalStorageHelper.GetUserData();

        if(userData){
			user = userData;
            loading = false;
        }else{
            // window.location.href = '/login';
        }

		await fetchPosts();
	});

	async function createdPostCallback(){
		await fetchPosts();
	}
</script>

<svelte:head>
	<title>Home</title>
</svelte:head>

<ContentContainer>
	{#if user}
		<CreatePostForm updateCallback={createdPostCallback}/>
		<hr/>
	{/if}
	{#if error}
		<Alert type="error" message={error}/>
	{/if}
	{#if postsLoading}
		<p class="loading-container">
			<LoadingIcon size={48}/>
		</p>
	{:else}
		{#if posts.length == 0}
			<p class="no-posts-text">No posts found from the last <b>{GetApprxTimeDifferenceString(CONFIG.posts.query.timeframeToQuery, 0)}</b> :/</p>
			<p class="no-posts-text">Check <a href="/history">history</a> or create some yourself!</p>
		{:else}
			<p class="post-timeframe-text">Showing posts from the last <b>{GetApprxTimeDifferenceString(CONFIG.posts.query.timeframeToQuery, 0)}</b></p>
			<Posts
				posts={posts}
				showModerationRedirect={user ? user.role == "moderator" || user.role == "admin" : false}
				postsRefreshCallback={fetchPosts}
				returnLocation="home"
			/>
			<p class="see-history-text">See what people have written previously <a href="/history">here</a></p>
		{/if}
	{/if}
</ContentContainer>

<style>
	hr{
		margin: 1rem 0;
		width: 95%;
		border: 1px solid var(--color-border-light);
	}

	.loading-container {
		margin-top: 2rem;
		height: 10rem;
		text-align: center;
	}

	.no-posts-text{
		margin-top: 1rem;
		font-size: 1rem;
		font-style: italic;
		color: var(--color-text-secondary);
		padding: 0;
		text-align: center;
	}

	.post-timeframe-text{
		font-size: 1rem;
		color: var(--color-text-secondary);
		margin-top: 0.5rem;
		margin-bottom: 0.5rem;
		padding: 0 1rem;
		font-style: italic;
		text-align: center;
	}

	.see-history-text{
		font-size: 1rem;
		color: var(--color-text-secondary);
		margin: 0.5rem 0;
		padding: 0 1rem;
		font-style: italic;
		text-align: center;
	}
</style>
