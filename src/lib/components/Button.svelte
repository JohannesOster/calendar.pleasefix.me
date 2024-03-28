<script lang="ts">
	import { onMount } from 'svelte';

	export let as: keyof HTMLElementTagNameMap = 'button';
	export let href: string | undefined = undefined;

	let element: HTMLElement;

	onMount(() => {
		if (as === 'a') if (href) element.setAttribute('href', href);
	});
</script>

<svelte:element
	this={as}
	bind:this={element}
	on:click
	type="button"
	role="button"
	tabindex="0"
	class="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 inline-flex items-center gap-x-1.5"
>
	<slot />
</svelte:element>
