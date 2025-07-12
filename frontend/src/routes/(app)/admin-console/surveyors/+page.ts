import type { PageLoad } from './$types';
import { getAuthTokenHeader } from '$lib/stores/authStore';

// Define the base URL for your API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface SurveyorOrganisation {
    id: string;
    organisation: string;
    discipline: string;
    contacts: {
        contactName: string;
        email: string;
        phoneNumber?: string;
    }[];
    projectCount: number;
    reviewCount: number;
    averageQuality: number;
    averageResponsiveness: number;
    averageDeliveredOnTime: number;
    averageOverallReview: number;
    createdAt: string;
    updatedAt: string;
}

export const load: PageLoad = async ({ fetch }) => {
    console.log("Fetching surveyor organisations for the admin console...");
    try {
        const response = await fetch(`${API_BASE_URL}/surveyor-organisations`, {
            headers: getAuthTokenHeader()
        });
        
        if (response.ok) {
            let surveyorData: any[] = await response.json();
            // Map _id to id for frontend consistency
            surveyorData = surveyorData.map(s => ({ ...s, id: s._id }));
            
            return {
                surveyors: surveyorData as SurveyorOrganisation[]
            };
        } else {
            console.error('Failed to fetch surveyor organisations:', response.statusText);
            return {
                surveyors: [],
                error: `Failed to load data: ${response.statusText}`
            };
        }
    } catch (error) {
        console.error('An error occurred while fetching surveyor organisations:', error);
        return {
            surveyors: [],
            error: 'Could not connect to the server.'
        };
    }
};
