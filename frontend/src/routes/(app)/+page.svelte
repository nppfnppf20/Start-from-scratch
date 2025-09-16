<script lang="ts">
  import PageHeader from "$lib/components/PageHeader.svelte";
  import { selectedProject, updateProject } from "$lib/stores/projectStore";
  import { isAuthenticated, user } from "../../store";
  import { get } from 'svelte/store';

  // Check if user is a surveyor (read-only access)
  $: isSurveyor = $user?.role === 'surveyor';
  
  // Save state management
  let saving = false;
  let justSaved = false;

  // Dynamic button text
  $: buttonText = saving ? "Saving..." : justSaved ? "Saved ✓" : "Save Project Information";

  // Format last saved date
  function formatLastSaved(updatedAt: string | undefined): string {
    if (!updatedAt) return "";
    
    const date = new Date(updatedAt);
    const today = new Date();
    
    // Check if it's today
    if (date.toDateString() === today.toDateString()) {
      return `Last saved today at ${date.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    } else {
      return `Last saved ${date.toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      })} at ${date.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
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

    saving = true;
    const currentProject = get(selectedProject);

    if (currentProject) {
      console.log("Submitting updates for project:", currentProject.id, currentProject);
      const success = await updateProject(currentProject.id, currentProject);

      saving = false;

      if (success) {
          justSaved = true;
          setTimeout(() => justSaved = false, 3000); // Reset after 3 seconds
      } else {
          alert("Failed to save project information. Check console for errors.");
      }
    } else {
        saving = false;
        console.error("handleSubmit called but no project is selected.");
        alert("Error: No project selected to save.");
    }
  }
</script>

<div class="page-container">
  <PageHeader
    title="General Project Information"
    subtitle={$selectedProject ? `Project information for ${$selectedProject.name}` : undefined}
  >
    <div slot="actions" class="header-actions-wrapper">
      {#if $selectedProject?.updatedAt}
        <div class="last-saved-info">
          {formatLastSaved($selectedProject.updatedAt)}
        </div>
      {/if}

      {#if $selectedProject && !isSurveyor}
        <button
          type="button"
          class="save-button-header"
          class:saving={saving}
          class:saved={justSaved}
          on:click={handleSubmit}
          disabled={saving}
        >
          {buttonText}
        </button>
      {/if}
    </div>
  </PageHeader>

  {#if $selectedProject}
    <div class="general-info">
      {#if isSurveyor}
        <div class="read-only-notice">
          <p>Read only</p>
        </div>
      {/if}
      
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
                <label for="sharepointLink">SharePoint Link</label>
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
                  <label for="accessContact">Access Contact Details</label>
                <textarea id="accessContact" name="accessContact" rows="3" bind:value={$selectedProject.accessContact} readonly={isSurveyor}></textarea>
              </div>
              
              <div class="form-group">
                  <label for="parkingDetails">Parking Details</label>
                <textarea id="parkingDetails" name="parkingDetails" rows="3" bind:value={$selectedProject.parkingDetails} readonly={isSurveyor}></textarea>
              </div>
              
              <div class="form-group">
                <label>ATV Use</label>
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
                <textarea id="additionalNotes" name="additionalNotes" rows="4" bind:value={$selectedProject.additionalNotes} readonly={isSurveyor}></textarea>
              </div>
              
              <div class="form-group">
                  <label for="invoicingDetails">Invoicing Details</label>
                <textarea id="invoicingDetails" name="invoicingDetails" rows="3" bind:value={$selectedProject.invoicingDetails} readonly={isSurveyor}></textarea>
              </div>
            </div>
          </section>
          
          {#if !isSurveyor}
          <!-- Save Button at the bottom -->
          <div class="bottom-save-container">
            <button 
              type="button" 
              class="save-button" 
              class:saving={saving}
              class:saved={justSaved}
              on:click={handleSubmit}
              disabled={saving}
            >
              {buttonText}
            </button>
          </div>
          {/if}
        </form>
      </div>
    {:else}
      <div class="no-project-selected">
        <h2>No Project Selected</h2>
        <p>Please select a project from the dropdown above to edit project information.</p>
      </div>
    {/if}
  </div>

<style>
  .page-container {
    padding: 1rem 2rem;
  }

  .header-actions-wrapper {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }

  /* General page styling */
  :global(body) { /* Apply to body for overall background */
    background-color: #f8f9fa; /* Light grey background like the dashboard */
    font-family: 'Inter', sans-serif; /* Common modern sans-serif font */
  }

  .last-saved-info {
    font-size: 0.85rem;
    color: #6b7280;
    font-style: italic;
  }

  .save-button-header {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: 500;
    background-color: #2f855a; /* Green matching the theme */
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  .save-button-header:hover:not(:disabled) {
    background-color: #276749; /* Darker green */
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }

  .save-button-header:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.5);
  }

  .save-button-header:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .save-button-header.saving {
    background-color: #4a5568; /* Grey during saving */
  }

  .save-button-header.saved {
    background-color: #38a169; /* Brighter green when saved */
  }

  /* General Info Container */
  .general-info {
    padding: 1.5rem;
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
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
  
  .read-only-notice {
    display: inline-block;
    background-color: #f7fafc; /* Light, neutral grey */
    color: #4a5568;            /* Darker grey for text, matches labels */
    border: 1px solid #e2e8f0; /* Subtle grey border, matches other elements */
    padding: 0.5rem 1rem;      /* More fitting padding for a smaller element */
    border-radius: 6px;        /* Consistent with buttons */
    margin-bottom: 1.5rem;
    font-weight: 500;
  }

  .read-only-notice p {
    margin: 0; /* Remove default paragraph margin */
  }

  /* Form Section and Grid Layout */
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

  /* Bottom Save Button Container */
  .bottom-save-container {
    text-align: center;
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0;
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
  .save-button:hover:not(:disabled) {
    /* background-color: #2b6cb0; Darker blue */
    background-color: #276749; /* Darker green */
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); /* Larger shadow on hover */
  }
  .save-button:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.5); /* Focus ring like inputs */
  }
  .save-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  .save-button.saving {
    background-color: #4a5568; /* Grey during saving */
  }
  .save-button.saved {
    background-color: #38a169; /* Brighter green when saved */
  }

  /* SharePoint Link Styles */
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

  input[type="url"] {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.9rem;
    transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    background-color: #ffffff;
  }

  input[type="url"]:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 1px #3b82f6;
    outline: none;
  }

  input[type="url"][readonly] {
    background-color: #f9fafb;
    color: #6b7280;
  }
</style>
