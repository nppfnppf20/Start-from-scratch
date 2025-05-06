<script lang="ts">
  import { selectedProject, updateProject } from "$lib/stores/projectStore";
  import { get } from 'svelte/store';
  import { onMount, onDestroy } from 'svelte';
  import { beforeNavigate } from '$app/navigation';
  
  let disabledFields: Record<string, boolean> = {};
  let initialProjectData: typeof $selectedProject = null;
  let hasUnsavedChanges = false;
  let currentInitialDataProjectId: string | null = null;

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
          initialProjectData = JSON.parse(JSON.stringify(currentProject));
          currentInitialDataProjectId = currentProject.id;
          hasUnsavedChanges = false; 
          console.log('Project saved, initialProjectData updated, hasUnsavedChanges reset to false (Log 15).');
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
  
  <div class="legend">
    <input type="checkbox" checked disabled title="Example disabled field checkbox">
    <input type="text" value="= field fixed/frozen" disabled class="legend-text-box">
  </div>
  
  {#if $selectedProject}
    <form class="project-form" on:submit={handleSubmit}>
      <!-- Section: Basic Information -->
      <section class="form-section">
        <h2>Basic Information</h2>
        <div class="form-grid">
          <div class="form-group">
            <div class="label-with-checkbox">
              <label for="clientOrSpvName">Client (or SPV) Name</label>
              <input type="checkbox" bind:checked={disabledFields.clientName} title="Disable field">
            </div>
            <input type="text" id="clientOrSpvName" name="clientOrSpvName" bind:value={$selectedProject.clientName} disabled={disabledFields.clientName} />
          </div>
          
          <div class="form-group">
            <div class="label-with-checkbox">
              <label for="detailedDescription">Detailed Description of Development</label>
              <input type="checkbox" bind:checked={disabledFields.detailedDescription} title="Disable field">
            </div>
            <textarea id="detailedDescription" name="detailedDescription" rows="4" bind:value={$selectedProject.detailedDescription} disabled={disabledFields.detailedDescription}></textarea>
          </div>
          
          <div class="form-group">
            <div class="label-with-checkbox">
              <label for="proposedUseDuration">Proposed Use Duration (years)</label>
              <input type="checkbox" bind:checked={disabledFields.proposedUseDuration} title="Disable field">
            </div>
            <input type="number" id="proposedUseDuration" name="proposedUseDuration" min="0" bind:value={$selectedProject.proposedUseDuration} disabled={disabledFields.proposedUseDuration} use:numbersOnly />
          </div>
          
          <div class="form-group">
            <div class="label-with-checkbox">
              <label>Project Type</label>
              <input type="checkbox" bind:checked={disabledFields.projectType} title="Disable field">
            </div>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" name="projectType" value="solar" bind:group={$selectedProject.projectType} disabled={disabledFields.projectType} /> Solar
              </label>
              <label class="radio-label">
                <input type="radio" name="projectType" value="bess" bind:group={$selectedProject.projectType} disabled={disabledFields.projectType} /> BESS
              </label>
              <label class="radio-label">
                <input type="radio" name="projectType" value="solarBess" bind:group={$selectedProject.projectType} disabled={disabledFields.projectType} /> Solar & BESS
              </label>
              <label class="radio-label">
                <input type="radio" name="projectType" value="other" bind:group={$selectedProject.projectType} disabled={disabledFields.projectType} /> Other
              </label>
            </div>
          </div>
          
          <div class="form-group">
            <div class="label-with-checkbox">
              <label for="address">Address</label>
              <input type="checkbox" bind:checked={disabledFields.address} title="Disable field">
            </div>
            <textarea id="address" name="address" rows="3" bind:value={$selectedProject.address} disabled={disabledFields.address}></textarea>
          </div>
          
          <div class="form-group">
            <div class="label-with-checkbox">
              <label for="area">Area (ha)</label>
              <input type="checkbox" bind:checked={disabledFields.area} title="Disable field">
            </div>
            <input type="number" id="area" name="area" step="0.01" min="0" bind:value={$selectedProject.area} disabled={disabledFields.area} use:numbersOnly />
          </div>
          
          <div class="form-group">
            <div class="label-with-checkbox">
              <label for="localPlanningAuthority">Local Planning Authority</label>
              <input type="checkbox" bind:checked={disabledFields.localPlanningAuthority} title="Disable field">
            </div>
            <input type="text" id="localPlanningAuthority" name="localPlanningAuthority" bind:value={$selectedProject.localPlanningAuthority} disabled={disabledFields.localPlanningAuthority} />
          </div>
          
          <div class="form-group">
            <div class="label-with-checkbox">
              <label for="distributionNetwork">Distribution Network (DNO)</label>
              <input type="checkbox" bind:checked={disabledFields.distributionNetwork} title="Disable field">
            </div>
            <input type="text" id="distributionNetwork" name="distributionNetwork" bind:value={$selectedProject.distributionNetwork} disabled={disabledFields.distributionNetwork} />
          </div>
          
          <div class="form-group">
            <div class="label-with-checkbox">
              <label for="siteDesignations">Site Designations</label>
              <input type="checkbox" bind:checked={disabledFields.siteDesignations} title="Disable field">
            </div>
            <textarea id="siteDesignations" name="siteDesignations" rows="3" bind:value={$selectedProject.siteDesignations} disabled={disabledFields.siteDesignations}></textarea>
          </div>
        </div>
      </section>
      
      <!-- Section: Equipment Specification (Solar) -->
      <section class="form-section">
        <h2>Equipment Specification (Solar)</h2>
        <div class="form-grid">
          <div class="form-group">
            <div class="label-with-checkbox">
              <label for="solarExportCapacity">Solar Export Capacity (MWh)</label>
              <input type="checkbox" bind:checked={disabledFields.solarExportCapacity} title="Disable field">
            </div>
            <input type="number" id="solarExportCapacity" name="solarExportCapacity" step="0.1" min="0" bind:value={$selectedProject.solarExportCapacity} disabled={disabledFields.solarExportCapacity} use:numbersOnly />
          </div>
          
          <div class="form-group">
            <div class="label-with-checkbox">
              <label for="pvMaxPanelHeight">PV Max Panel Height (m)</label>
              <input type="checkbox" bind:checked={disabledFields.pvMaxPanelHeight} title="Disable field">
            </div>
            <input type="number" id="pvMaxPanelHeight" name="pvMaxPanelHeight" step="0.01" min="0" bind:value={$selectedProject.pvMaxPanelHeight} disabled={disabledFields.pvMaxPanelHeight} use:numbersOnly />
          </div>
          
          <div class="form-group">
            <div class="label-with-checkbox">
              <label for="fenceHeight">Fence Height (m)</label>
              <input type="checkbox" bind:checked={disabledFields.fenceHeight} title="Disable field">
            </div>
            <input type="number" id="fenceHeight" name="fenceHeight" step="0.01" min="0" bind:value={$selectedProject.fenceHeight} disabled={disabledFields.fenceHeight} use:numbersOnly />
          </div>
          
          <div class="form-group">
            <div class="label-with-checkbox">
              <label for="pvClearanceFromGround">PV Clearance from Ground (m)</label>
              <input type="checkbox" bind:checked={disabledFields.pvClearanceFromGround} title="Disable field">
            </div>
            <input type="number" id="pvClearanceFromGround" name="pvClearanceFromGround" step="0.01" min="0" bind:value={$selectedProject.pvClearanceFromGround} disabled={disabledFields.pvClearanceFromGround} use:numbersOnly />
          </div>
          
          <div class="form-group">
            <div class="label-with-checkbox">
              <label for="numberOfSolarPanels">Number of Solar Panels</label>
              <input type="checkbox" bind:checked={disabledFields.numberOfSolarPanels} title="Disable field">
            </div>
            <input type="number" id="numberOfSolarPanels" name="numberOfSolarPanels" min="0" bind:value={$selectedProject.numberOfSolarPanels} disabled={disabledFields.numberOfSolarPanels} use:numbersOnly />
          </div>
          
          <div class="form-group">
            <div class="label-with-checkbox">
              <label for="panelTilt">Panel Tilt (degrees from horizontal)</label>
              <input type="checkbox" bind:checked={disabledFields.panelTilt} title="Disable field">
            </div>
            <input type="number" id="panelTilt" name="panelTilt" step="0.1" min="0" max="90" bind:value={$selectedProject.panelTilt} disabled={disabledFields.panelTilt} use:numbersOnly />
          </div>
          
          <div class="form-group">
            <div class="label-with-checkbox">
              <label for="panelTiltDirection">Panel Tilt Direction</label>
              <input type="checkbox" bind:checked={disabledFields.panelTiltDirection} title="Disable field">
            </div>
            <select id="panelTiltDirection" name="panelTiltDirection" bind:value={$selectedProject.panelTiltDirection} disabled={disabledFields.panelTiltDirection}>
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
            <div class="label-with-checkbox">
              <label for="bessExportCapacity">BESS Export Capacity</label>
              <input type="checkbox" bind:checked={disabledFields.bessExportCapacity} title="Disable field">
            </div>
            <input type="number" id="bessExportCapacity" name="bessExportCapacity" step="0.1" min="0" bind:value={$selectedProject.bessExportCapacity} disabled={disabledFields.bessExportCapacity} use:numbersOnly />
          </div>
          
          <div class="form-group">
            <div class="label-with-checkbox">
              <label for="bessContainers">BESS No. of Containers</label>
              <input type="checkbox" bind:checked={disabledFields.bessContainers} title="Disable field">
            </div>
            <input type="number" id="bessContainers" name="bessContainers" min="0" bind:value={$selectedProject.bessContainers} disabled={disabledFields.bessContainers} use:numbersOnly />
          </div>
        </div>
      </section>
      
      <!-- Section: Project Metrics -->
      <section class="form-section">
        <h2>Project Metrics</h2>
        <div class="form-grid">
          <div class="form-group">
            <div class="label-with-checkbox">
              <label for="gwhPerYear">GWh per year</label>
              <input type="checkbox" bind:checked={disabledFields.gwhPerYear} title="Disable field">
            </div>
            <input type="number" id="gwhPerYear" name="gwhPerYear" step="0.1" min="0" bind:value={$selectedProject.gwhPerYear} disabled={disabledFields.gwhPerYear} use:numbersOnly />
          </div>
          
          <div class="form-group">
            <div class="label-with-checkbox">
              <label for="homesPowered">Homes powered per year</label>
              <input type="checkbox" bind:checked={disabledFields.homesPowered} title="Disable field">
            </div>
            <input type="number" id="homesPowered" name="homesPowered" min="0" bind:value={$selectedProject.homesPowered} disabled={disabledFields.homesPowered} use:numbersOnly />
          </div>
          
          <div class="form-group">
            <div class="label-with-checkbox">
              <label for="co2Offset">CO2 tonnes offset per year</label>
              <input type="checkbox" bind:checked={disabledFields.co2Offset} title="Disable field">
            </div>
            <input type="number" id="co2Offset" name="co2Offset" step="0.1" min="0" bind:value={$selectedProject.co2Offset} disabled={disabledFields.co2Offset} use:numbersOnly />
          </div>
          
          <div class="form-group">
            <div class="label-with-checkbox">
              <label for="equivalentCars">Equivalent no. of cars per year</label>
              <input type="checkbox" bind:checked={disabledFields.equivalentCars} title="Disable field">
            </div>
            <input type="number" id="equivalentCars" name="equivalentCars" min="0" bind:value={$selectedProject.equivalentCars} disabled={disabledFields.equivalentCars} use:numbersOnly />
          </div>
        </div>
      </section>
      
      <!-- Section: Information for Surveyors -->
      <section class="form-section">
        <h2>Information for Surveyors</h2>
        <div class="form-grid">
          <div class="form-group">
            <div class="label-with-checkbox">
              <label for="accessArrangements">Access Arrangements</label>
              <input type="checkbox" bind:checked={disabledFields.accessArrangements} title="Disable field">
            </div>
            <textarea id="accessArrangements" name="accessArrangements" rows="3" bind:value={$selectedProject.accessArrangements} disabled={disabledFields.accessArrangements}></textarea>
          </div>
          
          <div class="form-group">
            <div class="label-with-checkbox">
              <label for="accessContact">Access Contact</label>
              <input type="checkbox" bind:checked={disabledFields.accessContact} title="Disable field">
            </div>
            <input type="text" id="accessContact" name="accessContact" bind:value={$selectedProject.accessContact} disabled={disabledFields.accessContact} />
          </div>
          
          <div class="form-group">
            <div class="label-with-checkbox">
              <label for="parkingDetails">Parking Details</label>
              <input type="checkbox" bind:checked={disabledFields.parkingDetails} title="Disable field">
            </div>
            <textarea id="parkingDetails" name="parkingDetails" rows="2" bind:value={$selectedProject.parkingDetails} disabled={disabledFields.parkingDetails}></textarea>
          </div>
          
          <div class="form-group">
            <div class="label-with-checkbox">
              <label>ATV Use?</label>
              <input type="checkbox" bind:checked={disabledFields.atvUse} title="Disable field">
            </div>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" name="atvUse" value="yes" bind:group={$selectedProject.atvUse} disabled={disabledFields.atvUse} /> Yes
              </label>
              <label class="radio-label">
                <input type="radio" name="atvUse" value="no" bind:group={$selectedProject.atvUse} disabled={disabledFields.atvUse} /> No
              </label>
            </div>
          </div>
          
          <div class="form-group">
            <div class="label-with-checkbox">
              <label for="additionalNotes">Additional Notes</label>
              <input type="checkbox" bind:checked={disabledFields.additionalNotes} title="Disable field">
            </div>
            <textarea id="additionalNotes" name="additionalNotes" rows="3" bind:value={$selectedProject.additionalNotes} disabled={disabledFields.additionalNotes}></textarea>
          </div>
          
          <div class="form-group">
            <div class="label-with-checkbox">
              <label for="invoicingDetails">Invoicing Details</label>
              <input type="checkbox" bind:checked={disabledFields.invoicingDetails} title="Disable field">
            </div>
            <textarea id="invoicingDetails" name="invoicingDetails" rows="3" bind:value={$selectedProject.invoicingDetails} disabled={disabledFields.invoicingDetails}></textarea>
          </div>
        </div>
      </section>
      
      <button type="submit" class="save-button">Save Project Information</button>
    </form>
  {:else}
    <div class="no-project-selected">
      <h2>No Project Selected</h2>
      <p>Please select a project from the dropdown above to edit project information.</p>
    </div>
  {/if}
</div>

<style>
  .general-info {
    padding: 1rem 0;
  }
  
  h1 {
    margin-bottom: 1.5rem;
    color: #333;
  }
  
  h2 {
    font-size: 1.25rem;
    margin-bottom: 1rem;
    color: #555;
    border-bottom: 1px solid #ddd;
    padding-bottom: 0.5rem;
  }
  
  .project-form {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  
  .form-section {
    background-color: #fff;
    border-radius: 5px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    padding: 1.5rem;
  }
  
  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.25rem;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  label {
    font-weight: 500;
    color: #555;
  }
  
  input[type="text"],
  input[type="number"],
  textarea,
  select {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    width: 100%;
    font-family: inherit;
  }
  
  .radio-group {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  .radio-label {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-weight: normal;
  }
  
  textarea {
    resize: vertical;
    min-height: 40px;
  }
  
  .no-project-selected {
    text-align: center;
    margin: 2rem auto;
    padding: 2rem;
    background-color: #f8f9fa;
    border-radius: 0.5rem;
    border: 1px solid #dee2e6;
  }
  
  /* Styles for label + checkbox container */
  .label-with-checkbox {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
  
  .label-with-checkbox label {
    flex-grow: 1; /* Allows label to take available space */
    margin-right: 0.5rem; /* Space between label and checkbox */
    /* Override potential full width from form-group > label */
    width: auto;
  }
  
  /* Styles for disabled fields */
  input:disabled,
  textarea:disabled,
  select:disabled {
    background-color: #e9ecef;
    color: black;
    cursor: not-allowed;
  }
  
  .radio-group input[type="radio"]:disabled + * { /* Targets the text next to the radio */
    color: black;
    cursor: not-allowed;
  }
  
  .radio-label input[type="radio"]:disabled {
      cursor: not-allowed;
  }
  
  .label-with-checkbox input[type="checkbox"] {
    flex-shrink: 0; /* Prevent checkbox from shrinking */
  }
  
  /* Legend styles */
  .legend {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1.5rem; /* Add space below legend */
  }
  
  .legend input[type="checkbox"] {
    font-size: 0.9rem; /* Slightly smaller text for legend */
    background-color: #e9ecef;
    color: black;
    cursor: default; /* Indicate it's not interactive */
    width: auto; /* Fit content */
  }
  
  .legend .legend-text-box {
    /* Ensure it looks like other disabled inputs */
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.9rem; /* Slightly smaller text for legend */
    background-color: #e9ecef;
    opacity: 0.9; /* Slightly less opaque than fully disabled fields */
    color: #6c757d; /* Standard disabled text color */
    cursor: default; /* Indicate it's not interactive */
    width: auto; /* Fit content */
  }

  /* Hide number input spinners */
  /* Chrome, Safari, Edge, Opera */
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Firefox */
  input[type=number] {
    -moz-appearance: textfield;
  }

  .save-button {
    display: block;
    margin: 2rem auto 1rem; /* Center button with spacing */
    padding: 0.8rem 1.5rem;
    font-size: 1.1rem;
    background-color: #28a745; /* Green */
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  .save-button:hover {
    background-color: #218838;
  }
  .no-project-selected {
    text-align: center;
    margin-top: 2rem;
    font-style: italic;
    color: #666;
  }
</style>
