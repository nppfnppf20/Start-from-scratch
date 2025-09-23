<script lang="ts">
    import "../../app.css";
    import TopBar from "$lib/components/TopBar.svelte";
    import ProjectSelector from "$lib/components/ProjectSelector.svelte";
    import TabNav from "$lib/components/TabNav.svelte";
    import { selectedProject, loadProjects } from "$lib/stores/projectStore";
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { auth0Store } from '$lib/stores/auth0Store';
    import { goto } from '$app/navigation';
    import { browser } from '$app/environment';
    import { get } from 'svelte/store';

    // SPA mode - handle authentication client-side
    $: if (browser && !$auth0Store.isLoading) {
        const isAuthRoute = $page.url.pathname.startsWith('/auth/');
        
        if (!$auth0Store.isAuthenticated && !isAuthRoute) {
            console.log('Not authenticated, redirecting to login');
            // Immediate redirect - no waiting
            goto('/auth/login', { replaceState: true });
        } else if ($auth0Store.isAuthenticated) {
            console.log('Authenticated, loading projects');
            loadProjects().catch(error => {
                console.error('Failed to load projects:', error);
                if (error.message.includes('403')) {
                    auth0Store.logout();
                }
            });
        }
    }

    // Removed FullCalendar CSS imports from here

</script>

{#if $auth0Store.isLoading}
    <!-- Show loading state while Auth0 initializes -->
    <div class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading...</p>
    </div>
{:else if $auth0Store.isAuthenticated}
    <!-- Show app when authenticated -->
    <div class="app">
        <TopBar />
        <header>
            <ProjectSelector />
            <TabNav />
        </header>

        <main>
            {#if $selectedProject || $page.url.pathname.startsWith('/fee-quote-submission')}
                <slot />
            {:else}
                <div class="no-project-selected">
                    <h2>No Project Selected</h2>
                    <p>General project information is hidden until you select a project from the dropdown above.</p>
                </div>
            {/if}
        </main>

        <footer>
            <p>Projects Overview Dashboard</p>
        </footer>
    </div>
{:else}
    <!-- Show minimal loading while redirect happens -->
    <div class="loading-container">
        <div class="loading-spinner"></div>
    </div>
{/if}

<style>
    .app {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
    }

    main {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 1rem;
        width: 100%;
        box-sizing: border-box;
        overflow-y: auto;
        background-color: var(--background-color);
        position: relative;
        /* Windows scrolling optimizations */
        overflow-anchor: auto;
        overscroll-behavior: contain;
        will-change: scroll-position;
    }

    header {
        width: 100%;
        overflow: visible;
        position: relative;
    }

    footer {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 12px;
        background-color: #f0f0f0;
        border-top: 1px solid #ccc;
        margin-top: 2rem;
    }

    .no-project-selected {
        text-align: center;
        margin: 2rem auto;
        padding: 2rem;
        background-color: #f8f9fa;
        border-radius: 0.5rem;
        border: 1px solid #dee2e6;
    }

    @media (min-width: 480px) {
        footer {
            padding: 12px 0;
        }
    }

    /* Loading and redirect states */
    .loading-container,
    .redirecting-container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background-color: #f8f9fa;
    }

    .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #e2e8f0;
        border-top: 4px solid #3182ce;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 1rem;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .loading-container p,
    .redirecting-container p {
        color: #4a5568;
        font-size: 1.1rem;
        margin: 0;
    }
</style> 