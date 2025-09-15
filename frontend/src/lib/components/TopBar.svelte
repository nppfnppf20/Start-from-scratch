<script lang="ts">
  import { logout, userInfo } from '$lib/stores/auth0';

  function handleLogout() {
    logout();
  }
</script>

<div class="top-bar">
  <div class="app-title">
    <img src="/logo.png" alt="Logo" class="logo"/>
    <h1>TRP Project Management</h1>
  </div>
  <div class="user-section">
    {#if $userInfo}
      <div class="user-info">
        <span class="user-email">{$userInfo.email}</span>
        <span class="role-badge" class:admin={$userInfo.role === 'admin'} class:surveyor={$userInfo.role === 'surveyor'} class:client={$userInfo.role === 'client'}>
          {$userInfo.role}
        </span>
      </div>
      <button class="logout-btn" on:click={handleLogout}>
        Logout
      </button>
    {/if}
  </div>
</div>

<style>
  .top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1.5rem;
    background-color: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  }

  .app-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .logo {
    height: 32px;
    width: 32px;
  }

  .app-title h1 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 500;
    color: #1a202c;
  }

  .user-section {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .user-email {
    font-size: 0.9rem;
    color: #4a5568;
    font-weight: 500;
  }

  .role-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .role-badge.admin {
    background-color: #e6fffa;
    color: #234e52;
    border: 1px solid #81e6d9;
  }

  .role-badge.surveyor {
    background-color: #ebf4ff;
    color: #2c5282;
    border: 1px solid #90cdf4;
  }

  .role-badge.client {
    background-color: #f0fff4;
    color: #2f855a;
    border: 1px solid #9ae6b4;
  }

  .logout-btn {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    font-weight: 500;
    background-color: #e53e3e;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s ease-in-out;
  }

  .logout-btn:hover {
    background-color: #c53030;
  }

  .logout-btn:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.3);
  }

  /* Responsive design */
  @media (max-width: 640px) {
    .top-bar {
      padding: 0.5rem 1rem;
    }

    .app-title h1 {
      font-size: 1.25rem;
    }

    .user-info {
      flex-direction: column;
      align-items: flex-end;
      gap: 0.25rem;
    }

    .user-email {
      font-size: 0.8rem;
    }
  }
</style>