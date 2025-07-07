<script lang="ts">
  import { selectedProject, updateProject } from "$lib/stores/projectStore";
  import { authStore } from "$lib/stores/authStore";
  import { get } from 'svelte/store';
  import { onMount, onDestroy } from 'svelte';
  import { beforeNavigate } from '$app/navigation';
  
  let initialProjectData: typeof $selectedProject = null;
  let hasUnsavedChanges = false;
  let currentInitialDataProjectId: string | null = null;

  // Check if user is a surveyor (read-only access)
  $: isSurveyor = $authStore.user?.role === 'surveyor';

  function deepEqual(obj1: any, obj2: any) {
    if (obj1 === null || obj2 === null) {
      return obj1 === obj2;
    }
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
      return obj1 === obj2;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
      return false;
    }

    for (const key of keys1) {
      if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
        return false;
      }
    }
    return true;
  }

  selectedProject.subscribe(currentProject => {
    console.log('selectedProject changed (Log 1):', currentProject);
    if (currentProject) {
      if (currentProject.id !== currentInitialDataProjectId) {
        console.log('New project selected or first load. Current ID:', currentProject.id, 'Previous Initial ID:', currentInitialDataProjectId);
        initialProjectData = JSON.parse(JSON.stringify(currentProject));
        currentInitialDataProjectId = currentProject.id;
        hasUnsavedChanges = false; 
        console.log('Initial project data set (Log 2):', initialProjectData);
        console.log('hasUnsavedChanges after new project load/change (Log 3):', hasUnsavedChanges);
      } else {
        console.log('Project data changed but ID is the same. Not resetting initialProjectData. Current ID:', currentProject.id);
      }
    } else {
      console.log('No project selected. Resetting initial data trackers.');
      initialProjectData = null;
      currentInitialDataProjectId = null;
      hasUnsavedChanges = false;
      console.log('hasUnsavedChanges after project deselection (Log 3 variant):', hasUnsavedChanges);
    }
  });

  $: console.log('Reactive block evaluating (LOG R0). $selectedProject?.detailedDescription:', $selectedProject?.detailedDescription, 'hasUnsavedChanges current value:', hasUnsavedChanges);

  $: {
    if ($selectedProject && initialProjectData) {
      console.log('Reactive block: In condition (LOG R1). $selectedProject ID:', $selectedProject.id);
      const changed = !deepEqual($selectedProject, initialProjectData);
      console.log('Reactive block: deepEqual result (changed) (LOG R2):', changed);
      if (hasUnsavedChanges !== changed) {
        console.log('Comparing $selectedProject with initialProjectData (Log 4):');
        console.log('Current (Log 5):', JSON.parse(JSON.stringify($selectedProject)));
        console.log('Initial (Log 6):', JSON.parse(JSON.stringify(initialProjectData)));
        hasUnsavedChanges = changed;
        console.log('hasUnsavedChanges is now (Log 7):', hasUnsavedChanges);
      } else {
        console.log('Reactive block: hasUnsavedChanges ('+hasUnsavedChanges+') === changed ('+changed+'), no update to hasUnsavedChanges (LOG R3).');
      }
    } else if (hasUnsavedChanges) { 
        hasUnsavedChanges = false;
        console.log('No project selected or no initial data, hasUnsavedChanges reset to false (Log 8).');
    } else {
        console.log('Reactive block: No $selectedProject or no initialProjectData, and hasUnsavedChanges is false (LOG R4).');
    }
  }

  onMount(() => {
    console.log('Component mounted, adding beforeunload listener (Log 9).');
    window.addEventListener('beforeunload', handleBeforeUnload);
  });

  onDestroy(() => {
    console.log('Component destroying, removing beforeunload listener (Log 10).');
    window.removeEventListener('beforeunload', handleBeforeUnload);
  });

  beforeNavigate(({ cancel }) => {
    console.log('beforeNavigate triggered (Log 11). hasUnsavedChanges:', hasUnsavedChanges);
    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
        console.log('User cancelled navigation (Log 12).');
        cancel();
      } else {
        // User confirmed they want to leave with unsaved changes.
        // Reset $selectedProject to initialProjectData to discard unsaved changes.
        console.log('User confirmed leaving with unsaved changes. Reverting selectedProject to initialProjectData. (Log 12a)');
        if (initialProjectData) {
          selectedProject.set(JSON.parse(JSON.stringify(initialProjectData)));
          // The reactive block will automatically set hasUnsavedChanges to false
          // because $selectedProject will now be deepEqual to initialProjectData.
        } else {
          // Fallback if initialProjectData is null for some reason
          selectedProject.set(null);
        }
        // Navigation proceeds
      }
    }
  });

  function handleBeforeUnload(event: BeforeUnloadEvent) {
    console.log('handleBeforeUnload triggered (Log 13). hasUnsavedChanges:', hasUnsavedChanges);
    if (hasUnsavedChanges) {
      console.log('Preventing unload due to unsaved changes (Log 14).');
      event.preventDefault();
      event.returnValue = ''; 
      return '';
    }
  }

  // Svelte action to restrict input to numbers and allowed control keys
  function numbersOnly(node: HTMLInputElement) {
    function handleKeydown(event: KeyboardEvent) {
      const allowedKeys = [
        'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
        'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
        'Home', 'End'
      ];

      // Allow standard control keys
      if (allowedKeys.includes(event.key)) {
        return;
      }

      // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Cmd+A (for Mac)
      if ((event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())) {
        return;
      }

      // Allow decimal point only if step allows it and one doesn't already exist
      const step = node.getAttribute('step');
      const allowDecimal = step && (step === '0.1' || step === '0.01');
      if (allowDecimal && event.key === '.' && !node.value.includes('.')) {
         return;
      }

      // Allow negative sign only if min allows it and it's at the start
      const min = node.getAttribute('min');
      const allowNegative = min && parseFloat(min) < 0;
      if (allowNegative && event.key === '-' && node.value.length === 0) {
          return;
      }

      // Prevent any other non-digit key
      if (event.key.length === 1 && !/\d/.test(event.key)) {
        event.preventDefault();
      }
    }

    node.addEventListener('keydown', handleKeydown);

    return {
      destroy() {
        node.removeEventListener('keydown', handleKeydown);
      }
    };
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();

    const currentProject = get(selectedProject);

    if (currentProject) {
      console.log("Submitting updates for project:", currentProject.id, currentProject);
      const success = await updateProject(currentProject.id, currentProject);

      if (success) {
          alert("Project information saved successfully!");
          // After a successful save, the new "initial" state is the state we just saved.
          // The reactive block will now compare against this new baseline and set hasUnsavedChanges to false.
          initialProjectData = JSON.parse(JSON.stringify(get(selectedProject)));
      } else {
          alert("Failed to save project information. Check console for errors.");
      }
    } else {
        console.error("handleSubmit called but no project is selected.");
        alert("Error: No project selected to save.");
    }
  }
</script>

<div class="general-info">
  <h1>General Project Information</h1>
  
  {#if isSurveyor}
    <div class="read-only-notice">
      <p>Read only</p>
    </div>
  {/if}
  
  {#if $selectedProject}
    <form class="project-form" on:submit={handleSubmit}>
      <!-- Section: Basic Information -->
      <section class="form-section">
        <h2>Basic Information</h2>
        <div class="form-grid">
          <div class="form-group">
              <label for="clientOrSpvName">Client (or SPV) Name</label>
            <input type="text" id="clientOrSpvName" name="clientOrSpvName" bind:value={$selectedProject.clientOrSpvName} readonly={isSurveyor} />
          </div>
          
          <div class="form-group">
              <label for="detailedDescription">Detailed Description of Development</label>
            <textarea id="detailedDescription" name="detailedDescription" rows="4" bind:value={$selectedProject.detailedDescription} readonly={isSurveyor}></textarea>
          </div>
          
          <div class="form-group">
              <label for="proposedUseDuration">Proposed Use Duration (years)</label>
            <input type="number" id="proposedUseDuration" name="proposedUseDuration" min="0" bind:value={$selectedProject.proposedUseDuration} use:numbersOnly readonly={isSurveyor} />
          </div>
          
          <div class="form-group">
              <label>Project Type</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" name="projectType" value="solar" bind:group={$selectedProject.projectType} disabled={isSurveyor} /> Solar
              </label>
              <label class="radio-label">
                <input type="radio" name="projectType" value="bess" bind:group={$selectedProject.projectType} disabled={isSurveyor} /> BESS
              </label>
              <label class="radio-label">
                <input type="radio" name="projectType" value="solarBess" bind:group={$selectedProject.projectType} disabled={isSurveyor} /> Solar & BESS
              </label>
              <label class="radio-label">
                <input type="radio" name="projectType" value="other" bind:group={$selectedProject.projectType} disabled={isSurveyor} /> Other
              </label>
            </div>
          </div>
          
          <div class="form-group">
              <label for="address">Address</label>
            <textarea id="address" name="address" rows="3" bind:value={$selectedProject.address} readonly={isSurveyor}></textarea>
          </div>
          
          <div class="form-group">
              <label for="area">Area (ha)</label>
            <input type="number" id="area" name="area" step="0.01" min="0" bind:value={$selectedProject.area} use:numbersOnly readonly={isSurveyor} />
          </div>
          
          <div class="form-group">
              <label for="localPlanningAuthority">Local Planning Authority</label>
            <input type="text" id="localPlanningAuthority" name="localPlanningAuthority" bind:value={$selectedProject.localPlanningAuthority} readonly={isSurveyor} />
          </div>
          
          <div class="form-group">
              <label for="distributionNetwork">Distribution Network (DNO)</label>
            <input type="text" id="distributionNetwork" name="distributionNetwork" bind:value={$selectedProject.distributionNetwork} readonly={isSurveyor} />
          </div>
          
          <div class="form-group">
              <label for="siteDesignations">Site Designations</label>
            <textarea id="siteDesignations" name="siteDesignations" rows="3" bind:value={$selectedProject.siteDesignations} readonly={isSurveyor}></textarea>
          </div>
        </div>
      </section>

      <!-- Section: Relevant Documents -->
      <section class="form-section">
        <h2>Relevant Documents</h2>
        <div class="form-grid">
          <div class="form-group">
            <label for="sharepointLink">SharePoint Link:</label>
            {#if isSurveyor && $selectedProject.sharepointLink}
              <!-- Show clickable link for surveyors when link exists -->
              <div class="sharepoint-link-container">
                <span 
                  class="sharepoint-link-text"
                  on:click={() => window.open($selectedProject.sharepointLink, '_blank')}
                  title="Click to open SharePoint link"
                >
                  {$selectedProject.sharepointLink}
                </span>
              </div>
            {:else if isSurveyor}
              <!-- Show no link message for surveyors when no link -->
              <div class="sharepoint-link-container">
                <span class="no-link-text">No upload link configured</span>
              </div>
            {:else}
              <!-- Show editable input for admins -->
              <input 
                type="url" 
                id="sharepointLink" 
                name="sharepointLink" 
                bind:value={$selectedProject.sharepointLink} 
                placeholder="https://example.sharepoint.com/..."
                readonly={isSurveyor}
              />
            {/if}
          </div>
        </div>
      </section>

      <!-- Section: Equipment Specification (Solar) -->
      <section class="form-section">
        <h2>Equipment Specification (Solar)</h2>
        <div class="form-grid">
          <div class="form-group">
              <label for="solarExportCapacity">Solar Export Capacity (MWh)</label>
            <input type="number" id="solarExportCapacity" name="solarExportCapacity" step="0.1" min="0" bind:value={$selectedProject.solarExportCapacity} use:numbersOnly readonly={isSurveyor} />
          </div>
          
          <div class="form-group">
              <label for="pvMaxPanelHeight">PV Max Panel Height (m)</label>
            <input type="number" id="pvMaxPanelHeight" name="pvMaxPanelHeight" step="0.01" min="0" bind:value={$selectedProject.pvMaxPanelHeight} use:numbersOnly readonly={isSurveyor} />
          </div>
          
          <div class="form-group">
              <label for="fenceHeight">Fence Height (m)</label>
            <input type="number" id="fenceHeight" name="fenceHeight" step="0.01" min="0" bind:value={$selectedProject.fenceHeight} use:numbersOnly readonly={isSurveyor} />
          </div>
          
          <div class="form-group">
              <label for="pvClearanceFromGround">PV Clearance from Ground (m)</label>
            <input type="number" id="pvClearanceFromGround" name="pvClearanceFromGround" step="0.01" min="0" bind:value={$selectedProject.pvClearanceFromGround} use:numbersOnly readonly={isSurveyor} />
          </div>
          
          <div class="form-group">
              <label for="numberOfSolarPanels">Number of Solar Panels</label>
            <input type="number" id="numberOfSolarPanels" name="numberOfSolarPanels" min="0" bind:value={$selectedProject.numberOfSolarPanels} use:numbersOnly readonly={isSurveyor} />
          </div>
          
          <div class="form-group">
              <label for="panelTilt">Panel Tilt (degrees from horizontal)</label>
            <input type="number" id="panelTilt" name="panelTilt" step="0.1" min="0" max="90" bind:value={$selectedProject.panelTilt} use:numbersOnly readonly={isSurveyor} />
          </div>
          
          <div class="form-group">
              <label for="panelTiltDirection">Panel Tilt Direction</label>
            <select id="panelTiltDirection" name="panelTiltDirection" bind:value={$selectedProject.panelTiltDirection} disabled={isSurveyor}>
              <option value="">Select direction</option>
              <option value="N">North</option>
              <option value="NE">North East</option>
              <option value="E">East</option>
              <option value="SE">South East</option>
              <option value="S">South</option>
              <option value="SW">South West</option>
              <option value="W">West</option>
              <option value="NW">North West</option>
            </select>
          </div>
        </div>
      </section>
      
      <!-- Section: Equipment Specification (BESS) -->
      <section class="form-section">
        <h2>Equipment Specification (BESS)</h2>
        <div class="form-grid">
          <div class="form-group">
              <label for="bessExportCapacity">BESS Export Capacity</label>
            <input type="number" id="bessExportCapacity" name="bessExportCapacity" step="0.1" min="0" bind:value={$selectedProject.bessExportCapacity} use:numbersOnly readonly={isSurveyor} />
          </div>
          
          <div class="form-group">
              <label for="bessContainers">BESS No. of Containers</label>
            <input type="number" id="bessContainers" name="bessContainers" min="0" bind:value={$selectedProject.bessContainers} use:numbersOnly readonly={isSurveyor} />
          </div>
        </div>
      </section>
      
      <!-- Section: Project Metrics -->
      <section class="form-section">
        <h2>Project Metrics</h2>
        <div class="form-grid">
          <div class="form-group">
              <label for="gwhPerYear">GWh per year</label>
            <input type="number" id="gwhPerYear" name="gwhPerYear" step="0.1" min="0" bind:value={$selectedProject.gwhPerYear} use:numbersOnly readonly={isSurveyor} />
          </div>
          
          <div class="form-group">
              <label for="homesPowered">Homes powered per year</label>
            <input type="number" id="homesPowered" name="homesPowered" min="0" bind:value={$selectedProject.homesPowered} use:numbersOnly readonly={isSurveyor} />
          </div>
          
          <div class="form-group">
              <label for="co2Offset">CO2 tonnes offset per year</label>
            <input type="number" id="co2Offset" name="co2Offset" step="0.1" min="0" bind:value={$selectedProject.co2Offset} use:numbersOnly readonly={isSurveyor} />
          </div>
          
          <div class="form-group">
              <label for="equivalentCars">Equivalent no. of cars per year</label>
            <input type="number" id="equivalentCars" name="equivalentCars" min="0" bind:value={$selectedProject.equivalentCars} use:numbersOnly readonly={isSurveyor} />
          </div>
        </div>
      </section>
      
      <!-- Section: Information for Surveyors -->
      <section class="form-section">
        <h2>Information for Surveyors</h2>
        <div class="form-grid">
          <div class="form-group">
              <label for="accessArrangements">Access Arrangements</label>
            <textarea id="accessArrangements" name="accessArrangements" rows="3" bind:value={$selectedProject.accessArrangements} readonly={isSurveyor}></textarea>
          </div>
          
          <div class="form-group">
              <label for="accessContact">Access Contact</label>
            <input type="text" id="accessContact" name="accessContact" bind:value={$selectedProject.accessContact} readonly={isSurveyor} />
          </div>
          
          <div class="form-group">
              <label for="parkingDetails">Parking Details</label>
            <textarea id="parkingDetails" name="parkingDetails" rows="2" bind:value={$selectedProject.parkingDetails} readonly={isSurveyor}></textarea>
          </div>
          
          <div class="form-group">
              <label>ATV Use?</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" name="atvUse" value="yes" bind:group={$selectedProject.atvUse} disabled={isSurveyor} /> Yes
              </label>
              <label class="radio-label">
                <input type="radio" name="atvUse" value="no" bind:group={$selectedProject.atvUse} disabled={isSurveyor} /> No
              </label>
            </div>
          </div>
          
          <div class="form-group">
              <label for="additionalNotes">Additional Notes</label>
            <textarea id="additionalNotes" name="additionalNotes" rows="3" bind:value={$selectedProject.additionalNotes} readonly={isSurveyor}></textarea>
          </div>
          
          <div class="form-group">
              <label for="invoicingDetails">Invoicing Details</label>
            <textarea id="invoicingDetails" name="invoicingDetails" rows="3" bind:value={$selectedProject.invoicingDetails} readonly={isSurveyor}></textarea>
          </div>
        </div>
      </section>
      
      <div class="form-actions">
        <button type="submit" class="save-button" disabled={isSurveyor}>Save Changes</button>
      </div>
    </form>
  {:else}
    <div class="no-project-selected">
      <h2>No Project Selected</h2>
      <p>Please select a project from the dropdown above to edit project information.</p>
    </div>
  {/if}
</div>

<style>
  /* General page styling */
  :global(body) { /* Apply to body for overall background */
    background-color: #f8f9fa; /* Light grey background like the dashboard */
    font-family: 'Inter', sans-serif; /* Common modern sans-serif font */
  }

  .general-info {
    padding: 2rem 1rem; /* Adjusted padding for wider layout */
    /* max-width: 1200px; */ /* Removed to allow wider content */
    /* margin: 0 auto; */ /* Not needed if not max-width constrained */
  }
  
  h1 {
    font-size: 1.8rem; /* Slightly larger */
    font-weight: 600; /* Bolder */
    margin-bottom: 2rem; /* More space below */
    color: #1a202c; /* Darker text color */
  }
  
  h2 {
    font-size: 1.3rem; /* Slightly larger */
    font-weight: 500; /* Medium weight */
    margin-bottom: 1.5rem; /* More space */
    color: #2d3748; /* Slightly lighter dark color */
    border-bottom: 1px solid #e2e8f0; /* Lighter border */
    padding-bottom: 0.75rem; /* More padding below */
  }
  
  .project-form {
    display: flex;
    flex-direction: column;
    gap: 2.5rem; /* Increased gap between sections */
  }
  
  /* Card-like styling for form sections */
  .form-section {
    background-color: #ffffff; /* White background for cards */
    border-radius: 8px; /* Rounded corners */
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); /* Softer shadow */
    padding: 2rem; /* Increased padding */
    border: 1px solid #e2e8f0; /* Subtle border */
  }
  
  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem; /* Increased gap */
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.6rem; /* Slightly increased gap */
  }
  
  label {
    font-weight: 500;
    color: #4a5568; /* Softer text color */
    font-size: 0.9rem; /* Slightly smaller label */
  }
  
  /* Input field styling */
  input[type="text"],
  input[type="number"],
  textarea,
  select {
    padding: 0.75rem; /* More padding */
    border: 1px solid #cbd5e0; /* Lighter border */
    border-radius: 6px; /* Slightly more rounded */
    font-size: 1rem;
    width: 100%;
    font-family: inherit;
    background-color: #fff; /* Ensure white background */
    transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out; /* Smooth transitions */
  }

  input[type="text"]:focus,
  input[type="number"]:focus,
  textarea:focus,
  select:focus {
      border-color: #4299e1; /* Blue border on focus */
      box-shadow: 0 0 0 1px #4299e1; /* Subtle blue glow */
      outline: none; /* Remove default outline */
  }

  /* Readonly styling to match documents page */
  input[type="text"][readonly],
  input[type="number"][readonly],
  textarea[readonly] {
    background-color: #f9fafb;
    color: #6b7280;
  }
  
  .radio-group {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-top: 0.25rem; /* Add a bit of space above radio buttons */
  }
  
  .radio-label {
    display: flex;
    align-items: center;
    gap: 0.5rem; /* Increased gap */
    font-weight: normal;
    color: #4a5568;
  }

  /* Style radio buttons themselves for better visibility */
  input[type="radio"] {
    appearance: none;
    width: 16px;
    height: 16px;
    border: 1px solid #cbd5e0;
    border-radius: 50%;
    position: relative;
    cursor: pointer;
    transition: border-color 0.2s ease-in-out;
  }

  input[type="radio"]:checked {
    border-color: #3182ce; /* Blue border when checked */
  }

  input[type="radio"]:checked::before {
    content: '';
    display: block;
    width: 8px;
    height: 8px;
    background-color: #3182ce; /* Blue dot */
    border-radius: 50%;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  
  textarea {
    resize: vertical;
    min-height: 80px; /* Taller default height */
  }
  
  .no-project-selected {
    text-align: center;
    margin: 3rem auto; /* More margin */
    padding: 2.5rem;
    background-color: #ffffff; /* White background */
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    color: #718096; /* Softer text color */
  }
  
  /* Styles for disabled fields */
  input:disabled,
  textarea:disabled,
  select:disabled {
    background-color: #e2e8f0; /* Lighter disabled background */
    color: #718096; /* Greyer disabled text */
    cursor: not-allowed;
    border-color: #cbd5e0; /* Ensure border matches other disabled */
  }
  
  .radio-group input[type="radio"]:disabled + * { 
    color: #a0aec0; /* Even lighter color for disabled radio text */
    cursor: not-allowed;
  }
  
  input[type="radio"]:disabled {
    border-color: #e2e8f0;
    background-color: #edf2f7;
    cursor: not-allowed;
  }
  input[type="radio"]:disabled:checked::before {
     background-color: #a0aec0; /* Grey dot for disabled checked */
  }

  /* Hide number input spinners */
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type=number] {
    -moz-appearance: textfield;
  }

  /* Button Styling */
  .save-button {
    display: block;
    margin: 2.5rem auto 1.5rem; /* More spacing */
    padding: 0.9rem 2rem; /* Larger padding */
    font-size: 1.1rem;
    font-weight: 500; /* Medium weight */
    /* background-color: #3182ce; Blue like image accents */
    background-color: #2f855a; /* A green like the 'Active' status */
    color: white;
    border: none;
    border-radius: 6px; /* Match input rounding */
    cursor: pointer;
    transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  .save-button:hover {
    /* background-color: #2b6cb0; Darker blue */
    background-color: #276749; /* Darker green */
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); /* Larger shadow on hover */
  }
  .save-button:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.5); /* Focus ring like inputs */
  }

  .read-only-notice {
    background-color: #fed7d7;
    color: #c53030;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 1.5rem;
  }

  .read-only-notice p {
    margin: 0;
  }

  /* SharePoint Link Styling */
  .sharepoint-link-container {
    position: relative;
    display: inline-block;
  }

  .sharepoint-link-text {
    color: #007bff;
    text-decoration: none;
    font-weight: 600;
    cursor: pointer;
    font-size: 0.9rem;
  }

  .sharepoint-link-text:hover {
    text-decoration: underline;
  }

  .no-link-text {
    color: #6c757d;
    font-style: italic;
    font-size: 0.9rem;
  }

  /* URL input styling */
  input[type="url"] {
    padding: 0.75rem;
    border: 1px solid #cbd5e0;
    border-radius: 6px;
    font-size: 1rem;
    width: 100%;
    font-family: inherit;
    background-color: #fff;
    transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  }

  input[type="url"]:focus {
    border-color: #4299e1;
    box-shadow: 0 0 0 1px #4299e1;
    outline: none;
  }

  input[type="url"][readonly] {
    background-color: #f9fafb;
    color: #6b7280;
  }
</style>
