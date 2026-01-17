<script lang='ts'>
    import ShieldIcon from "../icons/ShieldIcon.svelte";
    import TrashIcon from "../icons/TrashIcon.svelte";
    import CommentIcon from "../icons/CommentIcon.svelte";
    import RedirectIcon from "../icons/RedirectIcon.svelte";

    let {
        showComments = false,
        commentsCount = 0,
        showRedirect = false,
        showModeration = false,
        showDelete = false,
        onComments,
        onRedirect,
        onModerate,
        onDelete
    }: {
        showComments?: boolean;
        commentsCount?: number;
        showRedirect?: boolean;
        showModeration?: boolean;
        showDelete?: boolean;
        onComments?: () => void;
        onRedirect?: () => void;
        onModerate?: () => void;
        onDelete?: () => void;
    } = $props();
</script>

<div class="action-buttons">
    {#if showComments && onComments}
        <button class="comments-button" onclick={onComments} aria-label="Toggle comments">
            <span class="comments-count">{commentsCount}</span>
            <CommentIcon/>
        </button>
    {/if}
    {#if showRedirect && onRedirect}
        <button class="redirect-button" onclick={onRedirect} aria-label="Go to post page">
            <RedirectIcon />
        </button>
    {/if}
    {#if showModeration && onModerate}
        <button class="moderation-button" onclick={onModerate} aria-label="Moderate content">
            <ShieldIcon />
        </button>
    {/if}
    {#if showDelete && onDelete}
        <button class="delete-button" onclick={onDelete} aria-label="Delete content">
            <TrashIcon />
        </button>
    {/if}
</div>

<style>
    .action-buttons {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
        align-items: center;
    }

    .comments-button,
    .redirect-button,
    .moderation-button,
    .delete-button {
        background: none;
        border: none;
        color: var(--color-icon-action);
        cursor: pointer;
        aspect-ratio: 1 / 1;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.2s;
        border-radius: 4px;
        height: 100%;
        padding: 0.5rem;
    }

    .comments-button {
        gap: 0.5rem;
    }

    @media (hover: hover) {
        .comments-button:hover,
        .redirect-button:hover,
        .moderation-button:hover {
            color: var(--color-icon-action-hover);
            background-color: var(--color-bg-light);
        }

        .delete-button:hover {
            color: var(--color-error);
            background-color: var(--color-error-bg);
        }
	}

    .comments-count {
        font-size: 0.9rem;
        font-weight: 500;
    }

    .comments-button :global(svg),
    .moderation-button :global(svg),
    .redirect-button :global(svg),
    .delete-button :global(svg) {
        width: 18px;
    }

    @media (max-width: 600px) {
        .action-buttons {
            gap: 0.6rem;
        }

        .comments-button,
        .redirect-button,
        .moderation-button,
        .delete-button {
            padding: 0.3rem;
        }

        .comments-button :global(svg),
        .moderation-button :global(svg),
        .redirect-button :global(svg),
        .delete-button :global(svg) {
            width: 15px;
        }
    }
</style>
