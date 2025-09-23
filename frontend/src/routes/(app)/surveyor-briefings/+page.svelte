<script lang="ts">
  import PageHeader from '$lib/components/PageHeader.svelte';
  import SurveyorBankTable from '$lib/components/SurveyorBankTableBriefings.svelte';
  import { selectedProject, authorizeSurveyors, createFeeQuoteLog } from '$lib/stores/projectStore';
  import { emailTemplates, disciplineSpecificSections } from '$lib/data/emailTemplates';
  import ConfirmRequestSentModal from '$lib/components/ConfirmRequestSentModal.svelte';
  import FeeQuoteHistoryModal from '$lib/components/FeeQuoteHistoryModal.svelte';

  const disciplines = [
    'Agricultural Land and Soil',
    'Arboriculture',
    'Contaminated Land',
    'Ecology',
    'Fire Safety',
    'Flood and Drainage',
    'Geophys',
    'Glint & Glare',
    'Heritage',
    'Landscape and Visual',
    'PR/Communications and Consultation',
    'Topographical',
    'Transport',
    'Other'
  ];

  const surveyTypeMapping: { [key: string]: string[] } = {
    'Arboriculture': [
      'Arboricultural Impact Assessment',
      'Tree Protection Plan',
      'Tree Survey'
    ],
    'Ecology': [
      'Badger Survey',
      'Biodiversity Net Gain Assessment',
      'Ecological Enhancement Management Plan',
      'Ecological Impact Assessment',
      'GCN Survey',
      'Preliminary Ecological Appraisal',
      'Protected Species Surveys',
      'Skylark Survey',
      'Wintering Birds Survey'
    ],
    'Contaminated Land': [
      'Contaminated Land Assessment'
    ],
    'Fire Safety': [
      'Fire Safety Assessment'
    ],
    'Flood and Drainage': [
      'Flood Risk Assessment',
      'Surface Water Drainage Strategy'
    ],
    'Geophys': [
      'Geophysical Survey'
    ],
    'Glint & Glare': [
      'Glint & Glare Assessment'
    ],
    'Heritage': [
      'Heritage Impact Assessment'
    ],
    'Landscape and Visual': [
      'Landscape and Visual Impact Assessment',
      'Residential Visual Impact Assessment',
      'Photomontages',
      'Landscaping Strategy'
    ],
    'Topographical': [
      'Topographical Survey'
    ],
    'Transport': [
      'Transport Statement',
      'Construction Traffic Management Plan'
    ],
    'Agricultural Land and Soil': [
      'Agricultural Land Classification Survey',
      'Soil Management Plan'
    ]
  };

  let selectedDisciplines: string[] = [];
  let selectedSurveyTypes: string[] = [];
  let emailTo = '';
  let emailSubject = '';
  let emailBody = '';
  let showConfirmModal = false;
  let showFeeQuoteHistoryModal = false;

  $: availableSurveyTypes = selectedDisciplines.length > 0
    ? selectedDisciplines.flatMap(d => surveyTypeMapping[d] || [])
    : Object.values(surveyTypeMapping).flat();
  
  $: {
    // Always use the base template
    const template = emailTemplates['base'];
    let subject = template.subject;
    let body = template.body;

    // Perform mail merge for project name
    if ($selectedProject) {
      const projectName = $selectedProject.name;
      subject = subject.replace(/\[Project\s*Name\]/gi, projectName || '<mark>[Insert]</mark>');
      body = body.replace(/\[Project\s*Name\]/gi, projectName || '<mark>[Insert]</mark>');

      // Populate other placeholders
      body = body.replace(/\[Client \(or SPV\) Name\]/gi, $selectedProject.clientOrSpvName || '<mark>[Insert]</mark>');
      
      // Format project type - convert "solarBESS" to "Solar & BESS"
      let projectType = $selectedProject.projectType || '';
      if (projectType.toLowerCase() === 'solarbess') {
        projectType = 'Solar & BESS';
      }
      body = body.replace(/\[Project Type\]/gi, projectType || '<mark>[Insert]</mark>');
      
      body = body.replace(/\[Area \(ha\)\]/gi, $selectedProject.area?.toString() || '<mark>[Insert]</mark>');
      body = body.replace(/\[Address\]/gi, $selectedProject.address || '<mark>[Insert]</mark>');
      body = body.replace(/\[Site Designations\]/gi, $selectedProject.siteDesignations || '<mark>[Insert]</mark>');
      body = body.replace(/\[Invoicing details\]/gi, $selectedProject.invoicingDetails || '<mark>[Insert]</mark>');
    } else {
      // No project selected - use placeholders for all project-related fields
      subject = subject.replace(/\[Project\s*Name\]/gi, '<mark>[Insert]</mark>');
      body = body.replace(/\[Project\s*Name\]/gi, '<mark>[Insert]</mark>');
      body = body.replace(/\[Client \(or SPV\) Name\]/gi, '<mark>[Insert]</mark>');
      body = body.replace(/\[Project Type\]/gi, '<mark>[Insert]</mark>');
      body = body.replace(/\[Area \(ha\)\]/gi, '<mark>[Insert]</mark>');
      body = body.replace(/\[Address\]/gi, '<mark>[Insert]</mark>');
      body = body.replace(/\[Site Designations\]/gi, '<mark>[Insert]</mark>');
      body = body.replace(/\[Invoicing details\]/gi, '<mark>[Insert]</mark>');
    }
    
    const surveyTypesList = selectedSurveyTypes.length > 0
      ? '<ul style="margin:0; padding-left:1.25em;">' + selectedSurveyTypes.map(st => `<li>${st}</li>`).join('') + '</ul>'
      : '<mark>[Insert or select surveys]</mark>';
    body = body.replace(/\[Survey Types\]/gi, surveyTypesList);
    
    // Add discipline-specific content based on selected disciplines
    const disciplineContent = selectedDisciplines
      .filter(discipline => disciplineSpecificSections[discipline])
      .map(discipline => disciplineSpecificSections[discipline])
      .join('<br/>');
    
    body = body.replace(/\[Discipline Specific Content\]/gi, disciplineContent);
    
    emailSubject = subject;
    emailBody = body;
  }

  function handleSelectSurveyor(event: CustomEvent<{ email: string }>) {
    const newEmail = event.detail.email;
    if (emailTo.includes(newEmail)) return; // Don't add duplicates
    
    if (emailTo) {
      emailTo += `, ${newEmail}`;
    } else {
      emailTo = newEmail;
    }
  }

  function handleOpenEmail() {
    if (!emailTo) {
      alert('Please select at least one surveyor to email.');
      return;
    }

    // Convert HTML body to plain text for mailto link
    const plainTextBody = emailBody
      .replace(/<br\s*\/?>(?=\s*\n?)/gi, '\n')
      .replace(/<li[^>]*>/gi, '\n• ')
      .replace(/<mark[^>]*>/gi, '')
      .replace(/<\/mark>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim();

    const mailtoLink = `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(plainTextBody)}`;
    window.location.href = mailtoLink;
  }

  async function handleConfirmation() {
    if ($selectedProject && emailTo) {
      const emails = emailTo.split(',').map(e => e.trim()).filter(e => e);
      if (emails.length > 0) {
        // 1. CREATE FEE QUOTE LOG (NEW)
        await createFeeQuoteLog($selectedProject.id, emails);
        
        // 2. AUTHORIZE SURVEYORS (EXISTING)
        await authorizeSurveyors($selectedProject.id, emails);
      }
    }
    emailTo = '';
  }
</script>

<ConfirmRequestSentModal 
  bind:showModal={showConfirmModal} 
  on:close={() => showConfirmModal = false}
  on:confirmed={handleConfirmation}
/>

<FeeQuoteHistoryModal 
  bind:showModal={showFeeQuoteHistoryModal}
  projectName={$selectedProject?.name || 'No Project Selected'}
  on:close={() => showFeeQuoteHistoryModal = false}
/>

<div class="briefings-page-container">
  <PageHeader 
    title="Surveyor Briefings" 
    subtitle="Select disciplines and surveyors to draft a fee quote request."
  />

  <div class="briefings-content-area">
    <div class="top-section">
      <div class="discipline-filter">
        <h2>Discipline</h2>
        <ul>
          {#each disciplines as discipline}
            <li>
              <label>
                <input type="checkbox" bind:group={selectedDisciplines} value={discipline} />
                <span>{discipline}</span>
              </label>
            </li>
          {/each}
        </ul>
      </div>
      <div class="survey-type-filter">
        <h2>Survey Type(s)</h2>
        <ul>
          {#each availableSurveyTypes as surveyType}
            <li>
              <label>
                <input type="checkbox" bind:group={selectedSurveyTypes} value={surveyType} />
                {surveyType}
              </label>
            </li>
          {/each}
        </ul>
      </div>
      <div class="surveyor-list">
        <h2>Surveyors</h2>
        <SurveyorBankTable showActions={false} showSelectButton={true} on:select={handleSelectSurveyor} />
      </div>
    </div>

    <div class="email-draft">
      <h2>Email Draft</h2>
      <div class="email-headers">
        <div class="email-fields">
          <div class="form-group">
            <label for="email-to">To:</label>
            <input type="text" id="email-to" bind:value={emailTo} placeholder="recipient@example.com" />
          </div>
          <div class="form-group">
            <label for="email-subject">Subject:</label>
            <input type="text" id="email-subject" bind:value={emailSubject} placeholder="Email subject line" />
          </div>
        </div>
        <div class="email-actions">
          <button class="action-btn" on:click={handleOpenEmail}>Open Email</button>
          <button class="action-btn history-btn" on:click={() => showFeeQuoteHistoryModal = true}>View Sent Requests</button>
          <button class="action-btn confirm-btn" on:click={() => showConfirmModal = true}>Confirm Request Sent and Grant Permission</button>
        </div>
      </div>
      <div contenteditable="true" class="email-body-editor" bind:innerHTML={emailBody}></div>
      
      <div class="instructions">
        <p><strong>Instructions:</strong></p>
        <ul>
          <li>Select discipline, survey types and a chosen surveyor in the selection boxes at the top of the page</li>
          <li>Click "Open Email" button to open the email in your default client</li>
          <li>Edit the email content as needed in your email client (or alternatively edit the email here in the browser before clicking the 'Open Email' button)</li>
          <li>Items highlighted in <mark>yellow</mark> and within [ ] may need your attention</li>
          <li>Preferably send separate emails to each surveyor organisation, or use BCC if emailing multiple organisations together</li>
          <li>Click "Confirm Request Sent and Grant Permission" button when done. This will grant project access to the selected surveyor.</li>
          <li>Repeat process for each fee quote request</li>
        </ul>
      </div>
    </div>
  </div>
</div>

<style>
  .briefings-page-container {
    padding: 1rem 2rem; /* Consistent padding with other pages */
  }

  .briefings-content-area {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    /* Height calc accounts for main app chrome (approx 150px) + page header (approx 70px) */
    height: calc(100vh - 220px); 
  }

  .top-section {
    display: grid;
    grid-template-columns: 1fr 1fr 2fr; /* Adjust ratio as needed */
    gap: 2rem;
    max-height: 50vh; /* Limit height of the top section */
  }

  .discipline-filter, .survey-type-filter {
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 1rem;
    overflow-y: auto; /* Allow scrolling within each top box */
  }

  .surveyor-list {
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 1rem;
    overflow-y: auto; /* Allow scrolling within each top box */
  }

  .surveyor-list h2 {
    margin-bottom: 0.5rem;
  }
  
  .discipline-filter ul, .survey-type-filter ul {
    list-style-type: none;
    padding: 0;
    margin-top: 1rem;
    margin-bottom: 0;
    margin-left: 0;
    margin-right: 0;
  }

  .discipline-filter ul li, .survey-type-filter ul li {
    margin-bottom: 0.5rem;
  }

  .discipline-filter ul li label, .survey-type-filter ul li label {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  /* NEW: Style for the discipline text to control wrapping */
  .discipline-filter ul li label span {
    display: inline-block;
    word-break: break-word; /* Break long words if necessary */
    max-width: 170px; /* Approx width of "Flood and Drainage" */
    line-height: 1.3;
  }

  .discipline-filter ul li label input, .survey-type-filter ul li label input {
    margin-top: 0.2rem;
  }

  .email-draft {
    display: flex;
    flex-direction: column;
    flex-grow: 1; /* Allow email draft area to take remaining space */
  }

  .email-headers {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  .email-fields {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
  }

  .email-actions {
      display: flex;
      gap: 0.5rem;
  }

  .action-btn {
      padding: 0.6rem 1rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      background-color: #f0f0f0;
      cursor: pointer;
      font-weight: 500;
  }

  .action-btn.confirm-btn {
      background-color: #28a745;
      color: white;
      border-color: #28a745;
  }

  .action-btn.history-btn {
      background-color: #6c757d;
      color: white;
      border-color: #6c757d;
  }

  .action-btn.history-btn:hover {
      background-color: #5a6268;
      border-color: #5a6268;
  }

  .form-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .form-group label {
    font-weight: 500;
  }

  .form-group input {
    flex-grow: 1;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-family: inherit;
    font-size: 1rem;
  }

  .email-body-editor {
    width: 100%;
    flex-grow: 1;
    border-radius: 8px;
    padding: 1rem;
    font-family: inherit;
    font-size: 1rem;
    border: 1px solid #ccc;
    resize: vertical;
    min-height: 200px;
    overflow-y: auto;
  }
  
  .email-body-editor:focus {
      outline: 2px solid #007bff;
      border-color: transparent;
  }

  :global(.email-body-editor mark) {
      background-color: yellow;
      padding: 0.1em;
      border-radius: 3px;
  }

  /* Instructions */
  .instructions {
    background-color: #fff3cd;
    border: 1px solid #ffeeba;
    border-radius: 4px;
    padding: 1rem;
    margin-top: 1rem;
  }

  .instructions ul {
    margin: 0.5rem 0 0 1rem;
  }

  .instructions li {
    margin-bottom: 0.25rem;
  }
</style> 