# Auth0 Full Implementation Setup

## Required Environment Variables

### Frontend (.env file in frontend/ directory)
```
PUBLIC_AUTH0_DOMAIN=dev-xppcpnbe4k8qmvmf.uk.auth0.com
PUBLIC_AUTH0_CLIENT_ID=aDaxa5lTp2eQrLMm00qtntf6Glnb0qhU
PUBLIC_AUTH0_AUDIENCE=https://trpdashboard.co.uk/api
VITE_API_BASE_URL=http://localhost:5000
```

### Backend (.env file in backend/ directory)
```
AUTH0_DOMAIN=dev-xppcpnbe4k8qmvmf.uk.auth0.com
AUTH0_AUDIENCE=https://trpdashboard.co.uk/api
MONGO_URI=your_mongo_uri
ADMIN_EMAILS=admin@example.com,another@admin.com
```

## Auth0 Dashboard Settings

### Application Settings
- Application Type: Single Page Application
- Allowed Callback URLs: `http://localhost:5173/auth/callback`
- Allowed Logout URLs: `http://localhost:5173/`
- Allowed Web Origins: `http://localhost:5173`

### API Settings
- Create API with Identifier: `https://trpdashboard.co.uk/api`
- Enable RBAC: Yes (optional, for roles)
- Add Permissions in Access Token: Yes (optional, for roles)

## How Authentication Works Now

1. User visits any protected route → redirected to `/auth/login`
2. `/auth/login` → redirects to Auth0
3. Auth0 → redirects back to `/auth/callback`
4. Callback gets Access Token and stores in memory
5. All API calls use `Authorization: Bearer <access_token>`
6. Backend verifies tokens against Auth0 JWKS
7. Backend maps Auth0 user to local User model with roles

## Role Mapping

Roles are determined in this order:
1. Auth0 custom claims: `user['https://your-app/roles']`
2. Fallback to email-based admin check (ADMIN_EMAILS env var)
3. Default: 'surveyor'

## Testing

1. Start backend: `cd "start from scratch backend" && npm run dev`
2. Start frontend: `cd frontend && npm run dev`  
3. Visit `http://localhost:5173`
4. You should be redirected to Auth0, then back to the app
5. Check browser console for any errors
6. Check Network tab that API calls include `Authorization: Bearer ...`

## Troubleshooting

- If redirect loop: Check that AUTH0_DOMAIN is set in backend
- If 401 errors: Check that AUTH0_AUDIENCE matches in both frontend and backend
- If roles wrong: Check ADMIN_EMAILS or set up Auth0 roles properly
