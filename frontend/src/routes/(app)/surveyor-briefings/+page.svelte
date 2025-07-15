<script lang="ts">
  import SurveyorBankTable from '$lib/components/SurveyorBankModal.svelte';
  import { selectedProject } from '$lib/stores/projectStore';
  import { emailTemplates } from '$lib/data/emailTemplates';

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
      <h2>Suggested Surveyors</h2>
      <SurveyorBankTable showActions={false} />
    </div>
  </div>

  <div class="email-draft">
    <h2>Email Draft</h2>
    <div class="email-headers">
      <div class="form-group">
        <label for="email-to">To:</label>
        <input type="text" id="email-to" bind:value={emailTo} placeholder="recipient@example.com" />
      </div>
      <div class="form-group">
        <label for="email-subject">Subject:</label>
        <input type="text" id="email-subject" bind:value={emailSubject} placeholder="Email subject line" />
      </div>
    </div>
    <div contenteditable="true" class="email-body-editor" bind:innerHTML={emailBody}></div>
  </div>
</div>

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
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
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