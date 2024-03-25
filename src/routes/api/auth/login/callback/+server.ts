import { redirect } from '@sveltejs/kit';

export async function POST() {
	return redirect(302, '/dashboard');
}
