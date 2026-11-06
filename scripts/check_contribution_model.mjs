import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// The browser source is ESM; a data URL also works without a root package.json.
const source = await readFile(new URL('../src/scripts/contribution-model.js', import.meta.url));
const { SCHEMA_VERSION, FINAL_ACCEPT_CHECKS, createSubmission, validateFields,
  submitRecord, reviewRecord, canEdit, stageOf, statusLabel } = await import(
  `data:text/javascript;base64,${source.toString('base64')}`);

const proposal = {
  contributorName: '张研究员', email: 'author@example.org', affiliation: '独立研究者',
  expertise: '电化学', title: '反馈驱动的实验设计', domain: '化学',
  summary: 'AI 根据观测选择后续实验。', scientificValue: '评价科研决策能力。',
  aiDecisions: '选择实验条件', feedback: '测量值与不确定度', evaluationIdea: '预先公布的指标',
  resources: 'https://example.org/materials', reviewConsent: true,
};
const full = { ...proposal, taskInstructions: '按说明完成实验设计。',
  initialInputs: 'https://example.org/inputs', allowedActions: '选择下一轮条件',
  feedbackRules: '每轮返回测量数据', stoppingRules: '最多五轮或满足目标',
  outputRequirements: '设计与决策记录', evaluationRules: '按固定指标比较',
  executionMode: 'self', executionRequirements: '所需环境与资源均有说明',
  materialSources: '作者自有材料', licence: '按贡献协议使用',
  publicSummary: '反馈驱动的科学决策任务', visibilityNotes: '评分依据仅审核人员可见',
  credit: '张研究员', rightsConfirmed: true,
};
const domain = { scientificValue: true, decisions: true, criteria: true };
const technical = { inputs: true, execution: true, evaluation: true, rights: true };
const final = Object.fromEntries(FINAL_ACCEPT_CHECKS.map(key => [key, true]));
const attachment = { id: 'attachment-1', name: 'input.csv', type: 'text/csv', size: 50,
  visibility: 'reviewers', purpose: 'input', metadata: { description: 'initial conditions' } };
const review = (record, action, checks = {}, notes = '') =>
  reviewRecord(record, { reviewer: '审核员', action, checks, notes });
function frozen(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(frozen);
    Object.freeze(value);
  }
  return value;
}
let passed = 0;
function check(name, action) {
  try { action(); passed += 1; }
  catch (error) { throw new Error(`${name}: ${error.message}`, { cause: error }); }
}
function readyProposal() {
  const record = createSubmission();
  record.fields = structuredClone(proposal);
  return record;
}
function readyTask() {
  const record = review(submitRecord(readyProposal(), '作者'), 'proposal_approve');
  record.fields = structuredClone(full);
  return record;
}

check('new records and editable states', () => {
  const first = createSubmission(), second = createSubmission();
  assert.equal(SCHEMA_VERSION, 1);
  assert.equal(first.schemaVersion, SCHEMA_VERSION);
  assert.notEqual(first.id, second.id);
  assert.equal(first.createdAt, first.updatedAt);
  assert.equal(stageOf(first), 'proposal');
  assert.equal(canEdit(first), true);
  for (const status of ['proposal_submitted', 'proposal_declined', 'task_submitted', 'task_declined', 'accepted']) {
    assert.equal(canEdit({ status }), false);
    assert.notEqual(statusLabel(status), 'Unknown status');
  }
});

check('required profile, consent, and complete-task fields', () => {
  assert.deepEqual(validateFields(proposal, 'proposal', []), []);
  assert.deepEqual(validateFields(full, 'full', []), []);
  assert.deepEqual(validateFields({ ...full, executionMode: 'lab' }, 'task', []), []);
  assert(validateFields({ ...proposal, expertise: '' }, 'proposal').some(e => e.field === 'expertise'));
  assert(validateFields({ ...proposal, reviewConsent: 'true' }, 'proposal').some(e => e.field === 'reviewConsent'));
  assert(validateFields({ ...full, rightsConfirmed: false }, 'full').some(e => e.field === 'rightsConfirmed'));
  assert(validateFields({ ...full, executionMode: 'other' }, 'full').some(e => e.field === 'executionMode'));
  assert(validateFields({ ...proposal, email: 'wrong' }, 'proposal').some(e => e.field === 'email'));
  assert(validateFields(proposal, 'full').some(e => e.field === 'initialInputs'));
  assert.deepEqual(validateFields(full, 'full', [attachment]), []);
  assert(validateFields(full, 'full', [{ ...attachment, visibility: '' }]).some(e => e.field === 'attachments'));
  assert.throws(() => submitRecord(createSubmission(), '作者'), /Please provide/);
  assert.throws(() => submitRecord(readyProposal(), ''), /person performing this action/);
});

check('submission snapshot and nested attachment immutability', () => {
  const draft = readyProposal();
  draft.attachments = [structuredClone(attachment)];
  const before = JSON.stringify(draft);
  const submitted = submitRecord(frozen(draft), '作者');
  assert.equal(JSON.stringify(draft), before);
  assert.equal(submitted.status, 'proposal_submitted');
  assert.equal(submitted.revisions[0].number, 1);
  assert.equal(submitted.revisions[0].stage, 'proposal');
  assert.equal(submitted.history[0].actor, '作者');
  submitted.fields.title = 'later draft text';
  submitted.attachments[0].metadata.description = 'later metadata';
  assert.equal(submitted.revisions[0].fields.title, proposal.title);
  assert.equal(submitted.revisions[0].attachments[0].metadata.description, 'initial conditions');
  assert.throws(() => { submitted.revisions[0].fields.title = 'rewrite'; }, TypeError);
  assert.throws(() => submitRecord(submitted, '作者'), /cannot be submitted now/);
});

check('proposal revisions and approval only unlock task drafting', () => {
  const first = submitRecord(readyProposal(), '作者');
  assert.throws(() => review(first, 'proposal_changes'), /specific changes needed/);
  const changes = review(frozen(first), 'proposal_changes', {}, '请明确科学价值。');
  assert.equal(first.status, 'proposal_submitted');
  assert.equal(canEdit(changes), true);
  changes.fields.scientificValue = '已补充科学价值';
  const second = submitRecord(changes, '作者');
  assert.equal(second.revisions[1].number, 2);
  assert.notEqual(second.revisions[0].id, second.revisions[1].id);
  assert.equal(second.reviews[0].revisionId, second.revisions[0].id);
  const approved = review(second, 'proposal_approve');
  assert.equal(approved.status, 'task_draft');
  assert.equal(stageOf(approved), 'task');
  assert.equal(canEdit(approved), true);
  assert.throws(() => submitRecord(approved, '作者'), /Please provide complete task instructions/);
  assert.throws(() => review(approved, 'task_accept', final), /not awaiting review/);
});

check('domain and technical checks are enforced independently', () => {
  const submitted = submitRecord(readyTask(), '作者');
  assert.throws(() => review(submitted, 'domain_approve'), /three domain checks/);
  assert.throws(() => review(submitted, 'domain_approve', { ...domain, decisions: false }), /three domain checks/);
  assert.throws(() => review(submitted, 'technical_approve'), /four technical checks/);
  assert.throws(() => review(submitted, 'technical_approve', { ...technical, rights: false }), /four technical checks/);
  assert.throws(() => review(submitted, 'domain_approve', { scientificValue: 'true' }), /Review check values/);
  assert.throws(() => review(submitted, 'task_accept', final), /both domain and technical approval/);
  const domainOnly = review(submitted, 'domain_approve', domain);
  assert.equal(domainOnly.status, 'task_submitted');
  assert.throws(() => review(domainOnly, 'task_accept', final), /both domain and technical approval/);
});

check('acceptance requires current revision approvals and final confirmation', () => {
  const submitted = submitRecord(readyTask(), '作者');
  let approved = review(submitted, 'technical_approve', technical);
  approved = review(approved, 'domain_approve', domain);
  assert.throws(() => review(approved, 'task_accept'), /public scope/);
  assert.throws(() => review(approved, 'task_accept', { ...final, credit: false }), /public scope/);
  const before = JSON.stringify(approved);
  const accepted = review(frozen(approved), 'task_accept', final, '同意接收。');
  assert.equal(JSON.stringify(approved), before);
  assert.equal(accepted.status, 'accepted');
  assert.equal(canEdit(accepted), false);
  assert.equal(accepted.reviews.at(-1).revisionId, accepted.revisions.at(-1).id);
  assert.equal(accepted.revisions.at(-1).stage, 'task');
  assert.equal(accepted.history.at(-1).status, 'accepted');
  assert.equal('publishedAt' in accepted, false);
  assert.throws(() => review(accepted, 'task_accept', final), /not awaiting review/);
});

check('resubmitting changes never reuses earlier approvals', () => {
  let first = submitRecord(readyTask(), '作者');
  first = review(first, 'domain_approve', domain);
  first = review(first, 'technical_approve', technical);
  const changes = review(first, 'task_changes', {}, '请修正评价规则。');
  assert.equal(canEdit(changes), true);
  assert.throws(() => review(changes, 'task_accept', final), /not awaiting review/);
  changes.fields.evaluationRules = '已修订评价规则';
  let second = submitRecord(changes, '作者');
  assert.equal(second.revisions.at(-1).number, 3);
  assert.equal(second.revisions[1].fields.evaluationRules, full.evaluationRules);
  assert.throws(() => review(second, 'task_accept', final), /both domain and technical approval/);
  second = review(second, 'domain_approve', domain);
  assert.throws(() => review(second, 'task_accept', final), /both domain and technical approval/);
  second = review(second, 'technical_approve', technical);
  assert.equal(review(second, 'task_accept', final).status, 'accepted');
});

check('declined records are final and stage-incompatible actions fail', () => {
  const proposed = submitRecord(readyProposal(), '作者');
  assert.throws(() => review(proposed, 'proposal_decline'), /specific changes needed/);
  const declined = review(proposed, 'proposal_decline', {}, '暂不符合任务范围。');
  assert.equal(declined.status, 'proposal_declined');
  assert.throws(() => submitRecord(declined, '作者'), /cannot be submitted now/);
  assert.throws(() => review(proposed, 'technical_approve', technical), /not awaiting review/);
  const task = submitRecord(readyTask(), '作者');
  assert.throws(() => review(task, 'proposal_approve'), /not awaiting review/);
  assert.throws(() => review(task, 'task_changes'), /specific changes needed/);
  assert.throws(() => review(task, 'task_decline'), /specific changes needed/);
  assert.equal(review(task, 'task_decline', {}, '当前执行条件不可用。').status, 'task_declined');
  assert.throws(() => review(task, 'publish'), /valid review action/);
  assert.throws(() => reviewRecord(task, { reviewer: '', action: 'domain_approve', checks: domain }), /person performing this action/);
});

console.log(`Contribution model: ${passed} checks passed.`);
