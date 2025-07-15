<script lang="ts">
  import SurveyorBankTable from '$lib/components/SurveyorBankModal.svelte';
  import ViewRequestsModal from '$lib/components/ViewRequestsModal.svelte';
  import { selectedProject, loadAllQuotes } from '$lib/stores/projectStore';
  import { emailTemplates } from '$lib/data/emailTemplates';
  import { surveyorOrganisations } from '$lib/stores/surveyorOrganisationStore';
  import { get } from 'svelte/store';
  import { getAuthTokenHeader } from '$lib/stores/authStore';

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
  let confirmButtonText = 'Confirm Fee Quote Request Sent';
  let isConfirming = false;
  let showRequestsModal = false;

  $: availableSurveyTypes = selectedDisciplines.length > 0
    ? selectedDisciplines.flatMap(d => surveyTypeMapping[d] || [])
    : Object.values(surveyTypeMapping).flat();
  
  $: {
    const disciplineWithTemplate = selectedDisciplines.find(d => emailTemplates[d]);

    if (disciplineWithTemplate) {
      const template = emailTemplates[disciplineWithTemplate];
      let subject = template.subject;
      let body = template.body;

      // Perform mail merge for project name
      if ($selectedProject) {
        const projectName = $selectedProject.name;
        subject = subject.replace(/\[Project\s*Name\]/gi, projectName);
        body = body.replace(/\[Project\s*Name\]/gi, projectName);

        // Populate other placeholders
        body = body.replace(/\[Client \(or SPV\) Name\]/gi, $selectedProject.clientOrSpvName || '');
        body = body.replace(/\[Project Type\]/gi, $selectedProject.projectType || '');
        body = body.replace(/\[Area \(ha\)\]/gi, $selectedProject.area?.toString() || '');
        body = body.replace(/\[Address\]/gi, $selectedProject.address || '');
        body = body.replace(/\[Site Designations\]/gi, $selectedProject.siteDesignations || '');
        body = body.replace(/\[Invoicing details\]/gi, $selectedProject.invoicingDetails || '');
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

  async function handleConfirmClick() {
    if (!emailTo) {
      alert('Please add a recipient to the "To:" field.');
      return;
    }
    
    if (isConfirming) return;
    isConfirming = true;

    try {
      const allSurveyors = get(surveyorOrganisations);
      const recipientEmails = emailTo.split(',').map(e => e.trim());
      const projectId = $selectedProject?.id;
      const discipline = selectedDisciplines[0] || 'General'; // Use the first selected discipline or a default

      if (!projectId) {
        alert('A project must be selected to send briefing requests.');
        isConfirming = false;
        return;
      }

      for (const email of recipientEmails) {
        if (!email) continue;

        let foundSurveyor = null;
        let foundContact = null;

        for (const org of allSurveyors) {
          const contact = org.contacts.find(c => c.email && c.email.toLowerCase() === email.toLowerCase());
          if (contact) {
            foundSurveyor = org;
            foundContact = contact;
            break;
          }
        }

        if (foundSurveyor && foundContact) {
          const requestData = {
            projectId: projectId,
            discipline: discipline,
            organisation: foundSurveyor.organisation,
            contactName: foundContact.contactName,
            email: foundContact.email,
            phoneNumber: foundContact.phoneNumber
          };
          
          const response = await fetch('/api/fee-quote-requests', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...getAuthTokenHeader()
            },
            body: JSON.stringify(requestData),
          });

          if (!response.ok) {
            // Log the error but don't stop the loop
            console.error(`Failed to create fee quote request for ${email}`);
          }
        } else {
            console.warn(`Could not find surveyor details for email: ${email}`);
        }
      }

      confirmButtonText = 'Confirmed &#10004;';
      emailTo = ''; // Reset the 'To' field
      
    } catch (error) {
        console.error('Error creating fee quote requests:', error);
        alert('An error occurred while creating requests. Please check the console.');
    } finally {
        setTimeout(() => {
            confirmButtonText = 'Confirm Fee Quote Request Sent';
            isConfirming = false;
        }, 2000);
    }
  }
</script>

<div class="briefings-container">
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
        <button class="action-btn" on:click={() => showRequestsModal = true}>View Requests</button>
        <button class="action-btn" on:click={handleOpenEmail}>Open Email</button>
        <button 
          class="action-btn confirm-btn" 
          on:click={handleConfirmClick}
          disabled={isConfirming}
        >
          {@html confirmButtonText}
        </button>
      </div>
    </div>
    <div contenteditable="true" class="email-body-editor" bind:innerHTML={emailBody}></div>
  </div>
</div>

{#if showRequestsModal && $selectedProject}
  <ViewRequestsModal 
    projectId={$selectedProject.id}
    on:close={() => showRequestsModal = false} 
  />
{/if}

<style>
  .briefings-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    padding: 1rem;
    height: calc(100vh - 150px); /* Adjust based on header/footer height */
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

  .form-group input[type="text"] {
    background-color: #ffffff !important; /* Set background to white */
  }
  
  .email-body-editor {
    background-color: #ffffff !important;
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
      min-width: 290px;
      text-align: center;
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