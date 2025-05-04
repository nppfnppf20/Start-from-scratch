import { writable } from 'svelte/store';
import { browser } from '$app/environment'; // Import browser check
import { get } from 'svelte/store';

// Define the base URL for your API
export const API_BASE_URL = 'http://localhost:5000/api'; // Adjust if your backend runs elsewhere

// --- Helper Function to map _id to id recursively ---
export function mapMongoId<T>(item: any): T {
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
  clientName?: string;
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
  createdAt?: string; // From timestamps
  updatedAt?: string; // From timestamps
}

// *** ADD Upload Interface Definition ***
export interface Upload {
  id: string; // Mapped from _id
  projectId: string;
  filename: string;      // Server filename
  originalName: string;  // Original filename
  mimeType: string;
  path: string;          // Relative path on server (e.g., uploads/file-123.pdf)
  size: number;          // Size in bytes
  title?: string;         // User-provided title
  description?: string;   // User-provided description
  createdAt?: string;     // Added by timestamps
  updatedAt?: string;     // Added by timestamps
}

// --- Project Store ---
// Initialize stores with empty/null values initially
export const projects = writable<Project[]>([]);
export const selectedProject = writable<Project | null>(null);
export const currentProjectQuotes = writable<Quote[]>([]);
export const currentInstructionLogs = writable<InstructionLog[]>([]);
export const surveyorFeedbacks = writable<SurveyorFeedback[]>([]);
export const allProgrammeEvents = writable<ProgrammeEvent[]>([]);
export const projectUploads = writable<Upload[]>([]);

// Function to load projects from the API
export async function loadProjects() {
  // Only run fetch in the browser environment
  if (!browser) return;

  try {
    console.log('Fetching projects from API...');
    const response = await fetch(`${API_BASE_URL}/projects`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    let fetchedProjects: any[] = await response.json();

    // Map _id to id for frontend consistency
    fetchedProjects = fetchedProjects.map(p => ({ ...p, id: p._id }));

    console.log('Projects fetched:', fetchedProjects);
    projects.set(fetchedProjects);

    // Optionally, automatically select the first project if the list isn't empty
    // But only if no project is currently selected
    const currentSelectedProject = get(selectedProject); // Need to get current value
    if (fetchedProjects.length > 0 && !currentSelectedProject) {
       // Fetch full details for the first project to ensure selectedProject has all data
       await selectProjectById(fetchedProjects[0].id);
    } else if (fetchedProjects.length === 0) {
        selectedProject.set(null); // Clear selection if no projects exist
    }

  } catch (error) {
    console.error("Failed to load projects:", error);
    // Handle error appropriately in the UI if needed
    projects.set([]); // Reset projects on error
    selectedProject.set(null); // Clear selection on error
  }
}

// Helper to get current store value outside component (needed for loadProjects logic)

// --- Store Manipulation Functions ---

// Function to add a new project via API
export async function addProject(projectData: { name: string; client?: string; teamMembers?: string[] }) {
  if (!browser) return null; // Don't run on server

  try {
    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
  return newProject;

  } catch (error) {
    console.error("Failed to add project:", error);
    alert(`Error adding project: ${error}`); // Simple user feedback
    return null;
  }
}

// Function to update an existing project via API
export async function updateProject(projectId: string, updatedData: Partial<Project>) {
  if (!browser) return false; // Don't run on server

  // Create a copy to avoid modifying the original object directly if needed
  const dataToSend = { ...updatedData };
  // Remove 'id' and MongoDB specific fields if they exist, backend uses :id from URL
  delete dataToSend.id;
  delete (dataToSend as any)._id; // Use any to bypass potential type error if _id isn't explicitly in Partial<Project>
  delete dataToSend.createdAt;
  delete dataToSend.updatedAt;


  try {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSend),
    });

    if (!response.ok) {
       const errorData = await response.json().catch(() => ({}));
       throw new Error(`HTTP error! status: ${response.status} - ${errorData.msg || response.statusText}`);
    }

    let updatedProjectFromServer = await response.json();
    updatedProjectFromServer = { ...updatedProjectFromServer, id: updatedProjectFromServer._id };

    // Update the local stores
    projects.update(existing =>
      existing.map(p => (p.id === projectId ? updatedProjectFromServer : p))
      // Consider re-sorting if needed after update
    );
    selectedProject.update(current =>
      current && current.id === projectId ? updatedProjectFromServer : current
    );
    return true;

  } catch (error) {
    console.error("Failed to update project:", error);
    alert(`Error updating project: ${error}`); // Simple user feedback
    return false;
  }
}

// Function to select a project - Fetches full details
export async function selectProjectById(id: string | null) {
   if (!browser) return false;
   if (!id) { // Handle explicit clearing of selection
        console.log('Clearing project selection.');
        selectedProject.set(null);
        // Clear related data when project is deselected
        currentProjectQuotes.set([]);
        currentInstructionLogs.set([]);
        surveyorFeedbacks.set([]);
        allProgrammeEvents.set([]); // Clear programme events
        projectUploads.set([]);
        return true;
   }

   console.log(`Selecting project by ID: ${id}`);
   try {
       const response = await fetch(`${API_BASE_URL}/projects/${id}`);
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

       // Load related data
       await loadQuotesForProject(id);
       await loadInstructionLogsForProject(id);
       await loadSurveyorFeedback(id);
       await loadProgrammeEventsForProject(id);
       await loadUploads(id); // *** ADD CALL to load uploads ***

       return true;
   } catch (error) {
       console.error(`Failed to fetch details for project ${id}:`, error);
       selectedProject.set(null); // Clear selection on error
       // Clear related data on error
       currentProjectQuotes.set([]);
       currentInstructionLogs.set([]);
       surveyorFeedbacks.set([]); // *** CLEAR FEEDBACK STORE ***
       allProgrammeEvents.set([]);
       projectUploads.set([]); // *** Clear Uploads store on error ***
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

// Function to delete a project via API
export async function deleteProject(projectId: string) {
  if (!browser) return false;

  if (!confirm('Are you sure you want to delete this project? This cannot be undone.')) {
      return false;
  }

  try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
          method: 'DELETE',
      });

      if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`HTTP error! status: ${response.status} - ${errorData.msg || response.statusText}`);
      }

      // Remove from local stores
      projects.update(existing => existing.filter(p => p.id !== projectId));
      // Check if the deleted project was the selected one
      const currentSelected = get(selectedProject);
      if (currentSelected && currentSelected.id === projectId) {
          const remainingProjects = get(projects);
          if (remainingProjects.length > 0) {
             // Select the first remaining project
             await selectProjectById(remainingProjects[0].id);
          } else {
             // No projects left, clear selection
             selectProjectById(null);
          }
      }
      console.log(`Project ${projectId} deleted.`);
      return true;

  } catch (error) {
      console.error("Failed to delete project:", error);
      alert(`Error deleting project: ${error}`);
      return false;
  }
}

// --- Quote Interface and Store ---
export interface LineItem {
  description: string;
  cost: number;
}

export type InstructionStatus = 'pending' | 'will not be instructed' | 'partially instructed' | 'instructed';

export interface Quote {
  id: string;
  projectId: string;
  discipline: string;
  surveyType?: string;
  organisation: string;
  contactName: string;
  email?: string;
  lineItems: LineItem[];
  total: number;
  instructionStatus: InstructionStatus;
  partiallyInstructedTotal?: number;
  additionalNotes?: string;
  status?: string;
  date?: string;
  createdAt?: string;
  updatedAt?: string;
}

// --- Quote Store --- 
// Store quotes only for the *currently selected* project
export const currentProjectQuotes = writable<Quote[]>([]);

// --- Quote Functions --- 

// Function to load quotes for a specific project ID
async function loadQuotesForProject(projectId: string | null) {
  if (!browser || !projectId) {
    currentProjectQuotes.set([]); // Clear quotes if no project selected or not in browser
    return;
  }

  try {
    console.log(`Fetching quotes for project: ${projectId}`);
    const response = await fetch(`${API_BASE_URL}/quotes?projectId=${projectId}`);
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
export type WorkStatus = 'in progress' | 'completed' | 'not started';

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
const initialProgrammeEvents: ProgrammeEvent[] = [
    // Add initial dummy events if needed, linking to projectIds
    {
        id: 'evt1',
        projectId: 'project-1',
        title: 'Initial Site Assessment Due',
        date: '2023-11-15', // Example date - adjust if needed
        color: '#007bff' // Blue
    },
    {
        id: 'evt2',
        projectId: 'project-1',
        title: 'Planning Submission Target',
        date: '2023-11-30',
        color: '#ffc107' // Yellow
    },
     {
        id: 'evt3',
        projectId: 'project-2',
        title: 'Grid Connection Offer Deadline',
        date: '2023-12-10',
        color: '#dc3545' // Red
    }
];

export const allProgrammeEvents = writable<ProgrammeEvent[]>(initialProgrammeEvents);

export function addProgrammeEvent(event: Omit<ProgrammeEvent, 'id'>) {
  // Use a simple timestamp-based ID for now
  const newEvent = { ...event, id: `evt-${Date.now()}` }; 
  allProgrammeEvents.update(events => [...events, newEvent]);
}

// Function to update an existing programme event
export function updateProgrammeEvent(updatedEvent: ProgrammeEvent) {
  allProgrammeEvents.update(events => 
    events.map(event => (event.id === updatedEvent.id ? updatedEvent : event))
  );
}

// Function to delete a programme event by ID
export function deleteProgrammeEvent(eventId: string) {
  allProgrammeEvents.update(events => events.filter(event => event.id !== eventId));
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
  workStatus?: 'not started' | 'in progress' | 'completed';
  siteVisitDate?: string; // ISO date string
  reportDraftDate?: string; // ISO date string
  operationalNotes?: string;
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
    const response = await fetch(`${API_BASE_URL}/instruction-logs?projectId=${projectId}`);
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
    const response = await fetch(`${API_BASE_URL}/surveyor-feedback?projectId=${projectId}`);
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

// Function to get feedback for a specific quote (replaces getReviewForQuote)
export function getFeedbackForQuote(quoteId: string): SurveyorFeedback | undefined {
    const currentFeedback = get(surveyorFeedbacks); // Get current value from the correct store
    return currentFeedback.find(fb => fb.quoteId === quoteId);
}

// --- Upload API Functions ---

// Function to load uploads for a specific project
async function loadUploads(projectId: string | null) {
  if (!browser || !projectId) {
    projectUploads.set([]); // Clear if no project ID or not in browser
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/uploads?projectId=${projectId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    let fetchedUploads = await response.json();

    // Map _id to id using the Upload type
    const mappedUploads = mapMongoId<Upload[]>(fetchedUploads); // SPECIFY <Upload[]> type for mapping array

    projectUploads.set(mappedUploads);
  } catch (error) {
    console.error("Failed to load uploads:", error);
    projectUploads.set([]); // Reset on error
  }
}

// --- Programme Event API Functions ---

// *** ADD Function to load programme events for a project ***
async function loadProgrammeEventsForProject(projectId: string | null) {
    if (!browser || !projectId) {
        allProgrammeEvents.set([]); // Clear if no project ID or not in browser
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/programme-events?projectId=${projectId}`);
        if (!response.ok) {
            throw new Error(`HTTP error fetching programme events! status: ${response.status}`);
        }
        let fetchedEvents = await response.json();
        const mappedEvents = mapMongoId<ProgrammeEvent[]>(fetchedEvents);
        allProgrammeEvents.set(mappedEvents);
        console.log('Programme events loaded:', mappedEvents);
    } catch (error) {
        console.error("Failed to load programme events:", error);
        allProgrammeEvents.set([]); // Reset on error
    }
}

// Initial data load when the store is first imported in the browser
if (browser) {
  loadProjects();
}