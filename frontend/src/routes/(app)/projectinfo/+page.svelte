<script lang="ts">
  import PageHeader from "$lib/components/PageHeader.svelte";
  import { selectedProject, updateProject } from "$lib/stores/projectStore";
  import { authStore } from "$lib/stores/authStore";
  import { get } from 'svelte/store';
  import SaveBar from '$lib/components/projectinfo/SaveBar.svelte';
  import FormSection from '$lib/components/projectinfo/FormSection.svelte';
  import { numbersOnly } from '$lib/actions/numbersOnly';

  // Check if user is a surveyor (read-only access)
  $: isSurveyor = $authStore.user?.role === 'surveyor';

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
    if (date.toDateString() === today.toDateString()) {
      return `Last saved today at ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return `Last saved ${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} at ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
    }
  }

  // Local form model & dirty tracking
  let formData: any = null;
  $: if ($selectedProject) {
    formData = { ...$selectedProject };
  } else {
    formData = null;
  }

  function isDirty(): boolean {
    if (!formData || !$selectedProject) return false;
    const baseline = get(selectedProject) as any;
    return Object.keys(formData).some((k) => (formData as any)[k] !== baseline[k]);
  }

  async function handleSubmit(event?: Event) {
    event?.preventDefault();
    if (!formData || !$selectedProject) {
      alert('Error: No project selected to save.');
      return;
    }
    saving = true;
    const success = await updateProject($selectedProject.id, formData);
    saving = false;
    if (success) {
      justSaved = true;
      setTimeout(() => (justSaved = false), 3000);
    } else {
      alert('Failed to save project information. Check console for errors.');
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
          <FormSection title="Basic Information">
              <div class="form-group">
                  <label for="clientOrSpvName">Client (or SPV) Name</label>
                <input type="text" id="clientOrSpvName" name="clientOrSpvName" bind:value={formData.clientOrSpvName} readonly={isSurveyor} />
              </div>
              
              <div class="form-group">
                  <label for="detailedDescription">Detailed Description of Development</label>
                <textarea id="detailedDescription" name="detailedDescription" rows="4" bind:value={formData.detailedDescription} readonly={isSurveyor}></textarea>
              </div>
              
              <div class="form-group">
                  <label for="proposedUseDuration">Proposed Use Duration (years)</label>
                <input type="number" id="proposedUseDuration" name="proposedUseDuration" min="0" bind:value={formData.proposedUseDuration} use:numbersOnly readonly={isSurveyor} />
              </div>
              
              <div class="form-group">
                  <span class="group-label">Project Type</span>
                <div class="radio-group">
                  <label class="radio-label">
                    <input type="radio" name="projectType" value="solar" bind:group={formData.projectType} disabled={isSurveyor} /> Solar
                  </label>
                  <label class="radio-label">
                    <input type="radio" name="projectType" value="bess" bind:group={formData.projectType} disabled={isSurveyor} /> BESS
                  </label>
                  <label class="radio-label">
                    <input type="radio" name="projectType" value="solarBess" bind:group={formData.projectType} disabled={isSurveyor} /> Solar & BESS
                  </label>
                  <label class="radio-label">
                    <input type="radio" name="projectType" value="other" bind:group={formData.projectType} disabled={isSurveyor} /> Other
                  </label>
                </div>
              </div>
              
              <div class="form-group">
                  <label for="address">Address</label>
                <textarea id="address" name="address" rows="3" bind:value={formData.address} readonly={isSurveyor}></textarea>
              </div>
              
              <div class="form-group">
                  <label for="area">Area (ha)</label>
                <input type="number" id="area" name="area" step="0.01" min="0" bind:value={formData.area} use:numbersOnly readonly={isSurveyor} />
              </div>
              
              <div class="form-group">
                  <label for="localPlanningAuthority">Local Planning Authority</label>
                <input type="text" id="localPlanningAuthority" name="localPlanningAuthority" bind:value={formData.localPlanningAuthority} readonly={isSurveyor} />
              </div>
              
              <div class="form-group">
                  <label for="distributionNetwork">Distribution Network (DNO)</label>
                <input type="text" id="distributionNetwork" name="distributionNetwork" bind:value={formData.distributionNetwork} readonly={isSurveyor} />
              </div>
              
               <div class="form-group">
                  <label for="siteDesignations">Site Designations</label>
                <textarea id="siteDesignations" name="siteDesignations" rows="3" bind:value={formData.siteDesignations} readonly={isSurveyor}></textarea>
              </div>
          </FormSection>
          
          <!-- Section: Relevant Documents -->
          <FormSection title="Relevant Documents">
              <div class="form-group">
                <label for="sharepointLink">SharePoint Link</label>
                {#if isSurveyor && $selectedProject.sharepointLink}
                  <!-- Show clickable link for surveyors when link exists -->
                  <div class="sharepoint-link-container">
                    <a
                      class="sharepoint-link-text"
                      href={$selectedProject.sharepointLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Click to open SharePoint link"
                    >
                      {$selectedProject.sharepointLink}
                    </a>
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
                    bind:value={formData.sharepointLink} 
                    placeholder="https://example.sharepoint.com/..."
                    readonly={isSurveyor}
                  />
                {/if}
              </div>
          </FormSection>
          
          <!-- Section: Equipment Specification (Solar) -->
          <FormSection title="Equipment Specification (Solar)">
              <div class="form-group">
                  <label for="solarExportCapacity">Solar Export Capacity (MWh)</label>
                <input type="number" id="solarExportCapacity" name="solarExportCapacity" step="0.1" min="0" bind:value={formData.solarExportCapacity} use:numbersOnly readonly={isSurveyor} />
              </div>
              
              <div class="form-group">
                  <label for="pvMaxPanelHeight">PV Max Panel Height (m)</label>
                <input type="number" id="pvMaxPanelHeight" name="pvMaxPanelHeight" step="0.01" min="0" bind:value={formData.pvMaxPanelHeight} use:numbersOnly readonly={isSurveyor} />
              </div>
              
              <div class="form-group">
                  <label for="fenceHeight">Fence Height (m)</label>
                <input type="number" id="fenceHeight" name="fenceHeight" step="0.01" min="0" bind:value={formData.fenceHeight} use:numbersOnly readonly={isSurveyor} />
              </div>
              
              <div class="form-group">
                  <label for="pvClearanceFromGround">PV Clearance from Ground (m)</label>
                <input type="number" id="pvClearanceFromGround" name="pvClearanceFromGround" step="0.01" min="0" bind:value={formData.pvClearanceFromGround} use:numbersOnly readonly={isSurveyor} />
              </div>
              
              <div class="form-group">
                  <label for="numberOfSolarPanels">Number of Solar Panels</label>
                <input type="number" id="numberOfSolarPanels" name="numberOfSolarPanels" min="0" bind:value={formData.numberOfSolarPanels} use:numbersOnly readonly={isSurveyor} />
              </div>
              
              <div class="form-group">
                  <label for="panelTilt">Panel Tilt (degrees from horizontal)</label>
                <input type="number" id="panelTilt" name="panelTilt" step="0.1" min="0" max="90" bind:value={formData.panelTilt} use:numbersOnly readonly={isSurveyor} />
              </div>
              
              <div class="form-group">
                  <label for="panelTiltDirection">Panel Tilt Direction</label>
                <select id="panelTiltDirection" name="panelTiltDirection" bind:value={formData.panelTiltDirection} disabled={isSurveyor}>
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
          </FormSection>
          
          <!-- Section: Equipment Specification (BESS) -->
          <FormSection title="Equipment Specification (BESS)">
              <div class="form-group">
                  <label for="bessExportCapacity">BESS Export Capacity</label>
                <input type="number" id="bessExportCapacity" name="bessExportCapacity" step="0.1" min="0" bind:value={formData.bessExportCapacity} use:numbersOnly readonly={isSurveyor} />
              </div>
              
              <div class="form-group">
                  <label for="bessContainers">BESS No. of Containers</label>
                <input type="number" id="bessContainers" name="bessContainers" min="0" bind:value={formData.bessContainers} use:numbersOnly readonly={isSurveyor} />
              </div>
          </FormSection>
          
          <!-- Section: Project Metrics -->
          <FormSection title="Project Metrics">
              <div class="form-group">
                  <label for="gwhPerYear">GWh per year</label>
                <input type="number" id="gwhPerYear" name="gwhPerYear" step="0.1" min="0" bind:value={formData.gwhPerYear} use:numbersOnly readonly={isSurveyor} />
              </div>
              
              <div class="form-group">
                  <label for="homesPowered">Homes powered per year</label>
                <input type="number" id="homesPowered" name="homesPowered" min="0" bind:value={formData.homesPowered} use:numbersOnly readonly={isSurveyor} />
              </div>
              
              <div class="form-group">
                  <label for="co2Offset">CO2 tonnes offset per year</label>
                <input type="number" id="co2Offset" name="co2Offset" step="0.1" min="0" bind:value={formData.co2Offset} use:numbersOnly readonly={isSurveyor} />
              </div>
              
              <div class="form-group">
                  <label for="equivalentCars">Equivalent no. of cars per year</label>
                <input type="number" id="equivalentCars" name="equivalentCars" min="0" bind:value={formData.equivalentCars} use:numbersOnly readonly={isSurveyor} />
              </div>
          </FormSection>
          
          <!-- Section: Information for Surveyors -->
          <FormSection title="Information for Surveyors">
              <div class="form-group">
                  <label for="accessArrangements">Access Arrangements</label>
                <textarea id="accessArrangements" name="accessArrangements" rows="3" bind:value={formData.accessArrangements} readonly={isSurveyor}></textarea>
              </div>
              
              <div class="form-group">
                  <label for="accessContact">Access Contact Details</label>
                <textarea id="accessContact" name="accessContact" rows="3" bind:value={formData.accessContact} readonly={isSurveyor}></textarea>
              </div>
              
              <div class="form-group">
                  <label for="parkingDetails">Parking Details</label>
                <textarea id="parkingDetails" name="parkingDetails" rows="3" bind:value={formData.parkingDetails} readonly={isSurveyor}></textarea>
              </div>
              
              <div class="form-group">
                <span class="group-label">ATV Use</span>
                <div class="radio-group">
                  <label class="radio-label">
                    <input type="radio" name="atvUse" value="yes" bind:group={formData.atvUse} disabled={isSurveyor} /> Yes
                  </label>
                  <label class="radio-label">
                    <input type="radio" name="atvUse" value="no" bind:group={formData.atvUse} disabled={isSurveyor} /> No
                  </label>
                </div>
              </div>
              
              <div class="form-group">
                  <label for="additionalNotes">Additional Notes</label>
                <textarea id="additionalNotes" name="additionalNotes" rows="4" bind:value={formData.additionalNotes} readonly={isSurveyor}></textarea>
              </div>
              
              <div class="form-group">
                  <label for="invoicingDetails">Invoicing Details</label>
                <textarea id="invoicingDetails" name="invoicingDetails" rows="3" bind:value={formData.invoicingDetails} readonly={isSurveyor}></textarea>
              </div>
          </FormSection>
          
          {#if !isSurveyor}
          <!-- Save Bar -->
          <div class="bottom-save-container">
            <SaveBar
              saving={saving}
              justSaved={justSaved}
              disabled={!isDirty()}
              onClick={handleSubmit}
            />
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
  :global(body) {
    background-color: #f8f9fa;
    font-family: 'Inter', sans-serif;
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
    background-color: #2f855a;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  .save-button-header:hover:not(:disabled) {
    background-color: #276749;
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

  .save-button-header.saving { background-color: #4a5568; }
  .save-button-header.saved { background-color: #38a169; }

  .general-info {
    padding: 1.5rem;
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  .project-form { display: flex; flex-direction: column; gap: 2.5rem; }

  .group-label { font-weight: 500; color: #4a5568; font-size: 0.9rem; }

  .read-only-notice { display: inline-block; background-color: #f7fafc; color: #4a5568; border: 1px solid #e2e8f0; padding: 0.5rem 1rem; border-radius: 6px; margin-bottom: 1.5rem; font-weight: 500; }
  .read-only-notice p { margin: 0; }

  .no-project-selected {
    text-align: center; margin: 3rem auto; padding: 2.5rem; background-color: #ffffff;
    border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); color: #718096;
  }

  .bottom-save-container { text-align: center; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0; }

  .sharepoint-link-container { position: relative; display: inline-block; }
  .sharepoint-link-text { color: #007bff; text-decoration: none; font-weight: 600; cursor: pointer; font-size: 0.9rem; }
  .sharepoint-link-text:hover { text-decoration: underline; }
  .no-link-text { color: #6c757d; font-style: italic; font-size: 0.9rem; }
  input[type="url"] { width: 100%; padding: 0.75rem 1rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.9rem; transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out; background-color: #ffffff; }
  input[type="url"]:focus { border-color: #3b82f6; box-shadow: 0 0 0 1px #3b82f6; outline: none; }
  input[type="url"][readonly] { background-color: #f9fafb; color: #6b7280; }
</style>

