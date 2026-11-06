export const groups = [
  {id: 'profile', title: 'Contributor details', intro: 'Used for follow-up and contribution credit.', fields: [
    ['contributorName', 'Name', 'text', 'Name shown to reviewers'],
    ['email', 'Contact email', 'email', 'For questions about this submission'],
    ['affiliation', 'Institution or independent researcher', 'text', 'Independent contributors are welcome'],
    ['expertise', 'Research field / relevant expertise', 'text', 'Your field and experience with this experiment'],
    ['homepage', 'Homepage (optional)', 'url', 'Institutional page or personal research profile'],
    ['position', 'Position / title (optional)', 'text', 'Academic or professional role'],
    ['reviewInterest', 'Interest in reviewing (optional)', 'text', 'If interested, name the fields in which you could review tasks']
  ]},
  {id: 'proposal', title: 'Your scientific proposal', intro: 'Describe the idea in your own words. You do not need a complete task package yet.', fields: [
    ['title', 'Task title', 'text', 'A short, specific scientific task name'],
    ['domain', 'Research field', 'text', 'Choose your own field; existing AISLE categories are not mandatory'],
    ['summary', 'What is the task?', 'textarea', 'Scientific objective, starting situation and intended outcome'],
    ['scientificValue', 'Why should it be evaluated?', 'textarea', 'Research relevance and the capability this would test'],
    ['aiDecisions', 'What does the AI decide?', 'textarea', 'Decisions or experimental actions the AI scientist can choose'],
    ['feedback', 'What feedback does it receive?', 'textarea', 'Observations returned to the AI and how it can choose the next step'],
    ['evaluationIdea', 'How would you evaluate it?', 'textarea', 'Initial metrics, acceptable outcomes or judgment rules'],
    ['resources', 'Available resources and support needed', 'textarea', 'Data, laboratory access, tools or assistance; links or an access plan are welcome']
  ]},
  {id: 'execution', title: 'Inputs, actions & feedback', stage: 'task', intro: 'The instructions and resources needed to actually carry out the task.', fields: [
    ['taskInstructions', 'Instructions given to the AI', 'textarea', 'The full participant-facing task statement'],
    ['initialInputs', 'Concrete inputs and access', 'textarea', 'Initial data/files, starting conditions and how they are provided. Attach files or explain access; an example alone is not a complete input.'],
    ['allowedActions', 'Allowed actions and constraints', 'textarea', 'Available tools, action formats, constraints and prohibited actions'],
    ['feedbackRules', 'Feedback returned after each action', 'textarea', 'Observation fields, units, images or messages; what stays hidden and when feedback arrives'],
    ['stoppingRules', 'Budget and stopping conditions', 'textarea', 'Experiment/time budget, completion condition and handling of invalid actions'],
    ['executionMode', 'Who executes the task?', 'select', 'self:Contributor / participant environment|lab:Designated laboratory'],
    ['executionRequirements', 'Execution requirements', 'textarea', 'Tools, environment or protocol, dependencies and resource access. For wet labs: operator, selection/capacity, indicative schedule and how data returns.']
  ]},
  {id: 'evaluation', title: 'Outputs & evaluation', stage: 'task', intro: 'Make the result assessable without exposing hidden evaluation material to the AI.', fields: [
    ['outputRequirements', 'Required outputs and format', 'textarea', 'Final deliverables, units, file formats and required process records'],
    ['evaluationRules', 'Evaluation criteria', 'textarea', 'Metrics, thresholds, acceptable ranges or rubric. Explain negative results, missing observations and technical failures.'],
    ['referenceNotes', 'Reference material or trial run (optional)', 'textarea', 'Reference results, evaluator description or a real trial. If no unique answer exists, explain the judgment rule.']
  ]},
  {id: 'sharing', title: 'Provenance, access & credit', stage: 'task', intro: 'Agree on the intended use of materials before integration.', fields: [
    ['materialSources', 'Material provenance', 'textarea', 'Origin of data/protocols, prior publication or use, and any relevant conflicts'],
    ['licence', 'Rights and permitted use', 'textarea', 'Licence or explicit permissions and restrictions for evaluation, reuse and sharing'],
    ['publicSummary', 'Proposed public summary', 'textarea', 'A brief description suitable for a task page after separate release confirmation'],
    ['visibilityNotes', 'What may be shared, with whom and when?', 'textarea', 'Specify public/participant materials, reviewer-only documents, hidden references and any embargo'],
    ['credit', 'Contribution credit', 'textarea', 'Contributor names, institutions and requested attribution']
  ]}
];

export const labelFor = key => groups.flatMap(g => g.fields).find(f => f[0] === key)?.[1] || ({reviewConsent:'Review consent',rightsConfirmed:'Material rights'}[key] || key);
export const scientificChecks = [
  ['scientificValue', 'The scientific objective and evaluation value are clear.'],
  ['decisions', 'The AI has meaningful decisions and can use experimental feedback.'],
  ['criteria', 'The outputs and scientific evaluation criteria are appropriate.']
];
export const technicalChecks = [
  ['inputs', 'Inputs and required resources are accessible or have a credible access plan.'],
  ['execution', 'Actions, execution conditions, feedback and stopping rules are sufficiently specified.'],
  ['evaluation', 'Outputs can be evaluated; failure handling and private scoring material are clear.'],
  ['rights', 'Provenance, permitted use, visibility and credit are documented.']
];
