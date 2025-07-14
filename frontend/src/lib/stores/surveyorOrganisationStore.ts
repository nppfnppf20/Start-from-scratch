import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { getAuthTokenHeader } from './authStore';

// Define the base URL for your API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// --- Helper Function to map _id to id ---
function mapMongoId<T>(item: any): T {
  if (!item || typeof item !== 'object') return item;

  // Handle arrays
  if (Array.isArray(item)) {
    return item.map(mapMongoId) as unknown as T;
  }

  // Handle single objects
  const newItem: any = {};
  let idFieldSet = false;
  for (const key in item) {
      if (Object.prototype.hasOwnProperty.call(item, key)) {
          if (key === '_id' && item._id != null) {
              newItem['id'] = item._id.toString();
              idFieldSet = true;
          } else if (typeof item[key] === 'object' && item[key] !== null) {
              newItem[key] = mapMongoId(item[key]);
          } else {
              newItem[key] = item[key];
          }
      }
  }
  
  if (item._id != null && !idFieldSet) {
      newItem.id = item._id.toString();
  } else if (item._id != null && newItem.id == null) {
      newItem.id = item._id.toString();
  }

  return newItem as T;
}

// --- Surveyor Organisation Interface ---
export interface SurveyorOrganisation {
  id: string; // Mapped from _id
  organisation: string;
  discipline: string;
  contacts: {
    contactName?: string;
    email?: string;
    phoneNumber?: string;
  }[];
  projectCount: number;
  reviewCount: number;
  totalQuality: number;
  totalResponsiveness: number;
  totalDeliveredOnTime: number;
  totalOverallReview: number;
  // Virtual fields computed by backend
  averageQuality?: number;
  averageResponsiveness?: number;
  averageDeliveredOnTime?: number;
  averageOverallReview?: number;
  createdAt?: string;
  updatedAt?: string;
}

// --- Store ---
export const surveyorOrganisations = writable<SurveyorOrganisation[]>([]);

// --- API Functions ---

// Function to load all surveyor organisations
export async function loadSurveyorOrganisations(): Promise<SurveyorOrganisation[]> {
  if (!browser) return [];

  try {
    console.log('Fetching surveyor organisations...');
    const response = await fetch(`${API_BASE_URL}/surveyor-organisations`, {
      headers: getAuthTokenHeader()
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP error! status: ${response.status} - ${errorData.msg || 'Failed to fetch surveyor organisations'}`);
    }
    
    let organisations: any[] = await response.json();
    
    // Map _id to id and ensure virtual fields are included
    const mappedOrganisations = organisations.map(org => mapMongoId<SurveyorOrganisation>(org));
    
    console.log('Surveyor organisations loaded:', mappedOrganisations);
    surveyorOrganisations.set(mappedOrganisations);
    
    return mappedOrganisations;
    
  } catch (error) {
    console.error('Failed to load surveyor organisations:', error);
    surveyorOrganisations.set([]);
    return [];
  }
}

// Function to add a new surveyor organisation
export async function addSurveyorOrganisation(orgData: {
  organisation: string;
  discipline: string;
  contacts?: SurveyorOrganisation['contacts'];
}): Promise<SurveyorOrganisation | null> {
  if (!browser) return null;

  try {
    console.log('Adding surveyor organisation:', orgData);
    const response = await fetch(`${API_BASE_URL}/surveyor-organisations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthTokenHeader()
      },
      body: JSON.stringify(orgData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessages = errorData.errors ? errorData.errors.join(', ') : (errorData.msg || 'Failed to add organisation');
      throw new Error(`HTTP error! status: ${response.status} - ${errorMessages}`);
    }

    let newOrganisation: any = await response.json();
    const mappedOrganisation = mapMongoId<SurveyorOrganisation>(newOrganisation);

    // Update the local store
    surveyorOrganisations.update(orgs => [...orgs, mappedOrganisation]);

    console.log('Surveyor organisation added:', mappedOrganisation);
    return mappedOrganisation;

  } catch (error) {
    console.error('Failed to add surveyor organisation:', error);
    console.error('🚨 FULL ERROR DETAILS:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    alert(`Error adding organisation: ${error}`);
    return null;
  }
}

// Function to update a surveyor organisation
export async function updateSurveyorOrganisation(
  orgId: string,
  updateData: Partial<Pick<SurveyorOrganisation, 'organisation' | 'discipline' | 'contacts'>>
): Promise<boolean> {
  if (!browser) return false;

  try {
    console.log('Updating surveyor organisation:', orgId, updateData);
    const response = await fetch(`${API_BASE_URL}/surveyor-organisations/${orgId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthTokenHeader()
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP error! status: ${response.status} - ${errorData.msg || 'Failed to update organisation'}`);
    }

    let updatedOrganisation: any = await response.json();
    const mappedOrganisation = mapMongoId<SurveyorOrganisation>(updatedOrganisation);

    // Update the local store
    surveyorOrganisations.update(orgs => 
      orgs.map(org => (org.id === orgId ? mappedOrganisation : org))
    );

    console.log('Surveyor organisation updated:', mappedOrganisation);
    return true;

  } catch (error) {
    console.error('Failed to update surveyor organisation:', error);
    alert(`Error updating organisation: ${error}`);
    return false;
  }
}

// Function to delete a surveyor organisation
export async function deleteSurveyorOrganisation(orgId: string): Promise<boolean> {
  if (!browser) return false;

  try {
    console.log('Deleting surveyor organisation:', orgId);
    const response = await fetch(`${API_BASE_URL}/surveyor-organisations/${orgId}`, {
      method: 'DELETE',
      headers: getAuthTokenHeader()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP error! status: ${response.status} - ${errorData.msg || 'Failed to delete organisation'}`);
    }

    // Update the local store
    surveyorOrganisations.update(orgs => orgs.filter(org => org.id !== orgId));

    console.log('Surveyor organisation deleted successfully');
    return true;

  } catch (error) {
    console.error('Failed to delete surveyor organisation:', error);
    alert(`Error deleting organisation: ${error}`);
    return false;
  }
}