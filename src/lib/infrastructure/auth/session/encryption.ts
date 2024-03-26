import { config } from '$lib/config';

const rawKey = Buffer.from(config.sessionEnryptionKey, 'base64');

export const encrypt = async (data: any) => {
	const encoder = new TextEncoder();
	const rawData = encoder.encode(JSON.stringify(data));

	const key = await crypto.subtle.importKey(
		'raw',
		rawKey,
		{ name: 'AES-GCM', length: 256 },
		false,
		['encrypt', 'decrypt']
	);

	const iv = crypto.getRandomValues(new Uint8Array(12));

	const encryptedData = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, rawData);

	const encryptedDataArray = new Uint8Array(encryptedData);
	const stringArray = Array.from(encryptedDataArray).map((byte) => String.fromCharCode(byte));
	const encryptedDataBase64 = btoa(stringArray.join(''));
	const ivArray = Array.from(iv).map((byte) => String.fromCharCode(byte));
	const ivBase64 = btoa(ivArray.join(''));

	return `${ivBase64}:${encryptedDataBase64}`;
};

export const decrypt = async (str: string) => {
	const [ivBase64, dataBase64] = str.split(':');

	const encryptedData = Buffer.from(dataBase64, 'base64');
	const iv = Buffer.from(ivBase64, 'base64');

	const key = await crypto.subtle.importKey(
		'raw',
		rawKey,
		{ name: 'AES-GCM', length: 256 },
		false,
		['encrypt', 'decrypt']
	);

	const encoded = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, encryptedData);

	return new TextDecoder().decode(encoded);
};
