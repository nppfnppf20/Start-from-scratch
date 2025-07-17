<script lang="ts">
  import PageHeader from '$lib/components/PageHeader.svelte';
  import SurveyorBankTable from '$lib/components/SurveyorBankModal.svelte';
  import { selectedProject, authorizeSurveyors } from '$lib/stores/projectStore';
  import { masterTemplate, disciplineSections } from '$lib/data/emailTemplates';
  import ConfirmRequestSentModal from '$lib/components/ConfirmRequestSentModal.svelte';

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
    ]
  };

  let selectedDisciplines: string[] = [];
  let selectedSurveyTypes: string[] = [];
  let emailTo = '';
  let emailSubject = '';
  let emailBody = '';
  let showConfirmModal = false;
  let copyButtonText = 'Copy to Clipboard';

  function processTemplate(template: string, project: any): string {
    return template.replace(/\[([^\]]+)\]/g, (match, placeholder) => {
      const keyMap: { [key: string]: keyof typeof project } = {
        'Project Name': 'name',
        'Client (or SPV) Name': 'clientOrSpvName',
        'Project Type': 'projectType',
        'Area (ha)': 'area',
        'Address': 'address',
        'Site Designations': 'siteDesignations',
        'Invoicing details': 'invoicingDetails'
      };
      
      const key = keyMap[placeholder];
      if (key && project[key]) {
        return project[key].toString();
      } else if (key) {
        return `[Insert ${placeholder}]`;
      }
      
      return match; // Return original if not a mapped placeholder
    });
  }

  $: availableSurveyTypes = selectedDisciplines.length > 0
    ? selectedDisciplines.flatMap(d => surveyTypeMapping[d] || [])
    : Object.values(surveyTypeMapping).flat();
  
  $: {
    const selectedDiscipline = selectedDisciplines.length > 0 ? selectedDisciplines[0] : null;

    if (selectedDiscipline) {
      const disciplineContent = disciplineSections[selectedDiscipline] || '';
      let body = masterTemplate.replace('[Discipline-Specific Content]', disciplineContent);
      let subject = '';

      if ($selectedProject) {
        subject = `${$selectedProject.name} - Fee Quote Request, ${selectedDiscipline}`;
        body = processTemplate(body, $selectedProject);
      } else {
        subject = `Project Name - Fee Quote Request, ${selectedDiscipline}`;
        body = processTemplate(body, {});
      }
      
      const surveyTypesList = selectedSurveyTypes.length > 0
        ? '<ul>' + selectedSurveyTypes.map(st => `<li>${st}</li>`).join('') + '</ul>'
        : '';
      body = body.replace(/\[Survey Types\]/gi, surveyTypesList);
      
      emailSubject = subject;
      emailBody = body;
    } else {
      emailSubject = '';
      emailBody = '';
    }
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
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<li[^>]*>/gi, '\n• ') // bullet point for list items
      .replace(/<mark[^>]*>/gi, '') // remove opening mark tag
      .replace(/<\/mark>/gi, '') // remove closing mark tag
      .replace(/<[^>]+>/g, '') // strip remaining html tags
      .trim();

    const mailtoLink = `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(plainTextBody)}`;
    window.location.href = mailtoLink;
  }

  async function handleCopyToClipboard() {
    const plainTextBody = emailBody
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<li[^>]*>/gi, '\n• ')
      .replace(/<[^>]+>/g, '')
      .trim();
      
    try {
        await navigator.clipboard.writeText(plainTextBody);
        copyButtonText = 'Copied!';
        setTimeout(() => {
            copyButtonText = 'Copy to Clipboard';
        }, 2000);
    } catch (err) {
        console.error('Failed to copy text: ', err);
        alert('Failed to copy email body.');
    }
  }

  async function handleConfirmation() {
    if ($selectedProject && emailTo) {
      const emails = emailTo.split(',').map(e => e.trim()).filter(e => e);
      if (emails.length > 0) {
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
                {discipline}
              </label>
            </li>
          {/each}
        </ul>
      </div>
      <div class="survey-type-filter">
        <h2>Survey Type</h2>
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
          <div class="stacked-buttons">
            <button class="action-btn" on:click={handleOpenEmail}>Open in Email App</button>
            <button class="action-btn" on:click={handleCopyToClipboard}>{copyButtonText}</button>
          </div>
          <button class="action-btn confirm-btn" on:click={() => showConfirmModal = true}>Confirm Fee Quote Request Sent</button>
        </div>
      </div>
      <div contenteditable="true" class="email-body-editor" bind:innerHTML={emailBody}></div>
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

  .discipline-filter, .surveyor-list, .survey-type-filter {
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 1rem;
    overflow-y: auto; /* Allow scrolling within each top box */
  }
  
  .discipline-filter ul, .survey-type-filter ul {
    list-style-type: none;
    padding: 0;
    margin: 0;
  }

  .discipline-filter ul li, .survey-type-filter ul li {
    margin-bottom: 0.5rem;
  }

  .discipline-filter ul li label, .survey-type-filter ul li label {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
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
    flex-shrink: 0; /* Prevent buttons from wrapping on smaller screens */
    align-items: center;
  }

  .stacked-buttons {
    display: flex;
    flex-direction: column;
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

  h2 {
    margin-top: 0;
  }
</style> 