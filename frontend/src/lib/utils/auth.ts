// Auth utility functions for Auth0 integration

export function getUserRole(user: any): string {
    if (!user) return 'surveyor';
    
    // Check Auth0 custom claims first
    const customRoles = user['https://your-app/roles'] || user.roles || [];
    if (customRoles.includes('admin')) return 'admin';
    if (customRoles.includes('client')) return 'client';
    if (customRoles.includes('surveyor')) return 'surveyor';
    
    // Fallback to email-based determination
    const email = user.email || '';
    const adminEmails = import.meta.env?.VITE_ADMIN_EMAILS?.split(',') || [];
    return adminEmails.includes(email.toLowerCase()) ? 'admin' : 'surveyor';
}
