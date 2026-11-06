/* Local submission workflow. Revisions are snapshots; publication is separate. */
export const SCHEMA_VERSION = 1;
export const FINAL_ACCEPT_CHECKS = Object.freeze(['publicScope', 'credit', 'materialsReady']);
const APPROVAL_CHECKS = {
  domain_approve: ['scientificValue', 'decisions', 'criteria'],
  technical_approve: ['inputs', 'execution', 'evaluation', 'rights'],
};

const LABELS = {
  proposal_draft: 'Proposal draft', proposal_submitted: 'Proposal awaiting review',
  proposal_changes: 'Proposal changes requested', proposal_declined: 'Proposal declined',
  task_draft: 'Complete task draft', task_submitted: 'Task awaiting review',
  task_changes: 'Task changes requested', task_declined: 'Task declined',
  accepted: 'Accepted · awaiting integration',
};
const EDITABLE = new Set(['proposal_draft', 'proposal_changes', 'task_draft', 'task_changes']);
const PROPOSAL_FIELDS = {
  contributorName: 'your name', email: 'your email address', affiliation: 'your institution or independent researcher affiliation',
  expertise: 'your research expertise', title: 'a task title', domain: 'the task research domain',
  summary: 'a task summary', scientificValue: 'the scientific value and assessment purpose',
  aiDecisions: 'the decisions the AI must make', feedback: 'the feedback available to the AI',
  evaluationIdea: 'an evaluation approach', resources: 'available resources and how to access them',
};
const TASK_FIELDS = {
  taskInstructions: 'complete task instructions', initialInputs: 'initial inputs and how to access them',
  allowedActions: 'permitted actions', feedbackRules: 'feedback rules', stoppingRules: 'stopping conditions',
  outputRequirements: 'required outputs and their format', evaluationRules: 'evaluation rules',
  executionRequirements: 'execution requirements', materialSources: 'material sources', licence: 'usage permissions',
  publicSummary: 'a public summary', visibilityNotes: 'public and restricted material scopes', credit: 'attribution arrangements',
};

const copy = value => structuredClone(value);
const hasText = value => typeof value === 'string' && value.trim().length > 0;
const newId = prefix => `${prefix}-${globalThis.crypto?.randomUUID?.()
  ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`}`;
function freezeSnapshot(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freezeSnapshot);
    Object.freeze(value);
  }
  return value;
}
function actorName(actor) {
  if (!hasText(actor)) throw new Error('Please enter the name of the person performing this action.');
  return actor.trim();
}
function nextRecord(record) {
  const next = copy(record);
  next.revisions = next.revisions.map(freezeSnapshot);
  next.updatedAt = new Date().toISOString();
  return next;
}
function event(next, action, actor, revisionId, notes = '') {
  next.history.push({ id: newId('event'), action, actor, at: next.updatedAt,
    revisionId, status: next.status, notes });
}

export function createSubmission() {
  const at = new Date().toISOString();
  return { schemaVersion: SCHEMA_VERSION, id: newId('submission'), createdAt: at,
    updatedAt: at, status: 'proposal_draft', fields: {}, attachments: [],
    revisions: [], reviews: [], history: [] };
}

export function statusLabel(status) {
  return LABELS[status] ?? 'Unknown status';
}

export function stageOf(record) {
  if (!(record?.status in LABELS)) throw new Error('The current submission status is not recognized.');
  return record.status.startsWith('proposal_') ? 'proposal' : 'task';
}

export function canEdit(record) {
  return EDITABLE.has(record?.status);
}

export function validateFields(fields = {}, stage = 'proposal', attachments = []) {
  if (!['proposal', 'full', 'task'].includes(stage)) throw new Error('Please select the proposal or complete task stage.');
  const errors = [];
  const required = stage === 'proposal' ? PROPOSAL_FIELDS : { ...PROPOSAL_FIELDS, ...TASK_FIELDS };
  for (const [field, label] of Object.entries(required)) {
    if (!hasText(fields[field])) errors.push({ field, message: `Please provide ${label}.` });
  }
  if (hasText(fields.email) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
    errors.push({ field: 'email', message: 'Please enter a valid email address.' });
  }
  if (fields.reviewConsent !== true) {
    errors.push({ field: 'reviewConsent', message: 'Please agree to share these materials with the reviewers.' });
  }
  if (stage !== 'proposal') {
    if (!['self', 'lab'].includes(fields.executionMode)) {
      errors.push({ field: 'executionMode', message: 'Please choose self-execution or execution by a designated laboratory.' });
    }
    if (fields.rightsConfirmed !== true) {
      errors.push({ field: 'rightsConfirmed', message: 'Please confirm that you have permission to use and submit these materials.' });
    }
  }
  for (const attachment of attachments) {
    if (!hasText(attachment.id) || !hasText(attachment.name)
        || typeof attachment.type !== 'string' || !Number.isFinite(attachment.size)
        || attachment.size < 0 || !['reviewers', 'public'].includes(attachment.visibility)
        || !['input', 'protocol', 'evaluation', 'reference'].includes(attachment.purpose)) {
      errors.push({ field: 'attachments', message: 'Please complete each attachment name, file details, purpose, and visibility.' });
      break;
    }
  }
  return errors;
}

export function submitRecord(record, actor) {
  if (!canEdit(record)) throw new Error('This record cannot be submitted now. Wait for review or address the requested changes first.');
  const stage = stageOf(record);
  const errors = validateFields(record.fields, stage, record.attachments);
  if (errors.length) {
    const error = new Error(errors[0].message);
    error.errors = errors;
    throw error;
  }
  const name = actorName(actor);
  const next = nextRecord(record);
  const revision = freezeSnapshot({ id: newId('revision'), number: next.revisions.length + 1,
    stage, submittedAt: next.updatedAt, fields: copy(next.fields), attachments: copy(next.attachments) });
  next.revisions.push(revision);
  next.status = stage === 'proposal' ? 'proposal_submitted' : 'task_submitted';
  event(next, stage === 'proposal' ? 'proposal_submit' : 'task_submit', name, revision.id);
  return next;
}

export function reviewRecord(record, { reviewer, action, notes = '', checks = {} } = {}) {
  const proposalActions = ['proposal_approve', 'proposal_changes', 'proposal_decline'];
  const taskActions = ['domain_approve', 'technical_approve', 'task_changes', 'task_decline', 'task_accept'];
  if (![...proposalActions, ...taskActions].includes(action)) throw new Error('Please select a valid review action.');
  const stage = proposalActions.includes(action) ? 'proposal' : 'task';
  if (record.status !== `${stage}_submitted`) {
    throw new Error('This stage is not awaiting review. Refresh to see the latest status.');
  }
  const revision = record.revisions.at(-1);
  if (!revision || revision.stage !== stage) throw new Error('There is no submitted revision available for this review.');
  const name = actorName(reviewer);
  if (typeof notes !== 'string') throw new Error('Please enter review notes as text.');
  if (['proposal_changes', 'proposal_decline', 'task_changes', 'task_decline'].includes(action)
      && !hasText(notes)) throw new Error('Please explain the specific changes needed or the reason for declining.');
  if (!checks || typeof checks !== 'object' || Array.isArray(checks)
      || Object.values(checks).some(value => typeof value !== 'boolean')) {
    throw new Error('Review check values must be either confirmed or unconfirmed.');
  }
  if (APPROVAL_CHECKS[action]?.some(key => checks[key] !== true)) {
    throw new Error(action === 'domain_approve'
      ? 'Please confirm all three domain checks: scientific value, AI decisions, and evaluation criteria.'
      : 'Please confirm all four technical checks: inputs, execution, evaluation, and material rights.');
  }
  if (action === 'task_accept') {
    // Earlier versions remain in the audit trail but never approve a new version.
    const approvals = record.reviews.filter(review => review.revisionId === revision.id);
    if (!['domain_approve', 'technical_approve'].every(required =>
      approvals.some(review => review.action === required))) {
      throw new Error('The current revision needs both domain and technical approval first.');
    }
    if (!FINAL_ACCEPT_CHECKS.every(key => checks[key] === true)) {
      throw new Error('Before acceptance, confirm the public scope, attribution, and complete, usable materials.');
    }
  }
  const next = nextRecord(record);
  const statuses = { proposal_approve: 'task_draft', proposal_changes: 'proposal_changes',
    proposal_decline: 'proposal_declined', task_changes: 'task_changes',
    task_decline: 'task_declined', task_accept: 'accepted' };
  next.status = statuses[action] ?? next.status;
  next.reviews.push({ id: newId('review'), revisionId: revision.id, stage, reviewer: name,
    action, notes: notes.trim(), checks: copy(checks), reviewedAt: next.updatedAt });
  event(next, action, name, revision.id, notes.trim());
  return next;
}
