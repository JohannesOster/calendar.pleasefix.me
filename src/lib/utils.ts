export const randomStr = () => Math.random().toString(36).slice(2, 7);

export const daysToSeconds = (days: number) => days * 24 * 60 * 60;
