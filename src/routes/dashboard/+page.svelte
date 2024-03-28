<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import GoogleIcon from '$lib/components/icons/google.svelte';

	export let data;
</script>

<section>
	<div class="flex w-full justify-between">
		<h1 class="text-xl">Calendar Accounts</h1>
		<div>
			<Button as={'a'} href={data.googleAuthorizationURL}>
				<GoogleIcon /> Connect Google Account
			</Button>
		</div>
	</div>
	<ul>
		<ul>
			{#each data.connectedAccounts as account}
				<li class="flex gap-x-2 items-center">
					{#if account.provider === 'google'}
						<GoogleIcon />
					{/if}
					{account.email}
				</li>
			{/each}
		</ul>
	</ul>
</section>
