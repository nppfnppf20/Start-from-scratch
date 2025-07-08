<script lang="ts">
    import ClientTable from '$lib/components/ClientTable.svelte';
	import type { Client } from '$lib/stores/projectStore';

    // New mock data structure matching the Client interface
	const mockClientData: Client[] = [
		{
			id: 'client-1',
			organisation: 'Global Build Inc.',
			industry: 'Primary Client',
			contacts: [{ name: 'Jane Smith', email: 'jane.s@globalbuild.com', phoneNumber: '555-0101' }],
			totalProjects: 2,
			projectNames: ['Project Alpha', 'Project Beta']
		},
		{
			id: 'client-2',
			organisation: 'Future Homes Ltd.',
			industry: 'Residential Developer',
			contacts: [{ name: 'Mark Johnson', email: 'mark.j@futurehomes.com', phoneNumber: '555-0102' }],
			totalProjects: 1,
			projectNames: ['The Grand Development']
		},
        {
			id: 'client-3',
			organisation: 'Renewable Ventures',
			industry: 'Funding Partner',
			contacts: [{ name: 'Sarah Lee', email: 's.lee@renewable.vc', phoneNumber: '555-0103' }],
			totalProjects: 3,
			projectNames: ['Solar Farm Initiative', 'Wind Turbine Array', 'Hydro Project']
		}
	];
</script>

<svelte:head>
    <title>Admin - Clients</title>
</svelte:head>

<div class="p-8">
    <div class="page-header">
        <h1 class="text-2xl font-bold">Clients</h1>
        <p class="mt-2 text-gray-600">A central list of all clients across all projects.</p>
    </div>

    <div class="mt-8">
        <ClientTable clients={mockClientData} />
    </div>
</div>

<style>
    .page-header {
      margin-bottom: 2rem;
    }
</style> 