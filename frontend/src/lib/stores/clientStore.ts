import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { getAuthTokenHeader } from './authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface Contact {
  contactName: string;
  email?: string;
  phoneNumber?: string;
}

export interface ClientOrganisation {
  id: string;
  organisationName: string;
  contacts: Contact[];
  projects: string[]; // We will populate this later
}

export const clientOrganisations = writable<ClientOrganisation[]>([]);

export async function loadClientOrganisations() {
  if (!browser) return;

  try {
    const response = await fetch(`${API_BASE_URL}/client-organisations`, {
      headers: getAuthTokenHeader(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch client organisations');
    }

    const data = await response.json();
    
    // Map _id to id and add a placeholder for projects
    const mappedData = data.map((org: any) => ({
      ...org,
      id: org._id,
      projects: [] // Start with an empty array for projects
    }));

    clientOrganisations.set(mappedData);

  } catch (error) {
    console.error('Error loading client organisations:', error);
    // Handle error in UI
  }
}

export async function addClientOrganisation(orgData: {
  organisationName: string;
  contacts?: Contact[];
}): Promise<ClientOrganisation | null> {
  if (!browser) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/client-organisations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthTokenHeader()
      },
      body: JSON.stringify(orgData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.msg || 'Failed to add organisation');
    }

    let newOrganisation: any = await response.json();
    const mappedOrganisation = {
      ...newOrganisation,
      id: newOrganisation._id,
      projects: []
    };

    clientOrganisations.update(orgs => [...orgs, mappedOrganisation]);

    return mappedOrganisation;

  } catch (error) {
    console.error('Failed to add client organisation:', error);
    alert(`Error adding organisation: ${error}`);
    return null;
  }
} 

export const updateClientOrganisation = async (clientData: ClientOrganisation) => {
  try {
    const response = await fetch(`${API_BASE_URL}/client-organisations/${clientData.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clientData)
    });
    if (!response.ok) throw new Error('Failed to update client organisation.');
    const updatedClient = await response.json();
    clientOrganisations.update(clients => {
      const index = clients.findIndex(c => c.id === updatedClient.id);
      if (index !== -1) {
        clients[index] = updatedClient;
      }
      return clients;
    });
    return updatedClient;
  } catch (error) {
    console.error('Error updating client organisation:', error);
    return null;
  }
}; 

export const deleteClientOrganisation = async (clientId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/client-organisations/${clientId}`, {
      method: 'DELETE',
      headers: getAuthTokenHeader()
    });
    if (!response.ok) {
      throw new Error('Failed to delete client organisation.');
    }
    clientOrganisations.update(clients => clients.filter(c => c.id !== clientId));
    return true;
  } catch (error) {
    console.error('Error deleting client organisation:', error);
    return false;
  }
}; 