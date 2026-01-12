<script lang='ts'>
    import type { SanitizedPost } from "$lib/api/types";
    import Post from "./Post.svelte";
    import RadioGroup from "../inputs/RadioGroup.svelte";
    import Switch from "../inputs/Switch.svelte";
    import HelpButton from "../general/HelpButton.svelte";
    import { onMount } from "svelte";
    import { page } from "$app/state";
    import { goto } from "$app/navigation";

    let { 
        posts = $bindable([]),
        showModerationRedirect = false,
        // sortType = $bindable<"recent" | "popular">("recent"),
        postsRefreshCallback
    }: { 
        posts: SanitizedPost[];
        showModerationRedirect?: boolean;
        postsRefreshCallback: () => void;
        // sortType: "recent" | "popular";
    } = $props();

    let hidePersonalIcons = $state(true);

    let sortType = $state<"recent" | "popular">("recent");

    function sortTypeChanged(){
        // Update URL with new sort parameter
        const url = new URL(page.url);
        url.searchParams.set('sort', sortType);
        goto(url.toString(), { replaceState: true, keepFocus: true });
        
        // sortPostsByType();
        // Reloading is just easier, since there are many update issues with svelte reactivity
        // (like one post's comments appearing on another post),
        // various vote score issues, etc.
        postsRefreshCallback(); 
    }

    function sortPostsByType(){
        if(sortType == 'popular'){
            posts.sort((a, b)=>{
                return b.score - a.score;
            });
        }else if(sortType == 'recent'){
            posts.sort((a, b)=>{
                return b.createdAt - a.createdAt;
            });
        }
    }

    onMount(()=>{
        // Restore sort type from URL parameter
        const urlSort = page.url.searchParams.get('sort');
        if (urlSort === 'recent' || urlSort === 'popular') {
            sortType = urlSort;
        }
        
        sortPostsByType();
    });
</script>

<div class='container'>
    <div class="controls-row">
        <RadioGroup 
            label="Sort by:"
            name="sortType"
            bind:value={sortType}
            options={[
                { value: 'recent', label: 'Most Recent' },
                { value: 'popular', label: 'Most Popular' }
            ]}
            onchange={sortTypeChanged}
        />
        <Switch 
            label="Hide personal icons"
            bind:checked={hidePersonalIcons}
            helpComponent={personalIconsExplainer}
        />
    </div>
    {#each posts as post, index (post.postId)}
        <Post 
            post={post} 
            hidePersonalIcons={hidePersonalIcons}
            showModerationRedirect={showModerationRedirect}
            refreshPostsCallback={postsRefreshCallback}
        />
        {#if index < posts.length - 1}
            <hr/>
        {/if}
    {/each}
</div>

{#snippet personalIconsExplainer()}
    <HelpButton title="Why hide personal icons?">
        <p>When browsing in public, the "delete post" button can reveal which anonymous posts are yours.</p>
        <p>Use this option to hide those personal icons for added privacy.</p>
    </HelpButton>
{/snippet}

<style>
    .container{
        display: flex;
        flex-direction: column;
        width: 100%;
        gap: 1rem;
        padding-top: 1rem;
    }
    .controls-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        padding: 0rem 2rem;
        flex-wrap: wrap;
    }
    hr{
        border: none;
        border-top: 2px solid var(--color-border-light);
        width: 95%;
        align-self: center;
    }
</style>