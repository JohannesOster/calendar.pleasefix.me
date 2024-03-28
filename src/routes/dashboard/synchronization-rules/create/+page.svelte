<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import CalendarSelect from '$lib/components/CalendarSelect.svelte';
	import GoogleIcon from '$lib/components/icons/google.svelte';
	import type { SvelteComponent } from 'svelte';

	export let data;
	export let form;

	const accounts = data.accounts.map((account) => ({
		id: account.id,
		email: account.email,
		providerIcon: GoogleIcon as unknown as typeof SvelteComponent,
		calendars: account.calendars.map((calendar) => ({
			id: calendar.calendarId,
			name: calendar.title,
			calendarColor: calendar.color
		}))
	}));
</script>

<div class="container px-4">
	<header class="py-4 fixed">
		<span class="uppercase font-medium text-text-brand">Logo</span>
	</header>
	<div class="flex flex-col gap-y-6 justify-end h-screen pb-32">
		<div class="flex flex-col gap-y-2">
			<h4>Create your first synchronization rule!</h4>
			<p>You can add, edit and remove synchronization rules later.</p>
		</div>
		<form class="flex flex-col gap-y-4" method="POST">
			<formgroup>
				<label for="source-calendar">Source Calendar</label>
				<CalendarSelect id="source-calendar" {accounts} name={'sourceCalendar'} />
			</formgroup>
			<formgroup>
				<label for="target-calendar">Target Calendar</label>
				<CalendarSelect id="target-calendar" {accounts} name={'targetCalendar'} />
			</formgroup>
			{#if form}<span class="font-red">{form?.message}</span>{/if}
			<Button>Abschließen</Button>
		</form>
	</div>
</div>
