<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { loadConfig } from '$lib/config';
	import Button from '$lib/components/Button.svelte';
	import GoogleIcon from '$lib/components/icons/google.svelte';
	import { goto } from '$app/navigation';

	let container: HTMLDivElement;
	let googleBtn: HTMLDivElement;
	let didLoad = writable(false);

	export let data;

	const ingestGSIScript = () => {
		const script = document.createElement('script');
		script.src = 'https://accounts.google.com/gsi/client';
		script.onload = () => didLoad.set(true);
		document.body.appendChild(script);
	};

	onMount(() => {
		if (!data.session) {
			didLoad.subscribe(async (loaded) => loaded && (await renderHiddenGoogleAuthBtn()));
			ingestGSIScript();
		}
	});

	const renderHiddenGoogleAuthBtn = async () => {
		// https://stackoverflow.com/questions/70993933/why-does-the-sign-in-with-google-button-disappear-after-i-render-it-the-second-t
		if (window.google && container) {
			const _config = await loadConfig();
			window.google.accounts.id.initialize({
				client_id: _config.google.clientID,
				login_uri: _config.google.authCallbackURL,
				ux_mode: 'redirect',
				context: 'signup'
			});

			window.google.accounts.id.renderButton(container, {
				theme: 'outline',
				size: 'large',
				type: 'standard',
				text: 'signup_with',
				logo_alignment: 'left',
				shape: 'rectangular'
			});

			googleBtn = container.querySelector('div[role=button]') as HTMLDivElement;
		}
	};

	const onClick = () => {
		if (data.session) goto('/dashboard'); // skip authentication for authenticated users
		return googleBtn?.click();
	};
</script>

<div class="w-full h-full">
	<div class="flex flex-col items-center justify-center h-screen">
		<div bind:this={container} class="hidden" />
		<Button on:click={onClick}><GoogleIcon /> Continue with Google</Button>
	</div>
</div>
