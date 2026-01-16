<script lang='ts'>
    import { onMount } from "svelte";
    import ReturnToPageLink from "./ReturnToPageLink.svelte";

    type returnOptions = "home" | "registration" | "admin-panel" | "history" | "moderation";

    interface returnOptionData{
        text: string;
        href: string;
    }

    let currentOption = $state<returnOptions>("home");

    const optionToHrefMap: Record<returnOptions, returnOptionData> = {
        "home": { text: "Return to Home", href: "/home" },
        "registration": { text: "Return to Registration", href: "/register" },
        "admin-panel": { text: "Return to Admin Panel", href: "/admin" },
        "history": { text: "Return to History", href: "/history" },
        "moderation": { text: "Return to Moderation", href: "/moderation" }
    };

    async function getReturnLocationFromUrlParams(){
		const urlParams = new URLSearchParams(window.location.search);
		const otcParam = urlParams.get('return_location');
		if(otcParam){
			currentOption = otcParam as returnOptions;
		}
	}

	onMount(async ()=>{
		await getReturnLocationFromUrlParams();
	})
</script>

<ReturnToPageLink text={optionToHrefMap[currentOption].text} href={optionToHrefMap[currentOption].href} />
