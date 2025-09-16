// src/authService.js

import { createAuth0Client } from "@auth0/auth0-spa-js";
import { user, isAuthenticated, popupOpen, error } from "./store";
import config from "./auth_config";

async function createClient() {
  let auth0Client = await createAuth0Client({
    domain: config.domain,
    clientId: config.clientId,
    authorizationParams: {
      audience: config.audience
    }
  });

  return auth0Client;
}

async function loginWithPopup(client, options) {
  popupOpen.set(true);
  try {
    await client.loginWithPopup(options);

    user.set(await client.getUser());
    isAuthenticated.set(true);
    error.set(null);
  } catch (e) {
    console.error('Login error:', e);
    error.set(e.message || 'Login failed');
  } finally {
    popupOpen.set(false);
  }
}

// Initialize authentication state
async function initializeAuth(client) {
  try {
    const isAuth0Authenticated = await client.isAuthenticated();

    if (isAuth0Authenticated) {
      const auth0User = await client.getUser();
      user.set(auth0User);
      isAuthenticated.set(true);
    }
  } catch (error) {
    console.error('Auth initialization error:', error);
  }
}

function logout(client) {
  // Clear state
  user.set({});
  isAuthenticated.set(false);

  // Logout from Auth0
  return client.logout({
    logoutParams: {
      returnTo: window.location.origin
    }
  });
}

const auth = {
  createClient,
  loginWithPopup,
  logout,
  initializeAuth
};

export default auth;