import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { getAuthTokenHeader } from './authHelpers';

// Define the base URL for your API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface Contact {
  contactName?: string;
  email?: string;
  phoneNumber?: string;
}

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
  contacts: Contact[];
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

export const deleteSurveyorOrganisation = async (organisationId: string) => {
    if (!browser) return;

    try {
        const response = await fetch(`${API_BASE_URL}/surveyor-organisations/${organisationId}`, {
            method: 'DELETE',
            headers: getAuthTokenHeader()
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.msg || 'Failed to delete surveyor organisation');
        }

        surveyorOrganisations.update(orgs => orgs.filter(org => org.id !== organisationId));

    } catch (err) {
        console.error('Failed to delete surveyor organisation:', err);
        throw err;
    }
};

// --- Pending Surveyor Functionality ---

// --- Pending Surveyor Interface (matches backend model) ---
export interface PendingSurveyor {
  id: string; // Mapped from _id
  organisation: string;
  discipline: string;
  status: 'pending' | 'approved' | 'merged' | 'rejected';
  sourceQuoteId: string;
  sourceQuoteData?: {
    contactName?: string;
    email?: string;
    phoneNumber?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

// --- Store for Pending Surveyors ---
export const pendingSurveyors = writable<PendingSurveyor[]>([]);

// --- API Functions for Pending Surveyors ---

// Function to load all pending surveyors
export async function loadPendingSurveyors(): Promise<void> {
  if (!browser) return;

  try {
    const response = await fetch(`${API_BASE_URL}/pending-surveyors`, {
      headers: getAuthTokenHeader()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    let data: any[] = await response.json();
    const mappedData = data.map(item => mapMongoId<PendingSurveyor>(item));
    pendingSurveyors.set(mappedData);
  } catch (error) {
    console.error("Failed to load pending surveyors:", error);
    pendingSurveyors.set([]);
  }
}

// Function to approve a pending surveyor
export async function approvePendingSurveyor(pendingId: string): Promise<boolean> {
  if (!browser) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/pending-surveyors/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthTokenHeader()
      },
      body: JSON.stringify({ pendingId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || 'Failed to approve surveyor');
    }
    
    // On success, remove from the local pending store
    pendingSurveyors.update(current => current.filter(p => p.id !== pendingId));
    // And refresh the main surveyor list to include the new one
    await loadSurveyorOrganisations(); 
    return true;

  } catch (error) {
    console.error("Error approving pending surveyor:", error);
    alert(`Approval failed: ${error}`);
    return false;
  }
}

// Function to merge a pending surveyor
export async function mergePendingSurveyor(pendingId: string, targetId: string): Promise<boolean> {
  if (!browser) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/pending-surveyors/merge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthTokenHeader()
      },
      body: JSON.stringify({ pendingId, targetId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || 'Failed to merge surveyor');
    }
    
    const { updatedSurveyor } = await response.json();

    // On success, remove from the pending list
    pendingSurveyors.update(current => current.filter(p => p.id !== pendingId));
    
    // And update the specific organisation in the main list
    if (updatedSurveyor) {
      const mappedSurveyor = mapMongoId<SurveyorOrganisation>(updatedSurveyor);
      surveyorOrganisations.update(orgs => 
        orgs.map(org => (org.id === mappedSurveyor.id ? mappedSurveyor : org))
      );
    }
    
    return true;

  } catch (error) {
    console.error("Error merging pending surveyor:", error);
    alert(`Merge failed: ${error}`);
    return false;
  }
}

// Function to reject (delete) a pending surveyor
export async function rejectPendingSurveyor(pendingId: string): Promise<boolean> {
  if (!browser) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/pending-surveyors/${pendingId}`, {
      method: 'DELETE',
      headers: getAuthTokenHeader()
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || 'Failed to reject surveyor');
    }

    // On success, remove from the local pending store
    pendingSurveyors.update(current => current.filter(p => p.id !== pendingId));
    return true;

  } catch (error) {
    console.error("Error rejecting pending surveyor:", error);
    alert(`Rejection failed: ${error}`);
    return false;
  }
}