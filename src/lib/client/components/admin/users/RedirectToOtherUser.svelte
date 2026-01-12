<script lang='ts'>
    import { goto } from "$app/navigation";

    let {
        userId
    }: {
        userId: string
    } = $props();

    function onPress(e: MouseEvent){
        e.preventDefault();
        goto(`/admin/user?id=${encodeURIComponent(userId)}`);
    }
</script>

<a href={`/admin/user?id=${encodeURIComponent(userId)}`} onclick={onPress}>
    Go to profile
</a>