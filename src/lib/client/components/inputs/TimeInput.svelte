<script lang='ts'>
    import TextInput from "./TextInput.svelte";
    import SelectInput from "./SelectInput.svelte";

    let {
        label = $bindable(''),
        value = $bindable(0),
        id
    } = $props<{
        label: string;
        value: number; // in milliseconds
        id: string;
    }>();

    type TimeUnit = "seconds" | "minutes" | "hours" | "days";

    let selectedUnit = $state<TimeUnit>("minutes");
    let numericValue = $state<string>("");

    const unitOptions: {label: string; value: TimeUnit}[] = [
        {label: "Seconds", value: "seconds"},
        {label: "Minutes", value: "minutes"},
        {label: "Hours", value: "hours"},
        {label: "Days", value: "days"}
    ];

    function convertToMilliseconds(val: number, unit: TimeUnit): number {
        switch(unit){
            case "seconds": return val * 1000;
            case "minutes": return val * 1000 * 60;
            case "hours": return val * 1000 * 60 * 60;
            case "days": return val * 1000 * 60 * 60 * 24;
        }
    }

    function updateValue() {
        const num = parseInt(numericValue);
        if(!isNaN(num) && num > 0){
            value = convertToMilliseconds(num, selectedUnit);
        }
    }

    $effect(() => {
        updateValue();
    });
</script>

<div class="time-input-container">
    {#if label}
        <label class="time-input-label" for={`${id}-value`}>{label}</label>
    {/if}
    <div class="time-input-fields">
        <div class="numeric-input">
            <TextInput
                label=""
                bind:value={numericValue}
                type="number"
                id={`${id}-value`}
                placeholder={"Enter value"}
            />
        </div>
        <div class="unit-select">
            <SelectInput
                bind:value={selectedUnit}
                options={unitOptions}
                label=""
                id={`${id}-unit`}
            />
        </div>
    </div>
</div>

<style>
    .time-input-container {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .time-input-label {
        font-weight: 600;
        color: var(--color-text);
        font-size: 0.875rem;
    }

    .time-input-fields {
        display: flex;
        gap: 0.5rem;
    }

    .numeric-input {
        flex: 1;
    }

    .unit-select {
        flex: 1;
    }
</style>
