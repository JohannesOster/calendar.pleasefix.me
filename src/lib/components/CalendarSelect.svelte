<script lang="ts">
	import { onMount, type SvelteComponent } from 'svelte';

	type Account = {
		id: string;
		email: string;
		providerIcon: typeof SvelteComponent;
		calendars: Calendar[];
	};

	type Calendar = {
		id: string;
		name: string;
		calendarColor: string;
	};

	export let id = '';
	export let name: string | undefined = undefined;
	export let accounts: Account[];
	export let selected = accounts[0]?.calendars[0];

	let isOpen = false;
	let ignoreBlur = false;
	let accountIdInputElement: HTMLInputElement;
	let calendarIdInputElement: HTMLInputElement;

	const calendarAccountMap = accounts.reduce(
		(acc, curr) => {
			curr.calendars.forEach((calendar) => (acc[calendar.id] = curr));
			return acc;
		},
		{} as { [key: string]: Account }
	);

	const selectOption = (option: any) => {
		selected = option;
		accountIdInputElement.value = calendarAccountMap[option.id].id;
		calendarIdInputElement.value = option.id;
		isOpen = false;
	};

	const onFocus = (e: FocusEvent) => {
		ignoreBlur = false;
		isOpen = true;
	};

	const onBlur = (e: FocusEvent) => {
		if (ignoreBlur) return;
		isOpen = false;
	};

	const onKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
			e.preventDefault();
			isOpen = true;
		}
	};

	onMount(() => {
		accountIdInputElement.value = calendarAccountMap[selected?.id]?.id;
		calendarIdInputElement.value = selected?.id;
	});
</script>

<div class="relative mt-2">
	<input type="hidden" bind:this={accountIdInputElement} name={`${name}.accountId`} />
	<input type="hidden" bind:this={calendarIdInputElement} name={`${name}.calendarId`} />
	<div
		{id}
		on:focus={onFocus}
		on:blur={onBlur}
		on:keydown={onKeyDown}
		class="relative w-full cursor-pointer rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm sm:leading-6"
		role="combobox"
		aria-haspopup="listbox"
		aria-labelledby="listbox-label"
		aria-expanded={isOpen}
		aria-controls="listbox"
		tabindex="0"
	>
		<span class="inline-flex w-full items-center gap-x-2 truncate">
			{#if selected}
				<span
					class={`inline-block h-4 w-4 flex-shrink-0 rounded-sm`}
					style={`background-color: ${selected.calendarColor}`}
					aria-hidden="true"
				/>
				<span class="truncate">{selected.name}</span>
				<svelte:component this={calendarAccountMap[selected?.id].providerIcon} />
				<span class="truncate text-gray-500">{calendarAccountMap[selected.id].email}</span>
			{/if}
		</span>
		<span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
			<svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
				<path
					fill-rule="evenodd"
					d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z"
					clip-rule="evenodd"
				/>
			</svg>
		</span>
	</div>

	{#if isOpen}
		<ul
			class="absolute z-10 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
			tabindex="-1"
			role="listbox"
			aria-labelledby="listbox-label"
			aria-activedescendant="listbox-option-3"
		>
			{#each accounts as account}
				<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
				<li
					class="text-gray-500 truncate pl-3 pr-9 py-2 font-semibold inline-flex gap-x-2 items-center mt-2"
					on:mousedown={() => (ignoreBlur = true)}
				>
					<svelte:component this={account.providerIcon} />
					{account.email}
				</li>

				{#each account.calendars as calendar (calendar.id)}
					<li
						on:click={() => selectOption(calendar)}
						on:keydown={() => {}}
						on:mousedown={() => (ignoreBlur = true)}
						role="option"
						aria-selected={selected.id === calendar.id}
						class="text-gray-900 cursor-pointer relative select-none py-2 pl-3 pr-9 hover:bg-slate-50"
					>
						<div class="flex items-center gap-x-2">
							<span
								class={`inline-block h-4 w-4 flex-shrink-0 rounded-sm`}
								style={`background-color: ${calendar.calendarColor}`}
								aria-hidden="true"
							/>
							<span
								class={`${selected.id === calendar.id ? 'font-semibold' : 'font-normal'} truncate`}
								>{calendar.name}</span
							>
						</div>

						{#if calendar.id == selected.id}
							<span class="text-indigo-600 absolute inset-y-0 right-0 flex items-center pr-4">
								<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
									<path
										fill-rule="evenodd"
										d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
										clip-rule="evenodd"
									/>
								</svg>
							</span>
						{/if}
					</li>
				{/each}
			{/each}
		</ul>
	{/if}
</div>
