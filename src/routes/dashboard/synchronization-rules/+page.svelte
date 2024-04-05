<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import GoogleIcon from '$lib/components/icons/google.svelte';
	import type { Calendar } from '$lib/domain/types';

	export let data;

	type CalendarMap = {
		[calendarId: string]: { calendar: Calendar; account: (typeof data.connectedAccounts)[0] };
	};
	const calendarMap = data.connectedAccounts.reduce((acc, account) => {
		account.calendars.forEach((calendar) => (acc[calendar.calendarId] = { calendar, account }));
		return acc;
	}, {} as CalendarMap);

	const syncRules = data.syncRules.map((syncRule) => {
		const { calendar: sourceCalendar, account: sourceAccount } =
			calendarMap[syncRule.sourceCalendarId];
		const { calendar: targetCalendar, account: targetAcccount } =
			calendarMap[syncRule.targetCalendarId];
		return { ...syncRule, sourceCalendar, sourceAccount, targetCalendar, targetAcccount };
	});
</script>

<section>
	<div class="flex w-full justify-between">
		<h1 class="text-xl">Calendar Accounts</h1>
		<div>
			<Button href={'/dashboard/synchronization-rules/create'}>Add</Button>
		</div>
	</div>
	<ul class="mt-10">
		{#each syncRules as syncRule}
			<li class="flex items-center justify-between">
				<div class="flex items-center gap-x-4">
					<span class="flex gap-x-1 items-center">
						{#if syncRule.sourceAccount.provider === 'google'}
							<GoogleIcon />
						{/if}
						{syncRule.sourceAccount.email}
					</span>
					<span class="flex gap-x-1 items-center">
						<span
							class={`inline-block h-4 w-4 flex-shrink-0 rounded-sm`}
							style={`background-color: ${syncRule.sourceCalendar.color}`}
							aria-hidden="true"
						/>
						{syncRule.sourceCalendar.title}
					</span>
				</div>
				--->
				<div class="flex items-center gap-x-4">
					<span class="flex gap-x-1 items-center">
						{#if syncRule.targetAcccount.provider === 'google'}
							<GoogleIcon />
						{/if}
						{syncRule.targetAcccount.email}
					</span>
					<span class="flex gap-x-1 items-center">
						<span
							class={`inline-block h-4 w-4 flex-shrink-0 rounded-sm`}
							style={`background-color: ${syncRule.targetCalendar.color}`}
							aria-hidden="true"
						/>
						{syncRule.targetCalendar.title}
					</span>
				</div>
			</li>
		{/each}
	</ul>
</section>
