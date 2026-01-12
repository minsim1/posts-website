<script lang="ts">
	export let id: string;
	export let label: string;
	export let value: string | number;
	export let required: boolean = false;
	export let options: { value: string | number; label: string }[] = [];
</script>

<div class="form-group">
	<label for={id}>{label}</label>
	<select {id} bind:value {required}>
		{#each options as option}
			<option value={option.value}>{option.label}</option>
		{/each}
	</select>
</div>

<style>
	label {
		display: block;
		margin-bottom: 0.25rem;
		font-size: 0.9rem;
	}

	select {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: 4px;
		font-size: 1rem;
		box-sizing: border-box;
		background-color: var(--color-bg-light);
		color: white;
		cursor: pointer;
	}

	select:focus {
		outline: none;
		border-color: var(--color-primary);
	}
</style>
