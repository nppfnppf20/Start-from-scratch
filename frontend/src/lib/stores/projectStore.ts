import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment'; // Import browser check
import { getAuthTokenHeader } from './authStore';

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
    const response = await fetch(`${API_BASE_URL}/projects`, {
      headers: getAuthTokenHeader()
    });
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
      headers: getAuthTokenHeader()
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
      headers: getAuthTokenHeader()
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

// Helper to get current store value outside component (needed for loadProjects logic)
import { get } from 'svelte/store';

// --- Store Manipulation Functions ---

// Function to add a new project via API
export async function addProject(projectData: { name: string; client?: string; projectLead?: string[]; projectManager?: string[]; teamMembers?: string[] }) {
  if (!browser) return null; // Don't run on server

  try {
    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthTokenHeader()
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
        ...getAuthTokenHeader()
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
        headers: getAuthTokenHeader()
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
      headers: getAuthTokenHeader(),
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
      headers: getAuthTokenHeader()
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

// Function to add a new quote via API
export async function addQuote(quoteData: Omit<Quote, 'id' | 'total' | 'createdAt' | 'updatedAt'>) {
  if (!browser) return null;

  // Ensure projectId is present (should be enforced by calling component)
  if (!quoteData.projectId) {
      console.error('Cannot add quote without projectId');
      alert('Error: Project ID is missing.');
      return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/quotes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthTokenHeader()
      },
      body: JSON.stringify(quoteData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP error! status: ${response.status} - ${errorData.msg || response.statusText}`);
    }

    let newQuote = await response.json();
    newQuote = { ...newQuote, id: newQuote._id };

    // Add to the local store for the current project
    currentProjectQuotes.update(existing => [...existing, newQuote]);
    console.log('Quote added:', newQuote);
    return newQuote;

  } catch (error) {
    console.error("Failed to add quote:", error);
    alert(`Error adding quote: ${error}`);
    return null;
  }
}

// Function to update an existing quote via API
export async function updateQuote(quoteId: string, updateData: Partial<Omit<Quote, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>>) {
  if (!browser) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/quotes/${quoteId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthTokenHeader()
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP error! status: ${response.status} - ${errorData.msg || response.statusText}`);
    }

    let updatedQuote = await response.json();
    updatedQuote = { ...updatedQuote, id: updatedQuote._id };

    // Update in the local store
    currentProjectQuotes.update(existing =>
      existing.map(q => (q.id === quoteId ? updatedQuote : q))
    );
    console.log('Quote updated:', updatedQuote);
    return true;

  } catch (error) {
    console.error("Failed to update quote:", error);
    alert(`Error updating quote: ${error}`);
    return false;
  }
}

// Function to update only the instruction status (calls updateQuote)
export async function updateQuoteInstructionStatus(quoteId: string, newStatus: InstructionStatus, partialTotal?: number) {
  const updateData: Partial<Omit<Quote, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>> = {
    instructionStatus: newStatus
  };
  // Only include partialTotal if the status requires it
  if (newStatus === 'partially instructed' && typeof partialTotal === 'number') {
    updateData.partiallyInstructedTotal = partialTotal;
  } else {
    // Explicitly set to null or undefined if not partial? Backend pre-validate hook handles clearing it.
    // updateData.partiallyInstructedTotal = null; // Or let backend handle it
  }
  return updateQuote(quoteId, updateData);
}

// Function to delete a quote via API
export async function deleteQuote(quoteId: string) {
  if (!browser) return false;

  if (!confirm('Are you sure you want to delete this quote?')) {
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/quotes/${quoteId}`, {
      method: 'DELETE',
      headers: getAuthTokenHeader()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP error! status: ${response.status} - ${errorData.msg || response.statusText}`);
    }

    // Remove from the local store
    currentProjectQuotes.update(existing => existing.filter(q => q.id !== quoteId));
    console.log(`Quote ${quoteId} deleted.`);
    return true;

  } catch (error) {
    console.error("Failed to delete quote:", error);
    alert(`Error deleting quote: ${error}`);
    return false;
  }
}

// --- Review Interface and Store ---
export type WorkStatus = 'in progress' | 'completed' | 'not started' | 'TRP Reviewing' | 'Client reviewing';

// New interface for uploaded work details
export interface UploadedWork {
  fileName: string;
  title: string;
  version: string;
  dateUploaded: string;
  description?: string;
  url?: string; // New: Add a field for the file URL/path (placeholder for now)
}

// New interface for individual custom dates
export interface CustomDate {
  id: string; // Unique ID for the custom date entry
  title: string;
  date: string; // ISO date string (YYYY-MM-DD)
  color?: string; // Optional color for the custom date
}

export interface SurveyorReview {
  id: string; // Unique review ID
  projectId: string; // Link to project
  quoteId: string; // Link to the specific quote being reviewed
  quality?: number; // 1-5
  responsiveness?: number; // 1-5
  deliveredOnTime?: number; // 0-5
  overallReview: number; // 1-5
  notes?: string; // For review comments (reviews page)
  operationalNotes?: string; // For operational/progress notes (instructed page)
  reviewDate: string; // ISO date string (YYYY-MM-DD)
  siteVisitDate?: string; // ISO date string (YYYY-MM-DD)
  reportDraftDate?: string; // ISO date string (YYYY-MM-DD)
  workStatus?: WorkStatus; // New: Track work progress
  uploadedWorks?: UploadedWork[]; // New: Array to store uploaded work details
  customDates?: CustomDate[]; // New: Array for custom dates
}

// Store for all reviews
const initialReviews: SurveyorReview[] = [
    // Example review
    {
        id: 'rev1',
        projectId: 'project-1',
        quoteId: 'q2', // Assuming q2 is instructed in initialQuotes
        overallReview: 4,
        reviewDate: '2023-09-15',
        siteVisitDate: '2023-10-01',
        reportDraftDate: '2023-10-15',
        workStatus: 'in progress',
        operationalNotes: 'Site visit scheduled.',
        uploadedWorks: [],
        customDates: [
            { id: 'cd1', title: 'Initial Meeting', date: '2023-09-20'}
        ]
    }
];

export const allReviews = writable<SurveyorReview[]>(initialReviews);

// Function to add or update a review
export function addOrUpdateReview(reviewData: Omit<SurveyorReview, 'id'> & { id?: string }) {
  allReviews.update(reviews => {
    const index = reviews.findIndex(r => r.id === reviewData.id || r.quoteId === reviewData.quoteId);
    
    if (index !== -1) {
      // Update existing review
      const existingReview = reviews[index];
      reviews[index] = { 
        ...existingReview, // Keep existing fields
        ...reviewData,      // Overwrite with new data
        // Ensure nested arrays like uploadedWorks and customDates are correctly merged if needed
        // If reviewData contains these fields, they will overwrite the existing ones.
        // If finer control (e.g., adding one item) is needed, adjust logic here or use dedicated functions.
        // For this basic update, assume reviewData provides the full intended state for these arrays if included.
        customDates: reviewData.customDates !== undefined ? reviewData.customDates : existingReview.customDates,
        uploadedWorks: reviewData.uploadedWorks !== undefined ? reviewData.uploadedWorks : existingReview.uploadedWorks
      };
    } else {
      // Add new review
      const newReview: SurveyorReview = {
        ...reviewData, // Use provided data
        id: `rev-${Date.now()}`, // Generate a new ID
        // Ensure required fields like overallReview and reviewDate have defaults if not provided
        overallReview: reviewData.overallReview ?? 0, 
        reviewDate: reviewData.reviewDate ?? new Date().toISOString().split('T')[0],
        // Initialize arrays if not provided
        uploadedWorks: reviewData.uploadedWorks ?? [],
        customDates: reviewData.customDates ?? []
      };
      reviews.push(newReview);
    }
    return reviews;
  });
}

export function getReviewForQuote(quoteId: string): SurveyorReview | undefined {
    // Use get() helper to read store value synchronously
    const reviews = get(allReviews);
    return reviews.find(r => r.quoteId === quoteId);
}

// Specific function to update only the work status
export function updateWorkStatus(quoteId: string, projectId: string, workStatus: WorkStatus) {
    const existingReview = getReviewForQuote(quoteId);
    const reviewData: Omit<SurveyorReview, 'id'> & { id?: string } = {
        quoteId: quoteId,
        projectId: projectId,
        workStatus: workStatus,
        // Provide defaults or existing values for other fields if review doesn't exist
        overallReview: existingReview?.overallReview ?? 0,
        reviewDate: existingReview?.reviewDate ?? new Date().toISOString().split('T')[0],
        // Include other existing fields
        ...(existingReview ? { 
            quality: existingReview.quality,
            responsiveness: existingReview.responsiveness,
            deliveredOnTime: existingReview.deliveredOnTime,
            notes: existingReview.notes,
            siteVisitDate: existingReview.siteVisitDate,
            reportDraftDate: existingReview.reportDraftDate,
            id: existingReview.id // Pass ID if updating existing
         } : {})
    };
    addOrUpdateReview(reviewData);
}

// Function to add uploaded work details to a review
export function addUploadedWork(quoteId: string, projectId: string, workDetails: UploadedWork) {
  allReviews.update(reviews => {
    const reviewIndex = reviews.findIndex(r => r.quoteId === quoteId && r.projectId === projectId);
    
    if (reviewIndex !== -1) {
      // Review exists, update it
      const updatedReview = { ...reviews[reviewIndex] };
      // Prepend the new work details to the beginning of the array
      updatedReview.uploadedWorks = [workDetails, ...(updatedReview.uploadedWorks || [])];
      reviews[reviewIndex] = updatedReview;
    } else {
      // Review doesn't exist, create a new one
      const newReview: SurveyorReview = {
        id: `rev-${Date.now()}`,
        projectId,
        quoteId,
        overallReview: 0, // Default overall review
        reviewDate: new Date().toISOString().split('T')[0], // Default review date
        workStatus: 'in progress', // Default status when work is uploaded
        uploadedWorks: [workDetails] // Start the array with the new work
        // Add other default fields as necessary
      };
      reviews.push(newReview);
    }
    return reviews;
  });
}

// --- Programme Event Interface and Store ---
export interface ProgrammeEvent {
  id: string; // Unique event ID (e.g., `evt-${Date.now()}`)
  projectId: string; // Link to project
  title: string; // Description of the key date
  date: string; // ISO date string (YYYY-MM-DD)
  color: string; // Hex color code (e.g., #ff0000)
}

// Store for all programme events
// const initialProgrammeEvents: ProgrammeEvent[] = [
//     // Add initial dummy events if needed, linking to projectIds
//     {
//         id: 'evt1',
//         projectId: 'project-1',
//         title: 'Initial Site Assessment Due',
//         date: '2023-11-15', // Example date - adjust if needed
//         color: '#007bff' // Blue
//     },
//     {
//         id: 'evt2',
//         projectId: 'project-1',
//         title: 'Planning Submission Target',
//         date: '2023-11-30',
//         color: '#ffc107' // Yellow
//     },
//      {
//         id: 'evt3',
//         projectId: 'project-2',
//         title: 'Grid Connection Offer Deadline',
//         date: '2023-12-10',
//         color: '#dc3545' // Red
//     }
// ];

// Store for programme events for the *currently selected* project
// Initialize as empty, will be loaded from API
export const allProgrammeEvents = writable<ProgrammeEvent[]>([]);

// --- Programme Event API Functions ---

// Function to load Programme Events for a specific project
async function loadProgrammeEvents(projectId: string | null) {
  if (!browser || !projectId) {
    allProgrammeEvents.set([]); // Clear events if no project selected or not in browser
    return;
  }

  try {
    console.log(`Fetching programme events for project: ${projectId}`);
    // Use the backend route we defined: GET /api/programme-events/project/:projectId
    const response = await fetch(`${API_BASE_URL}/programme-events/project/${projectId}`, {
      headers: getAuthTokenHeader()
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
    // Consider showing an error message to the user
  }
}

// Function to add a new programme event via API
export async function addProgrammeEvent(eventData: Omit<ProgrammeEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProgrammeEvent | null> {
  console.log('addProgrammeEvent CALLED in store. Data:', eventData);
  if (!browser) {
    console.log('addProgrammeEvent: Not in browser, returning.');
    return null;
  }


  if (!eventData.projectId) {
      console.error('addProgrammeEvent: Cannot add programme event without projectId. Data:', eventData);
      alert('Error: Project ID is missing.');
      return null;
  }

  try {
    console.log('Attempting to POST /api/programme-events with:', eventData);
    // Use the backend route: POST /api/programme-events
    const response = await fetch(`${API_BASE_URL}/programme-events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthTokenHeader()
      },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || 'Failed to add programme event'}`);
    }

    let newEvent = await response.json();
    const mappedEvent = mapMongoId<ProgrammeEvent>(newEvent); // Map the response

    // Add to the local store
    allProgrammeEvents.update(existing => {
        const updatedEvents = [...existing, mappedEvent];
        // Optional: Sort events after adding
        updatedEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        return updatedEvents;
    });

    console.log('Programme event added:', mappedEvent);
    return mappedEvent; // Return the newly created event

  } catch (error) {
    console.error("Failed to add programme event:", error);
    alert(`Error adding key date: ${error}`);
    return null;
  }
}

// Function to update an existing programme event via API
export async function updateProgrammeEvent(eventToUpdate: ProgrammeEvent): Promise<boolean> {
  console.log('updateProgrammeEvent CALLED in store. Data:', eventToUpdate);
  if (!browser || !eventToUpdate || !eventToUpdate.id) {
      console.error('updateProgrammeEvent: Invalid data or not in browser. Data:', eventToUpdate);
      return false;
  };

  const eventId = eventToUpdate.id;
  // Prepare data payload - only send fields that should be updatable
  const updateData = {
      title: eventToUpdate.title,
      date: eventToUpdate.date, // Ensure this is in a format the backend expects (e.g., ISO string)
      color: eventToUpdate.color,
      // Do NOT send id, projectId, createdAt, updatedAt in the body for a PUT by ID
  };


  try {
    console.log(`Updating programme event ${eventId}:`, updateData);
    // Use the backend route: PUT /api/programme-events/:eventId
    const response = await fetch(`${API_BASE_URL}/programme-events/${eventId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthTokenHeader()
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || 'Failed to update programme event'}`);
    }

    let updatedEventFromServer = await response.json();
    const mappedEvent = mapMongoId<ProgrammeEvent>(updatedEventFromServer); // Map the response

    // Update in the local store
    allProgrammeEvents.update(existing => {
        const updatedEvents = existing.map(event =>
            event.id === eventId ? mappedEvent : event
        );
        // Optional: Re-sort if date could have changed
        updatedEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        return updatedEvents;
    });

    console.log('Programme event updated:', mappedEvent);
    return true;

  } catch (error) {
    console.error(`Failed to update programme event ${eventId}:`, error);
    alert(`Error updating key date: ${error}`);
    return false;
  }
}

// Function to delete a programme event by ID via API
export async function deleteProgrammeEvent(eventId: string): Promise<boolean> {
  if (!browser || !eventId) {
      console.error('Delete requires an event ID and browser environment.');
      return false;
  }

  if (!confirm('Are you sure you want to delete this programme event? This cannot be undone.')) {
      return false;
  }

  try {
      const response = await fetch(`${API_BASE_URL}/programme-events/${eventId}`, {
          method: 'DELETE',
          headers: getAuthTokenHeader()
      });

      if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`HTTP error! status: ${response.status} - ${errorData.msg || response.statusText}`);
      }

      // Successfully deleted on the server, now update the local store
      allProgrammeEvents.update(events => {
          const updatedEvents = events.filter(event => event.id !== eventId);
          console.log(`[Store] Programme event for ${eventId} removed. New count: ${updatedEvents.length}`);
          return updatedEvents;
      });

      console.log('Programme event deleted successfully for ID:', eventId);
      return true;

  } catch (error) {
      console.error(`Failed to delete programme event ${eventId}:`, error);
      alert(`Error deleting programme event: ${error}`);
      return false;
  }
}

// --- Helper function to generate unique IDs ---
function generateId(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

// --- Functions specifically for managing Custom Dates within a Review ---

export function addCustomDateToReview(quoteId: string, projectId: string, newDate: Omit<CustomDate, 'id'>) {
    const customDateId = generateId('cd');
    const fullCustomDate: CustomDate = { ...newDate, id: customDateId };

    allReviews.update(reviews => {
        const index = reviews.findIndex(r => r.quoteId === quoteId);
        if (index !== -1) {
            const review = reviews[index];
            const updatedCustomDates = [...(review.customDates || []), fullCustomDate];
            reviews[index] = { ...review, customDates: updatedCustomDates };
        } else {
            // If no review exists yet, create one with this custom date
            const newReview: SurveyorReview = {
                id: generateId('rev'),
                projectId: projectId,
                quoteId: quoteId,
                overallReview: 0, // Default values
                reviewDate: new Date().toISOString().split('T')[0],
                customDates: [fullCustomDate],
                uploadedWorks: [], // Initialize other optional fields
            };
            reviews.push(newReview);
        }
        return reviews;
    });
}

export function updateCustomDateInReview(quoteId: string, customDateId: string, updatedData: Partial<Omit<CustomDate, 'id'>>) {
    allReviews.update(reviews => {
        const index = reviews.findIndex(r => r.quoteId === quoteId);
        if (index !== -1) {
            const review = reviews[index];
            if (review.customDates) {
                const customDateIndex = review.customDates.findIndex(cd => cd.id === customDateId);
                if (customDateIndex !== -1) {
                    review.customDates[customDateIndex] = { 
                        ...review.customDates[customDateIndex], 
                        ...updatedData 
                    };
                }
            }
        }
        return reviews; // Return modified array
    });
}


export function deleteCustomDateFromReview(quoteId: string, customDateId: string) {
    allReviews.update(reviews => {
        const index = reviews.findIndex(r => r.quoteId === quoteId);
        if (index !== -1) {
            const review = reviews[index];
            if (review.customDates) {
                review.customDates = review.customDates.filter(cd => cd.id !== customDateId);
            }
        }
        return reviews; // Return modified array
    });
} 

// +++ Add store for Instruction Logs +++
export const currentInstructionLogs = writable<InstructionLog[]>([]);

// --- Instruction Log Interface (Matches backend) ---
export interface InstructionLog {
  id: string; // Corresponds to _id from backend
  projectId: string;
  quoteId: string;
  workStatus?: 'not started' | 'in progress' | 'completed' | 'TRP Reviewing' | 'Client reviewing';
  siteVisitDate?: string; // ISO date string
  reportDraftDate?: string; // ISO date string
  operationalNotes?: string;
  dependencies?: string;
  uploadedWorks?: UploadedWork[]; // Uses existing UploadedWork interface
  customDates?: CustomDate[];   // Uses existing CustomDate interface
  createdAt?: string;
  updatedAt?: string;
}

// --- Instruction Log API Functions ---

// Function to load Instruction Logs for a specific project
async function loadInstructionLogsForProject(projectId: string | null) {
  if (!browser || !projectId) {
    currentInstructionLogs.set([]); // Clear if no project or SSR
    return;
  }

  console.log(`Fetching instruction logs for project ID: ${projectId}`);
  try {
    const response = await fetch(`${API_BASE_URL}/instruction-logs?projectId=${projectId}`, {
      headers: getAuthTokenHeader()
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP error! status: ${response.status} - ${errorData.msg || 'Failed to fetch instruction logs'}`);
    }
    let logs: any[] = await response.json(); // Fetch as any[] initially

    // Map _id to id deeply
    const mappedLogs = logs.map(log => mapMongoId<InstructionLog>(log)); // USE HELPER HERE

    currentInstructionLogs.set(mappedLogs); // Set the mapped logs
    console.log('Instruction logs loaded:', mappedLogs);
  } catch (error) {
    console.error(`Failed to load instruction logs for project ${projectId}:`, error);
    currentInstructionLogs.set([]); // Clear store on error
    // Potentially show an error to the user
  }
}

// Function to upsert (create or update) an Instruction Log
export async function upsertInstructionLog(quoteId: string, logData: Partial<Omit<InstructionLog, 'id' | 'quoteId' | 'projectId' | 'createdAt' | 'updatedAt'>>) {
    if (!browser) return null;

    console.log(`Upserting instruction log for quote ID: ${quoteId}`);
    try {
        const response = await fetch(`${API_BASE_URL}/instruction-logs/${quoteId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthTokenHeader()
            },
            body: JSON.stringify(logData), // Send only the updatable fields
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`HTTP error! status: ${response.status} - ${errorData.msg || 'Failed to upsert instruction log'}`);
        }

        let upsertedLog: any = await response.json(); // Fetch as any
        // Map _id to id deeply for the returned log and its subdocuments
        const mappedUpsertedLog = mapMongoId<InstructionLog>(upsertedLog); // USE HELPER HERE

        // Update the local store
        currentInstructionLogs.update(logs => {
            const index = logs.findIndex(log => log.quoteId === quoteId);
            if (index !== -1) {
                // Update existing log
                logs[index] = mappedUpsertedLog; // Use the mapped log
            } else {
                // Add new log
                logs.push(mappedUpsertedLog); // Use the mapped log
            }
            // Ensure reactivity by returning a new array reference if needed,
            // though direct modification and returning logs often works in Svelte stores.
            return [...logs]; // Safer for reactivity
        });

        console.log('Instruction log upserted:', mappedUpsertedLog);
        return mappedUpsertedLog; // Return the mapped log

    } catch (error) {
        console.error(`Failed to upsert instruction log for quote ${quoteId}:`, error);
        alert(`Error saving instruction details: ${error}`); // Basic user feedback
        return null;
    }
}

// --- Surveyor Feedback Interface and Store (Replaces SurveyorReview) ---
export interface SurveyorFeedback {
  id: string; // Mapped from _id
  projectId: string;
  quoteId: string;
  // Rating fields
  quality?: number; // 1-5
  responsiveness?: number; // 1-5
  deliveredOnTime?: number; // 0-5 
  overallReview?: number; // 1-5 
  // Comment field
  notes?: string; // Review comments
  // Metadata
  reviewDate?: string; // ISO date string (set by backend)
  createdAt?: string;
  updatedAt?: string;
}

// Renamed store for clarity
export const surveyorFeedbacks = writable<SurveyorFeedback[]>([]); // *** ENSURE THIS LINE EXISTS AND IS CORRECT ***

// --- Surveyor Feedback API Functions ---

// Function to load Surveyor Feedback for a specific project
async function loadSurveyorFeedback(projectId: string | null) {
  if (!browser || !projectId) {
    surveyorFeedbacks.set([]); // Clear if no project or SSR
    return;
  }

  console.log(`Fetching surveyor feedback for project ID: ${projectId}`);
  try {
    const response = await fetch(`${API_BASE_URL}/surveyor-feedback?projectId=${projectId}`, {
      headers: getAuthTokenHeader()
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP error! status: ${response.status} - ${errorData.msg || 'Failed to fetch surveyor feedback'}`);
    }
    let feedbackList: any[] = await response.json();

    // Map _id to id deeply
    const mappedFeedbackList = feedbackList.map(fb => mapMongoId<SurveyorFeedback>(fb));

    surveyorFeedbacks.set(mappedFeedbackList);
    console.log('Surveyor feedback loaded:', mappedFeedbackList);
  } catch (error) {
    console.error(`Failed to load surveyor feedback for project ${projectId}:`, error);
    surveyorFeedbacks.set([]); // Clear store on error
  }
}

// Function to upsert (create or update) Surveyor Feedback
// Replaces addOrUpdateReview logic
export async function upsertSurveyorFeedback(feedbackData: Partial<Omit<SurveyorFeedback, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>> & { quoteId: string }): Promise<SurveyorFeedback | null> {
    if (!browser) return null;

    const { quoteId, ...dataToUpdate } = feedbackData; // Separate quoteId from data

    if (!quoteId) {
        console.error('Upsert requires a quoteId');
        alert('Error: Cannot save feedback without a valid quote reference.');
        return null;
    }

    // Remove fields that shouldn't be sent directly if they somehow slipped in
    delete (dataToUpdate as any).id;
    delete (dataToUpdate as any).projectId;
    delete (dataToUpdate as any).createdAt;
    delete (dataToUpdate as any).updatedAt;
    delete (dataToUpdate as any).reviewDate; // Let backend handle reviewDate default/update

    console.log(`Upserting surveyor feedback for quote ID: ${quoteId}`);
    try {
        const response = await fetch(`${API_BASE_URL}/surveyor-feedback/${quoteId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthTokenHeader()
            },
            body: JSON.stringify(dataToUpdate),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessages = errorData.errors ? errorData.errors.join(', ') : (errorData.msg || 'Failed to save feedback');
            throw new Error(`HTTP error! status: ${response.status} - ${errorMessages}`);
        }

        let upsertedFeedback: any = await response.json();
        const mappedFeedback = mapMongoId<SurveyorFeedback>(upsertedFeedback);

        console.log('[Store] Feedback received from API (mapped):', mappedFeedback);

        // Update the local store
        surveyorFeedbacks.update(feedbacks => {
            const index = feedbacks.findIndex(fb => fb.quoteId === quoteId);
            console.log(`[Store] Updating store. Found index for ${quoteId}: ${index}`);
            if (index !== -1) {
                feedbacks[index] = mappedFeedback;
            } else {
                feedbacks.push(mappedFeedback);
            }
             // Log the state right before returning it
            console.log('[Store] Store state AFTER update:', feedbacks); 
            return [...feedbacks]; // Return new array for reactivity
        });

        console.log('Surveyor feedback upserted:', mappedFeedback);
        return mappedFeedback;

    } catch (error) {
        console.error(`Failed to save surveyor feedback for quote ${quoteId}:`, error);
        alert(`Error saving feedback: ${error}`); // User feedback
        return null;
    }
}

// Function to delete Surveyor Feedback
export async function deleteSurveyorFeedback(quoteId: string): Promise<boolean> {
    if (!browser || !quoteId) {
        console.error('Delete operation requires a quoteId and browser environment.');
        return false;
    }

    console.log(`Deleting surveyor feedback for quote ID: ${quoteId}`);
    try {
        const response = await fetch(`${API_BASE_URL}/surveyor-feedback?quoteId=${quoteId}`, {
            method: 'DELETE',
            headers: getAuthTokenHeader(),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`HTTP error! status: ${response.status} - ${errorData.msg || 'Failed to delete feedback'}`);
        }

        // Successfully deleted on the server, now update the local store
        surveyorFeedbacks.update(feedbacks => {
            const updatedFeedbacks = feedbacks.filter(fb => fb.quoteId !== quoteId);
            console.log(`[Store] Feedback for ${quoteId} removed. New count: ${updatedFeedbacks.length}`);
            return updatedFeedbacks;
        });

        console.log('Surveyor feedback deleted successfully for quote ID:', quoteId);
        return true;

    } catch (error) {
        console.error(`Failed to delete surveyor feedback for quote ${quoteId}:`, error);
        alert(`Error deleting feedback: ${error}`); // User feedback
        return false;
    }
}

// Function to get feedback for a specific quote (replaces getReviewForQuote)
export function getFeedbackForQuote(quoteId: string): SurveyorFeedback | undefined {
    const currentFeedback = get(surveyorFeedbacks); // Get current value from the correct store
    return currentFeedback.find(fb => fb.quoteId === quoteId);
}

// --- Fee Quote Log Interface and Store ---
export interface FeeQuoteLog {
  id: string;
  projectId: string;
  emails: string[];
  sentDate: string;
  createdAt?: string;
  updatedAt?: string;
}

// Store for fee quote logs for the *currently selected* project
export const currentProjectFeeQuoteLogs = writable<FeeQuoteLog[]>([]);

// --- Fee Quote Log API Functions ---

// Function to load Fee Quote Logs for a specific project
async function loadFeeQuoteLogsForProject(projectId: string | null) {
  if (!browser || !projectId) {
    currentProjectFeeQuoteLogs.set([]); // Clear if no project or SSR
    return;
  }

  console.log(`Fetching fee quote logs for project ID: ${projectId}`);
  try {
    const response = await fetch(`${API_BASE_URL}/fee-quote-logs?projectId=${projectId}`, {
      headers: getAuthTokenHeader()
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP error! status: ${response.status} - ${errorData.msg || 'Failed to fetch fee quote logs'}`);
    }
    let logs: any[] = await response.json();

    // Map _id to id deeply
    const mappedLogs = logs.map(log => mapMongoId<FeeQuoteLog>(log));

    currentProjectFeeQuoteLogs.set(mappedLogs);
    console.log('Fee quote logs loaded:', mappedLogs);
  } catch (error) {
    console.error(`Failed to load fee quote logs for project ${projectId}:`, error);
    currentProjectFeeQuoteLogs.set([]); // Clear store on error
  }
}

// Function to create a new Fee Quote Log
export async function createFeeQuoteLog(projectId: string, emails: string[]): Promise<FeeQuoteLog | null> {
    if (!browser) return null;

    if (!projectId) {
        console.error('Cannot create fee quote log without projectId');
        alert('Error: Project ID is missing.');
        return null;
    }

    if (!emails || emails.length === 0) {
        console.error('Cannot create fee quote log without emails');
        alert('Error: At least one email address is required.');
        return null;
    }

    try {
        console.log('Creating fee quote log:', { projectId, emails });
        const response = await fetch(`${API_BASE_URL}/fee-quote-logs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthTokenHeader()
            },
            body: JSON.stringify({ projectId, emails }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`HTTP error! status: ${response.status} - ${errorData.msg || 'Failed to create fee quote log'}`);
        }

        let newLog = await response.json();
        const mappedLog = mapMongoId<FeeQuoteLog>(newLog);

        // Add to the local store (prepend to show newest first)
        currentProjectFeeQuoteLogs.update(existing => [mappedLog, ...existing]);

        console.log('Fee quote log created:', mappedLog);
        return mappedLog;

    } catch (error) {
        console.error('Failed to create fee quote log:', error);
        alert(`Error logging fee quote request: ${error instanceof Error ? error.message : String(error)}`);
        return null;
    }
}

export async function authorizeSurveyors(projectId: string, emails: string[]): Promise<Project | null> {
    if (!browser) return null;

    try {
        const response = await fetch(`${API_BASE_URL}/projects/${projectId}/authorize-surveyors`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthTokenHeader()
            },
            body: JSON.stringify({ emails }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.msg || 'Failed to authorize surveyors');
        }

        const updatedProject = await response.json();
        
        // Map _id to id for frontend consistency
        const mappedProject = mapMongoId<Project>(updatedProject);
        
        // Update the stores
        projects.update(ps => ps.map(p => p.id === projectId ? mappedProject : p));
        selectedProject.update(p => p && p.id === projectId ? mappedProject : p);

        return mappedProject;

    } catch (error) {
        console.error('Error in authorizeSurveyors:', error);
        alert(`Error: ${error instanceof Error ? error.message : String(error)}`);
        return null;
    }
}

export async function authorizeClients(projectId: string, emails: string[]): Promise<Project | null> {
    if (!browser) return null;

    try {
        const response = await fetch(`${API_BASE_URL}/projects/${projectId}/authorize-clients`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthTokenHeader()
            },
            body: JSON.stringify({ emails }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.msg || 'Failed to authorize clients');
        }

        const updatedProject = await response.json();
        const mappedProject = mapMongoId<Project>(updatedProject);

        projects.update(ps => ps.map(p => p.id === projectId ? mappedProject : p));
        selectedProject.update(p => p && p.id === projectId ? mappedProject : p);

        return mappedProject;

    } catch (error) {
        console.error('Error in authorizeClients:', error);
        alert(`Error: ${error instanceof Error ? error.message : String(error)}`);
        return null;
    }
}

export async function revokeSurveyorAuthorization(projectId: string, email: string): Promise<Project | null> {
    if (!browser) return null;

    try {
        const response = await fetch(`${API_BASE_URL}/projects/${projectId}/surveyors/${encodeURIComponent(email)}`, {
            method: 'DELETE',
            headers: {
                ...getAuthTokenHeader()
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.msg || 'Failed to revoke surveyor authorization');
        }

        const updatedProject = await response.json();
        
        // Map _id to id for frontend consistency
        const mappedProject = mapMongoId<Project>(updatedProject);
        
        // Update the stores
        projects.update(ps => ps.map(p => p.id === projectId ? mappedProject : p));
        selectedProject.update(p => p && p.id === projectId ? mappedProject : p);

        return mappedProject;

    } catch (error) {
        console.error('Error in revokeSurveyorAuthorization:', error);
        alert(`Error: ${error instanceof Error ? error.message : String(error)}`);
        return null;
    }
}