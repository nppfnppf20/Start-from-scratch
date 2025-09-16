import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals }) => {
    const user = (locals as any).user;
    if (!user) throw redirect(302, '/auth/login');
    if (user.role !== 'surveyor' && user.role !== 'admin') throw redirect(302, '/');
    return { user };
};


