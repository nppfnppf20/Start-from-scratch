<script lang="ts">
    import "../app.css";
    import ProjectSelector from "$lib/components/ProjectSelector.svelte";
    import TabNav from "$lib/components/TabNav.svelte";
    import { selectedProject } from "$lib/stores/projectStore";

    // Removed FullCalendar CSS imports from here

</script>

<div class="app">
    <header>
        <ProjectSelector />
        <TabNav />
    </header>

    <main>
        {#if $selectedProject}
            <slot />
        {:else}
            <div class="no-project-selected">
                <h2>No Project Selected</h2>
                <p>Please select a project from the dropdown above to continue.</p>
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
        max-width: 64rem;
        margin: 0 auto;
        box-sizing: border-box;
    }

    header {
        width: 100%;
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