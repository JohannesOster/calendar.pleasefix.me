export const randomStr = () => Math.random().toString(36).slice(2, 7);

export const daysToSeconds = (days: number) => days * 24 * 60 * 60;

import { error } from '@sveltejs/kit';

export function assertValue<T>(value: T, errorMessage: string) {
	if (value) return value;
	error(400, errorMessage);
}
