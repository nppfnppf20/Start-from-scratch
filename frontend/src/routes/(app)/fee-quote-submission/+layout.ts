import type { LayoutLoad } from './$types';
import { requireAuth } from '$lib/auth-layout-helper';

export const load: LayoutLoad = async () => {
    return requireAuth(['admin']);
};
