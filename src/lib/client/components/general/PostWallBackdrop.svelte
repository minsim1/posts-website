<script lang='ts'>
    import { onDestroy, onMount } from "svelte";
    import Post from "../posts/Post.svelte";
    import type { SanitizedComment, SanitizedPost } from "$lib/api/types";
    import type { UserRole } from "$lib/server/db/types";

    const post: SanitizedPost = {
        content: 'This is a backdrop post.',
        score: 0,
        createdAt: Date.now(),
        commentsCount: 3,
        postId: 'backdrop-post',
        authorName: 'BackdropUser',
        authorRole: 'user'
    }

    interface PostBlockData{
        post: SanitizedPost;
        comments: SanitizedComment[];
    }

    const comment: SanitizedComment={
        commentId: 'backdrop-comment-1',
        postId: 'backdrop-post',
        authorName: 'BackdropCommenter',
        authorRole: 'user',
        content: 'This is a backdrop comment.',
        createdAt: Date.now(),
    }

    const postBlockData: PostBlockData = {
        post: post,
        comments: [comment, comment, comment]
    }

    // DOM manipulation

    const COL_WIDTH = 400;
    const MIN_RAND_TOP_PADDING = 2;
    const MAX_RAND_TOP_PADDING = 200;
    const POST_HEIGHT = 150;

    let colCount = $state(0);
    let postsPerCol = $state(0);

    function windowWidthChanged(){
        const element = document.getElementById('post-cols-container');
        if(!element) return;

        const windowWidth = window.innerWidth * 1.5;
        colCount = Math.ceil(windowWidth / COL_WIDTH) + 1;
        
        // Calculate posts needed to fill container height
        const containerHeight = window.innerHeight * 1.5;
        postsPerCol = Math.ceil(containerHeight / POST_HEIGHT) + 2;
    }

    onMount(() => {
		window.addEventListener('resize', windowWidthChanged);

        windowWidthChanged();

		return () => {
			window.removeEventListener('resize', windowWidthChanged);
		};
	});

    function getRandomTopPadding(){
        return Math.floor(Math.random() * (MAX_RAND_TOP_PADDING - MIN_RAND_TOP_PADDING + 1)) + MIN_RAND_TOP_PADDING;
    }

    // Random content generation
    function getRandomUserProfile(){
        interface userProfile{
            username: string;
            role: UserRole | "anonymous";
        }

        let userProfile: userProfile;

        const usernames = [
            'User123', 'Bob', 'Geek3000', 'SuperWowUser', '006472', 'LolUser', 'Donald Trumpet'
        ]
        const chanceToBeAnonymous = 0.9;
        if(Math.random() < chanceToBeAnonymous){
            return userProfile = {
                username: 'Anonymous',
                role: "anonymous"
            }
        }else{
            const randomName = usernames[Math.floor(Math.random() * usernames.length)];
            const randomRole = ['admin', 'moderator', 'user'][Math.floor(Math.random() * 3)] as UserRole;
            return userProfile = {
                username: randomName,
                role: randomRole
            }
        }
    }

    function getRandomPostContent(){
        const contents = [
            'Super cool post!',
            'A very offensive post >:))',
            'Bu bu bu, bu bu bu bu bu, bu bu bu',
            'This website is fucking trash',
            'Im da joker baby!!!',
            'This post adds nothing to the betterment of this community and only incentivizes negative behavior!',
            'This is some longer post content that is self aware, oh no, now im describing myself AAAAAAAAAAA',
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore',
            'Short post.',
            'Does he know?'
        ];

        return contents[Math.floor(Math.random() * contents.length)];
    }

    function getRandomCommentContent(){
        const contents = [
            'Nice post!',
            'I disagree with everything you said >:))',
            'Bu bu bu, bu bu bu bu bu, bu bu bu',
            'This comment is stupid',
            'This comment is hilarious!',
            'Haha, funny comment!',
            'This comment adds nothing to the betterment of this community and only incentivizes negative behavior!',
            'This is some longer comment content that is self aware, oh no, now im describing myself AAAAAAAAAAA',
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore',
            'Short comment.',
            'Does he know?'
        ];

        return contents[Math.floor(Math.random() * contents.length)];
    }

    function getRandomPersonalVote(){
        const chanceForVote = 0.3;
        const chanceForUpvote = 0.6;
        if(Math.random() < chanceForVote){
            if(Math.random() < chanceForUpvote){
                return "upvote";
            }else{
                return "downvote";
            }
        }else{
            return undefined;
        }
    }

    function getRandomDate(){
        const now = Date.now();
        const pastTime = now - Math.floor(Math.random() * 1000000000);
        return pastTime;
    }

    function getRandomScore(){
        return Math.floor(Math.random() * 25) - 10;
    }

    function getPostBlockData(){
        let postBlockData: PostBlockData;

        // Post
        const randomProfile = getRandomUserProfile();
        const post: SanitizedPost = {
            content: getRandomPostContent(),
            score: getRandomScore(),
            createdAt: getRandomDate(),
            commentsCount: 0,
            postId: crypto.randomUUID(),
            authorName: randomProfile.username,
            authorRole: randomProfile.role,
            personalUserVote: getRandomPersonalVote(),
        }

        // Comments
        const ChanceForFirstComment = 0.8;
        const ChanceForSecondComment = 0.5;
        const comments: SanitizedComment[] = [];
        function addRandomComment(){
            const randomProfile = getRandomUserProfile();
            comments.push({
                commentId: crypto.randomUUID(),
                postId: 'backdrop-post',
                authorName: randomProfile.username,
                authorRole: randomProfile.role,
                content: getRandomCommentContent(),
                createdAt: getRandomDate(),
            });
        }
        
        if(Math.random() < ChanceForFirstComment){
            addRandomComment();

            if(Math.random() < ChanceForSecondComment){
                addRandomComment();
            }
        }

        post.commentsCount = comments.length;

        return postBlockData = {
            post: post,
            comments: comments
        };
    }
</script>

<div class="container">
    <div class="post-cols-container" id="post-cols-container">
        {#each Array(colCount) as _, index}
            <div class="post-column-container" style={`padding-top: ${getRandomTopPadding()}px;`}>
                {#each Array(postsPerCol) as _}
                    {@render postBlock(getPostBlockData())}
                {/each}
            </div>
        {/each}
    </div>
    <div class="backdrop"></div>
</div>

{#snippet postBlock(data: PostBlockData)}
    <Post 
        post={data.post} 
        refreshPostsCallback={() => {}}
        showRedirect={false}
        forceComments={data.comments}
        hidePersonalIcons={true}
        allowedToComment={false}
    />
    <!-- {#each data.comments as comment}
        Comment component can be added here if needed
    {/each} -->
{/snippet}

<style>
    .container{
        z-index: -10;
        position: absolute;
        top: 0;
        left: 0;
        width: 100dvw;
        height: 100dvh;
        display: flex;
        flex-direction: row;
        overflow: hidden;
    }

    .backdrop{
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        backdrop-filter: blur(4px);
        background-color: rgba(0, 0, 0, 0.425);
        z-index: -5;
    }

    .post-cols-container{
        scale: 0.7;
        z-index: -10;
        position: absolute;
        width: 200%;
        height: 150%;
        top: -30%;
        left: -50%;
        display: flex;
        flex-direction: row;
        gap: 1rem;
    }

    .post-column-container{
        display: flex;
        flex-direction: column;
        padding-top: 300px;
        min-width: 500px;
        border-left: 2px solid black;
    }
</style>