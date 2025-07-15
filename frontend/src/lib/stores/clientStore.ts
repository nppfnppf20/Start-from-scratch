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