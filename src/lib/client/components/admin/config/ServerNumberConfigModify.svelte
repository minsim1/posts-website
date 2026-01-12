<script lang='ts'>
    import { API } from "$lib/api/api";
    import type { APITypes } from "$lib/api/types";
    import { STRINGS } from "$lib/client/strings/main";
    import Alert from "../../Alert.svelte";
    import Button from "../../inputs/Button.svelte";
    import TextInput from "../../inputs/TextInput.svelte";
    import TimeInput from "../../inputs/TimeInput.svelte";
    import { GetExactTimeDifferenceString } from "$lib/client/helpers/time";
    import LocalStorageHelper from "$lib/client/helpers/local-storage";

    export let label: string;
    export let currentValue: number;
    export let numberType: "integer" | "time_ms";
    export let numberToConfigFunc: (time: number) => APITypes.Admin.ModifyConfig.Request;
    export let refreshCallback: ()=>void;

    let savedValue: string = "";
    let timeValue: number = 0;
    let loading = false;
    let error = "";
    let success = "";

    async function submit(){
        if(loading) return;

        error = "";
        success = "";

        let numberToSend: number;

        if(numberType == "time_ms"){
            numberToSend = timeValue;
        } else {
            const savedValueNumber = parseInt(savedValue);
            if(savedValueNumber == null || isNaN(savedValueNumber)){
                error = "Please input a correct integer value";
                return;
            }
            numberToSend = savedValueNumber;
        }

        if(numberToSend <= 0){
            error = "Please input a positive integer value";
            return;
        }

        const requestData = numberToConfigFunc(numberToSend);

        loading = true;
        const response = await API.admin.changeConfig(requestData);
        loading = false;

        if(response.success == true){
            success = "Sucessfully changed config";
            LocalStorageHelper.ClearServerConfigCache();
            refreshCallback();
            return;
        }else{
            if(response.status == 401 || response.status == 403){
                window.location.href = "/login";
                return;
            }

            if(response.error){
                error = STRINGS.errors[response.error.code];
                return;
            }else{
                error = STRINGS.generic.unknownError + ` (${response.status})`;
            }
        }
    }
</script>

<h3>{label + ` (${numberType == "integer" ? currentValue : GetExactTimeDifferenceString(currentValue, 0)})`}</h3>
<form onsubmit={(e) => { e.preventDefault(); submit(); }}>
    {#if numberType == "integer"}
        <div class="input-field">
            <TextInput
                label=""
                bind:value={savedValue}
                type="number"
                id="value"
            />
        </div>
    {:else}
        <div class="input-field">
            <TimeInput
                label=""
                bind:value={timeValue}
                id="time"
            />
        </div>
    {/if}
    <div class="submitButton">
        <Button type="submit">
            Submit
        </Button>
    </div>
</form>

{#if error}
    <Alert
        message={error}
        type="error"
    />
{/if}

{#if success}
    <Alert
        message={success}
        type="success"
    />
{/if}

<style>
    form{
        display: flex;
        flex-direction: row;
        gap: 5px;
        align-items: flex-end;
    }
    .input-field{
        flex: 3;
    }
    .submitButton{
        flex: 1;
    }
</style>