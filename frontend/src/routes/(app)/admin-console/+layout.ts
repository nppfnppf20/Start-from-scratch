import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async () => {
    // All authenticated users can access admin console now
    return {};
}; 