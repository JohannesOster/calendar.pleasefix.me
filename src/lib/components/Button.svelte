<script lang="ts">
	export let href: string | undefined = undefined;
	export let type: string | undefined = 'button';
</script>

<svelte:element
	this={href ? 'a' : 'button'}
	type={href ? undefined : type}
	{href}
	on:click
	on:change
	on:keydown
	on:keyup
	on:mouseenter
	on:mouseleave
	tabindex="0"
	role="button"
	class="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 inline-flex items-center gap-x-1.5"
>
	<slot />
</svelte:element>
