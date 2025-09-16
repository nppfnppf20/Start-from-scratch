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

    onMount(async () => {
        if (browser) {
            const { isAuthenticated, isLoading } = get(auth0Store);
            if (!isLoading && isAuthenticated) {
                await loadProjects();
            }
        }
    });

    // Removed FullCalendar CSS imports from here

</script>

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
</style> 