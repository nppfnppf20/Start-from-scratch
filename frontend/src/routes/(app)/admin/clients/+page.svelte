<script lang="ts">
	import { onMount } from 'svelte';
	import ClientTable from '$lib/components/ClientTable.svelte';
	import { clients, loadClients } from '$lib/stores/projectStore';

	let isLoading = true;
	let error: string | null = null;

	// --- Modal State ---
	let showAddClientModal = false;
	let newClient = {
		organisation: '',
		industry: '',
		contacts: [{ name: '', email: '', phoneNumber: '' }]
	};
	let isSubmitting = false;
	let submissionError: string | null = null;

	onMount(async () => {
		try {
			await loadClients();
		} catch (e: any) {
			error = e.message;
		} finally {
			isLoading = false;
		}
	});

	// --- Form Handlers ---
	function openAddClientModal() {
		showAddClientModal = true;
		submissionError = null;
		// Reset form
		newClient = {
			organisation: '',
			industry: '',
			contacts: [{ name: '', email: '', phoneNumber: '' }]
		};
	}

	function addContact() {
		newClient.contacts = [...newClient.contacts, { name: '', email: '', phoneNumber: '' }];
	}

	function removeContact(index: number) {
		if (newClient.contacts.length > 1) {
			newClient.contacts = newClient.contacts.filter((_, i) => i !== index);
		}
	}

	async function handleAddClient() {
		isSubmitting = true;
		submissionError = null;

		try {
			// Filter out empty contacts before submitting
			const clientData = {
				...newClient,
				contacts: newClient.contacts.filter(c => c.name.trim() !== '')
			};

			const response = await fetch('/api/clients', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...getAuthTokenHeader() // Assuming you have this helper from another store
				},
				body: JSON.stringify(clientData)
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.msg || `HTTP error! status: ${response.status}`);
			}
			
			showAddClientModal = false;
			await loadClients(); // Refresh the list

		} catch (err: any) {
			submissionError = err.message;
		} finally {
			isSubmitting = false;
		}
	}

	// Need to import this helper function
	import { getAuthTokenHeader } from '$lib/stores/authStore';
</script>

<svelte:head>
	<title>Admin - Clients</title>
</svelte:head>

<div class="p-8">
	<div class="page-header">
		<h1 class="text-2xl font-bold">Clients</h1>
        <div class="flex-1">
		    <p class="mt-2 text-gray-600">A central list of all clients across all projects.</p>
        </div>
        <button on:click={openAddClientModal} class="add-button">Add New Client</button>
	</div>

	<div class="mt-8">
		{#if isLoading}
			<div class="loading-state">
				<p>Loading clients...</p>
			</div>
		{:else if error}
			<p class="text-red-500">Error loading data: {error}</p>
		{:else if $clients.length === 0}
			<div class="empty-state">
				<p>No clients found. Add one to get started.</p>
			</div>
		{:else}
			<ClientTable clients={$clients} />
		{/if}
	</div>
</div>

<!-- Add Client Modal -->
{#if showAddClientModal}
<div class="modal-backdrop" on:click={() => showAddClientModal = false}>
    <div class="modal-content" on:click|stopPropagation>
        <form on:submit|preventDefault={handleAddClient}>
            <h3 class="modal-header">Add New Client</h3>
            
            <div class="modal-body">
                <div class="form-group">
                    <label for="organisation">Organisation Name</label>
                    <input type="text" id="organisation" required bind:value={newClient.organisation}>
                </div>
                <div class="form-group">
                    <label for="industry">Industry</label>
                    <input type="text" id="industry" required bind:value={newClient.industry}>
                </div>

                <h4 class="contacts-header">Contacts</h4>
                {#each newClient.contacts as contact, i}
                    <div class="contact-entry">
                        <div class="form-group">
                            <label for="contact-name-{i}">Contact Name</label>
                            <input type="text" id="contact-name-{i}" bind:value={contact.name}>
                        </div>
                        <div class="form-group">
                            <label for="contact-email-{i}">Email</label>
                            <input type="email" id="contact-email-{i}" bind:value={contact.email}>
                        </div>
                        <div class="form-group">
                            <label for="contact-phone-{i}">Phone Number</label>
                            <input type="tel" id="contact-phone-{i}" bind:value={contact.phoneNumber}>
                        </div>
                        {#if newClient.contacts.length > 1}
                            <button type="button" on:click={() => removeContact(i)} class="remove-contact-btn">&times;</button>
                        {/if}
                    </div>
                {/each}
                <button type="button" on:click={addContact} class="add-contact-btn">+ Add another contact</button>

                {#if submissionError}
                    <p class="error-message">{submissionError}</p>
                {/if}
            </div>

            <div class="modal-footer">
                <button type="button" class="cancel-btn" on:click={() => showAddClientModal = false}>Cancel</button>
                <button type="submit" class="submit-btn" disabled={isSubmitting}>
                    {isSubmitting ? 'Adding...' : 'Add Client'}
                </button>
            </div>
        </form>
    </div>
</div>
{/if}

<style>
	.page-header {
		margin-bottom: 2rem;
        display: flex;
        align-items: center;
        gap: 1rem;
	}
    .add-button {
        padding: 0.5rem 1rem;
        font-weight: 500;
        background-color: #3182ce;
        color: white;
        border-radius: 6px;
        border: none;
        cursor: pointer;
        transition: background-color 0.2s;
        white-space: nowrap;
    }
    .add-button:hover {
        background-color: #2b6cb0;
    }

	.loading-state,
	.empty-state {
		padding: 2rem;
		background-color: #f7fafc;
		border: 1px dashed #cbd5e0;
		border-radius: 6px;
		text-align: center;
		color: #a0aec0;
	}

    /* Modal Styles */
    .modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}
	.modal-content {
		background: white;
		border-radius: 8px;
		box-shadow: 0 10px 25px rgba(0,0,0,0.1);
		width: 90%;
		max-width: 500px;
        overflow: hidden;
	}
    .modal-header {
		font-size: 1.25rem;
		font-weight: 600;
        padding: 1rem 1.5rem;
        border-bottom: 1px solid #e2e8f0;
	}
    .modal-body {
		padding: 1.5rem;
        max-height: 70vh;
        overflow-y: auto;
	}
    .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        padding: 1rem 1.5rem;
        background-color: #f7fafc;
        border-top: 1px solid #e2e8f0;
    }
    .form-group {
        margin-bottom: 1rem;
    }
    .form-group label {
        display: block;
        margin-bottom: 0.25rem;
        font-size: 0.875rem;
        font-weight: 500;
        color: #4a5568;
    }
    .form-group input {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #cbd5e0;
        border-radius: 6px;
    }
    .contacts-header {
        font-weight: 600;
        margin-top: 2rem;
        margin-bottom: 1rem;
        border-top: 1px solid #e2e8f0;
        padding-top: 1rem;
    }
    .contact-entry {
        padding: 1rem;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        margin-bottom: 1rem;
        position: relative;
    }
    .remove-contact-btn {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        background: none;
        border: none;
        font-size: 1.5rem;
        line-height: 1;
        cursor: pointer;
        color: #a0aec0;
    }
    .remove-contact-btn:hover {
        color: #718096;
    }
    .add-contact-btn {
        background: none;
        border: 1px dashed #cbd5e0;
        color: #4a5568;
        width: 100%;
        padding: 0.5rem;
        border-radius: 6px;
        cursor: pointer;
    }
    .error-message {
        color: #e53e3e;
        font-size: 0.875rem;
        margin-top: 1rem;
    }
    .cancel-btn, .submit-btn {
        padding: 0.5rem 1rem;
        border-radius: 6px;
        border: 1px solid transparent;
        font-weight: 500;
        cursor: pointer;
    }
    .cancel-btn {
        background-color: #e2e8f0;
        border-color: #cbd5e0;
    }
    .submit-btn {
        background-color: #3182ce;
        color: white;
    }
    .submit-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
</style> 