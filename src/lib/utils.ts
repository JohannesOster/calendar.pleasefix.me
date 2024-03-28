export const randomStr = () => Math.random().toString(36).slice(2, 7);

export const daysToSeconds = (days: number) => days * 24 * 60 * 60;
export const hoursToMilliseconds = (hours: number) => hours * 60 * 60 * 1000;

import { error } from '@sveltejs/kit';

export function assertValue<T>(value: T, errorMessage: string) {
	if (value) return value;
	error(400, errorMessage);
}

export const parseNestedObject = <T>(data: { key: string; value: any }[]) => {
	const result = {} as { [key: string]: any };

	data.forEach(({ key, value }) => {
		const parts = key.split('.');
		let currentLevel = result;

		for (let i = 0; i < parts.length; i++) {
			const part = parts[i];

			// If it's the last part, assign the value
			if (i === parts.length - 1) currentLevel[part] = value;
			else {
				// Create a new object if it doesn't exist
				if (!currentLevel[part]) currentLevel[part] = {};
				// Move to the next level of the object
				currentLevel = currentLevel[part];
			}
		}
	});

	// Quick-fix to remove necessaity of type casting on every function call
	return result as any as T;
};
