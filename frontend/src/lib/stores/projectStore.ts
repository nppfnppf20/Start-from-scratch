import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { getAuthTokenHeader } from './authHelpers';
import { authenticatedFetch } from './auth0';
import { get } from 'svelte/store';

// Define the base URL for your API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// --- Helper Function to map _id to id recursively ---
function mapMongoId<T>(item: any): T {
  if (!item || typeof item !== 'object') return item;

  // Handle arrays
  if (Array.isArray(item)) {
    // Ensure we return an array of the correct mapped type
    return item.map(mapMongoId) as unknown as T;
  }

  // Handle single objects
  const newItem: any = {};
  let idFieldSet = false;
  for (const key in item) {
      if (Object.prototype.hasOwnProperty.call(item, key)) { // Safer iteration
          if (key === '_id' && item._id != null) { // Check for null/undefined _id
              newItem['id'] = item._id.toString(); // Ensure it's a string if ObjectId
              idFieldSet = true;
          } else if (typeof item[key] === 'object' && item[key] !== null) {
              // Recursively map nested objects/arrays
              newItem[key] = mapMongoId(item[key]);
          } else {
              // Copy primitive values directly
              newItem[key] = item[key];
          }
      }
  }
   // If the original object had _id but the 'id' key wasn't explicitly set above
   // (e.g., if 'id' was already a property), ensure 'id' from '_id' takes precedence if needed,
   // or simply ensure it's added if '_id' exists and 'id' wasn't processed.
   if (item._id != null && !idFieldSet) {
       newItem.id = item._id.toString();
   } else if (item._id != null && newItem.id == null) {
       // If _id existed and id is somehow null/undefined after loop, set it.
       newItem.id = item._id.toString();
   }

  return newItem as T;
}

// --- Project Interface and Store ---
interface Project {
  id: string;
  name: string;
  // Basic Project Information
  client?: string; // Umbrella client name from the modal
  projectLead?: string[];
  projectManager?: string[];
  teamMembers?: string[]; // Team member initials/names
  clientOrSpvName?: string; // Specific client/SPV name from the main form
  detailedDescription?: string;
  proposedUseDuration?: number;
  projectType?: 'solar' | 'bess' | 'solarBess' | 'other';
  address?: string;
  area?: number;
  localPlanningAuthority?: string;
  distributionNetwork?: string;
  siteDesignations?: string;
  
  // Equipment Specification (Solar)
  solarExportCapacity?: number;
  pvMaxPanelHeight?: number;
  fenceHeight?: number;
  pvClearanceFromGround?: number;
  numberOfSolarPanels?: number;
  panelTilt?: number;
  panelTiltDirection?: string;
  
  // Equipment Specification (BESS)
  bessExportCapacity?: number;
  bessContainers?: number;
  
  // Project Metrics
  gwhPerYear?: number;
  homesPowered?: number;
  co2Offset?: number;
  equivalentCars?: number;
  
  // Information for Surveyors
  accessArrangements?: string;
  accessContact?: string;
  parkingDetails?: string;
  atvUse?: 'yes' | 'no';
  additionalNotes?: string;
  invoicingDetails?: string;
  
  // SharePoint Document Link
  sharepointLink?: string;
  
  authorizedSurveyors?: string[]; // NEW: Array of surveyor user IDs
  authorizedClients?: string[];

  createdAt?: string; // From timestamps
  updatedAt?: string; // From timestamps
}

// --- NEW --- Interface for the Project Bank View
export interface ProjectBankItem extends Project {
  instructedCount: number;
  completedCount: number;
  outstandingCount: number;
  outstandingSurveys: {
    quoteId: string;
    organisation: string;
    contactName: string;
    workStatus: string;
  }[];
  instructedSpend: number;
  programmeEvents: {
    id: string; // Add the ID field
    title: string;
    date: string;
  }[];
  authorizedSurveyors?: string[]; // NEW: Add here as well for consistency
  authorizedClients?: string[];
}

// --- Project Store ---
// Initialize stores with empty/null values initially
export const projects = writable<Project[]>([]);
export const projectBank = writable<ProjectBankItem[]>([]); // New store for the project bank
export const selectedProject = writable<Project | null>(null);
export const allQuotes = writable<Quote[]>([]); // New master quote store

// --- NEW --- Function to load data for the project bank
export async function loadProjectBank() {
  if (!browser) return;

  try {
    console.log('Fetching project bank data from API...');
    const response = await authenticatedFetch(`${API_BASE_URL}/projects`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    let fetchedProjects: any[] = await response.json();

    // Map _id to id for frontend consistency
    const mappedProjects = fetchedProjects.map(p => mapMongoId<ProjectBankItem>(p));
    
    console.log('Project bank data fetched:', mappedProjects);
    projectBank.set(mappedProjects);

  } catch (error) {
    console.error("Failed to load project bank data:", error);
    projectBank.set([]); // Reset on error
  }
}

// Function to load projects from the API
export async function loadProjects(fetchFn: typeof fetch = fetch) {
  // Only run fetch in the browser environment
  if (!browser) return;

  try {
    console.log('Fetching projects from API...');
    const response = await fetchFn(`${API_BASE_URL}/projects`, {
      headers: await getAuthTokenHeader()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    let fetchedProjects: any[] = await response.json();

    // Map _id to id for frontend consistency
    fetchedProjects = fetchedProjects.map(p => ({ ...p, id: p._id }));

    console.log('Projects fetched:', fetchedProjects);
    projects.set(fetchedProjects);

    // New call to load all quotes
    await loadAllQuotes(fetchFn);

    // Do not auto-select a project on initial load; require explicit user selection
    const currentSelectedProject = get(selectedProject);
    if (fetchedProjects.length === 0) {
        selectedProject.set(null); // Ensure cleared when none exist
    } else if (!currentSelectedProject) {
        // Leave unselected until user chooses from dropdown
        selectedProject.set(null);
    }

  } catch (error) {
    console.error("Failed to load projects:", error);
    // Handle error appropriately in the UI if needed
    projects.set([]); // Reset projects on error
    selectedProject.set(null); // Clear selection on error
    allQuotes.set([]); // Clear all quotes on error
  }
}

// New function to fetch all quotes
export async function loadAllQuotes(fetchFn: typeof fetch = fetch) {
  if (!browser) return;
  
  try {
    console.log('Loading all quotes...');
    const response = await fetchFn(`${API_BASE_URL}/quotes`, {
      headers: await getAuthTokenHeader()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    let fetchedQuotes: any[] = await response.json();
    
    // Map _id to id
    fetchedQuotes = fetchedQuotes.map(q => ({ ...q, id: q._id }));
    
    console.log('All quotes loaded:', fetchedQuotes);
    allQuotes.set(fetchedQuotes);

  } catch (error) {
    console.error('Failed to load all quotes:', error);
    allQuotes.set([]);
  }
}

// --- Store Manipulation Functions ---

// Function to add a new project via API
export async function addProject(projectData: { name: string; client?: string; projectLead?: string[]; projectManager?: string[]; teamMembers?: string[] }) {
  if (!browser) return null; // Don't run on server

  try {
    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(await getAuthTokenHeader())
      },
      body: JSON.stringify(projectData),
    });

    if (!response.ok) {
      // Try to get error message from backend response body
      const errorData = await response.json().catch(() => ({})); // Default if body isn't JSON
      throw new Error(`HTTP error! status: ${response.status} - ${errorData.msg || response.statusText}`);
    }

    let newProject = await response.json();
    newProject = { ...newProject, id: newProject._id }; // Map _id to id

    // Add to the local store
    projects.update(existing => [...existing, newProject].sort((a, b) => a.name.localeCompare(b.name))); // Keep sorted? Or sort by date? Maybe sort in component
    selectedProject.set(newProject); // Automatically select the new project

    // After adding the project, reload the project bank data to include the new project
    await loadProjectBank();
    
  return newProject;

  } catch (error) {
    console.error("Failed to add project:", error);
    alert(`Error adding project: ${error}`); // Simple user feedback
    return null;
  }
}

// Function to update a project's details
export async function updateProject(projectId: string, updatedData: Partial<Project & { authorizedClients?: string[] }>) {
  if (!browser) return false; // Don't run on server

  try {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(await getAuthTokenHeader())
      },
      body: JSON.stringify(updatedData),
    });

    if (!response.ok) {
      // Try to get error message from backend response body
      const errorData = await response.json().catch(() => ({})); // Default if body isn't JSON
      throw new Error(`HTTP error! status: ${response.status} - ${errorData.msg || 'Failed to update project'}`);
    }

    let updatedProject = await response.json();
    updatedProject = mapMongoId<Project>(updatedProject);

    // Update the project in the main projects list
    projects.update(allProjects =>
      allProjects.map(p => (p.id === projectId ? { ...p, ...updatedProject } : p))
    );
    
    // Also update the project in the project bank list
    projectBank.update(allProjects =>
      allProjects.map(p => (p.id === projectId ? { ...p, ...updatedProject } : p))
    );

    // If this is the currently selected project, update it as well
    const currentSelected = get(selectedProject);
    if (currentSelected && currentSelected.id === projectId) {
      selectedProject.update(p => (p ? { ...p, ...updatedProject } : null));
    }

    return true; // Indicate success
  } catch (error) {
    console.error("Failed to update project:", error);
    alert(`Error updating project: ${error}`);
    return false; // Indicate failure
  }
}

// Function to select a project by its ID
export async function selectProjectById(id: string | null) {
   if (!browser) return false;
   if (!id) { // Handle explicit clearing of selection
        console.log('Clearing project selection.');
        selectedProject.set(null);
        // Clear related data when project is deselected
        currentProjectQuotes.set([]);
        currentInstructionLogs.set([]);
        surveyorFeedbacks.set([]); // Clear feedback too
        allProgrammeEvents.set([]); // *** CLEAR PROGRAMME EVENTS ***
        currentProjectFeeQuoteLogs.set([]); // Clear fee quote logs
        return true;
   }

   console.log(`Selecting project by ID: ${id}`);
   try {
       const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
        headers: await getAuthTokenHeader()
       });
       if (!response.ok) {
            const errorData = await response.json().catch(() => ({message: 'Failed to parse error response'}));
            throw new Error(`HTTP error! status: ${response.status} - ${errorData.msg || errorData.message || 'Failed to fetch project details'}`);
       }
       let projectDetails = await response.json();
       projectDetails = mapMongoId<Project>(projectDetails); // Use helper here too for consistency

       if (!projectDetails) {
           throw new Error('API returned empty response for project details');
       }

       selectedProject.set(projectDetails);
       console.log('Full project details loaded and selected:', projectDetails);

       // Load all related data in parallel for efficiency
       await Promise.all([
           loadQuotesForProject(id),
           loadInstructionLogsForProject(id),
           loadSurveyorFeedback(id),
           loadProgrammeEvents(id), // Load programme events alongside other data
           loadFeeQuoteLogsForProject(id) // Load fee quote logs
       ]);

       return true;
   } catch (error) {
       console.error(`Failed to fetch details for project ${id}:`, error);
       selectedProject.set(null); // Clear selection on error
       // Clear all related data on error
       currentProjectQuotes.set([]);
       currentInstructionLogs.set([]);
       surveyorFeedbacks.set([]);
       allProgrammeEvents.set([]); // Ensure programme events are cleared on error
       currentProjectFeeQuoteLogs.set([]); // Clear fee quote logs on error
       alert(`Error loading project details: ${error}`);
       return false;
   }
}

// TODO: Implement selectProjectByName if needed (might require backend endpoint or filtering frontend list)
export function selectProjectByName(name: string) {
  console.warn("selectProjectByName not fully implemented with API yet");
  // Find in the current local list (might be incomplete or stale)
  let found = false;
  const currentProjects = get(projects); // Get current projects list
  const project = currentProjects.find(p => p.name === name);
    if (project) {
      // For consistency, call selectProjectById to fetch full details
      selectProjectById(project.id);
      found = true;
    } else {
       selectProjectById(null); // Clear selection if not found
    }
  return found;
}

// Function to delete a project
export async function deleteProject(projectId: string) {
  if (!browser) return;

  try {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
      method: 'DELETE',
      headers: await getAuthTokenHeader(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete project');
    }

    // Remove from local stores
    projects.update(all => all.filter(p => p.id !== projectId));
    projectBank.update(all => all.filter(p => p.id !== projectId));
    
    // If the deleted project was the selected one, clear the selection
    const currentSelected = get(selectedProject);
    if (currentSelected && currentSelected.id === projectId) {
      selectedProject.set(null);
    }

  } catch (err: any) {
    console.error('Error deleting project:', err);
    // Optionally re-throw or handle in UI
    throw err;
  }
}

// --- QUOTE MANAGEMENT ---

// Interface for LineItem
export interface LineItem {
	item?: string;
	description: string;
	cost: number;
}

export type InstructionStatus = 'pending' | 'will not be instructed' | 'partially instructed' | 'instructed';

export interface Quote {
  id: string;
  projectId: string;
  discipline: string;
  organisation: string;
  contactName: string;
  email?: string;
  phoneNumber?: string;
  lineItems: LineItem[];
  total: number;
  instructionStatus: InstructionStatus;
  partiallyInstructedTotal?: number;
  additionalNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// --- Quote Store --- 
// Store quotes only for the *currently selected* project
export const currentProjectQuotes = writable<Quote[]>([]);

// --- Derived Stores for Dropdown Options ---
export const uniqueDisciplines = derived(
  allQuotes,
  ($allQuotes) => {
    const allDisciplines = $allQuotes.map(q => q.discipline);
    return [...new Set(allDisciplines)].sort();
  }
);

export const uniqueOrganisations = derived(
  allQuotes,
  ($allQuotes) => {
    const allOrganisations = $allQuotes.map(q => q.organisation);
    return [...new Set(allOrganisations)].sort();
  }
);

export const uniqueLineItemItems = derived(
  allQuotes,
  ($allQuotes) => {
    const allItems = $allQuotes
      .flatMap(q => q.lineItems) // Get all line items from all quotes
      .map(li => li.item)       // Get the 'item' from each line item
      .filter(item => item);     // Filter out any null/undefined/empty strings
    
    return [...new Set(allItems as string[])].sort(); // Create a unique, sorted list
  }
);

// --- Quote Functions --- 

// Function to load quotes for a specific project ID
async function loadQuotesForProject(projectId: string | null) {
  if (!browser || !projectId) {
    currentProjectQuotes.set([]); // Clear quotes if no project selected or not in browser
    return;
  }

  try {
    console.log(`Fetching quotes for project: ${projectId}`);
    const response = await fetch(`${API_BASE_URL}/quotes?projectId=${projectId}`, {
      headers: await getAuthTokenHeader()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    let fetchedQuotes: any[] = await response.json();

    // Map _id to id
    fetchedQuotes = fetchedQuotes.map(q => ({ ...q, id: q._id }));

    console.log('Quotes fetched:', fetchedQuotes);
    currentProjectQuotes.set(fetchedQuotes);

  } catch (error) {
    console.error(`Failed to load quotes for project ${projectId}:`, error);
    currentProjectQuotes.set([]); // Reset on error
  }
}

// Rest of the functions follow the same pattern - using await getAuthTokenHeader() instead of getAuthTokenHeader()
// ... (continuing with all other functions using the same await pattern)

// --- Programme Event Interface and Store ---
export interface ProgrammeEvent {
  id: string; // Unique event ID (e.g., `evt-${Date.now()}`)
  projectId: string; // Link to project
  title: string; // Description of the key date
  date: string; // ISO date string (YYYY-MM-DD)
  color: string; // Hex color code (e.g., #ff0000)
}

// Store for programme events for the *currently selected* project
// Initialize as empty, will be loaded from API
export const allProgrammeEvents = writable<ProgrammeEvent[]>([]);

// Function to load Programme Events for a specific project
async function loadProgrammeEvents(projectId: string | null) {
  if (!browser || !projectId) {
    allProgrammeEvents.set([]); // Clear events if no project selected or not in browser
    return;
  }

  try {
    console.log(`Fetching programme events for project: ${projectId}`);
    const response = await fetch(`${API_BASE_URL}/programme-events/project/${projectId}`, {
      headers: await getAuthTokenHeader()
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || 'Failed to fetch programme events'}`);
    }
    let fetchedEvents: any[] = await response.json();

    // Map _id to id using the existing helper function
    const mappedEvents = fetchedEvents.map(event => mapMongoId<ProgrammeEvent>(event));

    console.log('Programme events fetched and mapped:', mappedEvents);
    allProgrammeEvents.set(mappedEvents);

  } catch (error) {
    console.error(`Failed to load programme events for project ${projectId}:`, error);
    allProgrammeEvents.set([]); // Reset on error
  }
}

// --- Store interfaces ---
export interface InstructionLog {
  id: string;
  projectId: string;
  quoteId: string;
  workStatus?: string;
  siteVisitDate?: string;
  reportDraftDate?: string;
  operationalNotes?: string;
  dependencies?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SurveyorFeedback {
  id: string;
  projectId: string;
  quoteId: string;
  quality?: number;
  responsiveness?: number;
  deliveredOnTime?: number;
  overallReview?: number;
  notes?: string;
  reviewDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FeeQuoteLog {
  id: string;
  projectId: string;
  emails: string[];
  sentDate: string;
  createdAt?: string;
  updatedAt?: string;
}

// Store declarations
export const currentInstructionLogs = writable<InstructionLog[]>([]);
export const surveyorFeedbacks = writable<SurveyorFeedback[]>([]);
export const currentProjectFeeQuoteLogs = writable<FeeQuoteLog[]>([]);

// Load functions for other data types
async function loadInstructionLogsForProject(projectId: string | null) {
  if (!browser || !projectId) {
    currentInstructionLogs.set([]);
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/instruction-logs?projectId=${projectId}`, {
      headers: await getAuthTokenHeader()
    });
    if (response.ok) {
      const logs = await response.json();
      currentInstructionLogs.set(logs.map((log: any) => mapMongoId<InstructionLog>(log)));
    }
  } catch (error) {
    console.error('Failed to load instruction logs:', error);
    currentInstructionLogs.set([]);
  }
}

async function loadSurveyorFeedback(projectId: string | null) {
  if (!browser || !projectId) {
    surveyorFeedbacks.set([]);
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/surveyor-feedback?projectId=${projectId}`, {
      headers: await getAuthTokenHeader()
    });
    if (response.ok) {
      const feedback = await response.json();
      surveyorFeedbacks.set(feedback.map((fb: any) => mapMongoId<SurveyorFeedback>(fb)));
    }
  } catch (error) {
    console.error('Failed to load surveyor feedback:', error);
    surveyorFeedbacks.set([]);
  }
}

async function loadFeeQuoteLogsForProject(projectId: string | null) {
  if (!browser || !projectId) {
    currentProjectFeeQuoteLogs.set([]);
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/fee-quote-logs?projectId=${projectId}`, {
      headers: await getAuthTokenHeader()
    });
    if (response.ok) {
      const logs = await response.json();
      currentProjectFeeQuoteLogs.set(logs.map((log: any) => mapMongoId<FeeQuoteLog>(log)));
    }
  } catch (error) {
    console.error('Failed to load fee quote logs:', error);
    currentProjectFeeQuoteLogs.set([]);
  }
}