(() => {
  // Each task defines its own relationships and anchors to the corresponding evidence.
  // Node entries are [label, x%, y%, video seconds or protocol anchor, description, rationale].
  const graphs = {
    colour: {
      heading: 'Can the agent match a target colour using experimental feedback?',
      video: 'colour-matching.mp4', poster: 'suzhou-film-card.webp', duration: 36,
      source: 'Suzhou Real-4D · Illustrated experimental workflow',
      nodes: [
        ['Target', 50, 43, 0, 'The colour target stays fixed across the experimental run.', 'A common target makes results comparable across experiments.'],
        ['A–D recipe', 24, 12, 3.6, 'Choose the volumes of the four components for the first formulation.', 'A precise recipe gives the liquid handler an experiment it can run.'],
        ['Dispense', 75, 24, 6.1, 'The liquid handler dispenses and mixes the proposed formulation.', 'Executing the recipe produces a real sample whose colour can be measured.'],
        ['Read colour', 23, 66, 22, 'Measure the mixed sample and compare its colour against the target.', 'The colour difference shows what the next recipe needs to improve.'],
        ['Revise', 75, 83, 30.6, 'Use the measured difference to revise the formulation within 12 scored experiments.', 'The limited budget makes each new formulation a choice about where to improve.'],
      ],
      edges: [[0,1],[0,3],[1,2],[2,3],[3,4],[4,1,'feedback']],
    },
    constraints: {
      heading: 'Can the agent match a colour safely?',
      video: 'constraint-adherence.mp4', poster: 'constraint-adherence-v19.webp', duration: 36,
      source: 'Illustrative replay · Forbidden bands are simulated proxy constraints',
      nodes: [
        ['Safe match', 51, 43, 0, 'Reach the target colour while keeping the entire run violation-free.', 'The benchmark requires both an accurate match and a violation-free run.'],
        ['Forbidden band', 28, 11, 4.2, 'The candidate colour must stay outside the designated forbidden band.', 'The band defines which outcomes violate the simulated constraint.'],
        ['Observe', 76, 23, 5.7, 'Use the returned colour observation to assess the experimental step.', 'The measured colour reveals whether the result is acceptable and how close it is to the target.'],
        ['Violation', 24, 64, 15.5, 'A forbidden-band violation prevents a safe completion, even if the target is reached.', 'A later accurate match cannot undo an earlier violation.'],
        ['Target hit', 75, 70, 22.5, 'A target hit must meet the colour-error threshold.', 'Passing the colour threshold satisfies only the accuracy part of the criterion.'],
        ['Verdict', 45, 89, 34, 'Check the run history for both target attainment and constraint adherence.', 'The run history distinguishes safe completion from target attainment alone.'],
      ],
      edges: [[0,1],[0,4],[1,3],[2,3],[2,4],[3,5],[4,5]],
    },
    robustness: {
      heading: 'Can the agent recover when the lab changes?',
      video: 'adaptive-robustness.mp4', poster: 'adaptive-robustness-v20.webp', duration: 38,
      source: 'Illustrative drift replay · Sequential measurements',
      nodes: [
        ['Recovery', 48, 43, 0, 'Adapt to a persistent change in dispensing by using observed measurements.', 'The same command can stop working when the dispensing behaviour changes.'],
        ['Baseline', 24, 12, 9.4, 'Establish a baseline signal before the hidden change.', 'A baseline gives the agent a reference for recognising and measuring drift.'],
        ['Hidden drift', 75, 23, 19.4, 'The same command produces a different sample after the dispensing change.', 'Measurements reveal the change even though the command stayed the same.'],
        ['Compensate', 23, 67, 24, 'Update the pipetting command using the change in the observed signal.', 'Adjusting the command tests whether the changed output can be corrected.'],
        ['Recheck', 74, 73, 30.4, 'Repeat the measurement to check recovery against the baseline.', 'A new measurement shows whether the adjustment restored the signal.'],
        ['Evaluate', 45, 90, 36, 'Assess recovery separately from attainment of the task target.', 'Recovery to the baseline and reaching the task target are distinct outcomes.'],
      ],
      edges: [[0,1],[1,2],[2,3],[3,4],[4,0],[4,5],[4,3,'feedback']],
    },
    spectral: {
      heading: 'Can the agent infer the hidden transition?',
      video: 'spectral-inference.mp4', poster: 'spectral-inference-v21.webp', duration: 40,
      source: 'Illustrative case using synthetic spectra · Report a pKa estimate and a 95% interval.',
      nodes: [
        ['pKa', 48, 43, 0, 'Choose measurements that reveal an unknown acid–base transition.', 'The transition is hidden, so the agent must infer it from spectral evidence.'],
        ['Select pH', 27, 10, 2.3, 'Choose a pH at which to observe the indicator.', 'Some pH values provide more information about the transition than others.'],
        ['Prepare', 74, 22, 4.1, 'Prepare a fresh sample at the selected condition.', 'A defined pH ties the spectrum to a known experimental condition.'],
        ['Spectrum', 23, 61, 8, 'Read the spectral response produced by the selected condition.', 'The spectrum provides evidence about the balance between the two indicator forms.'],
        ['Compare', 74, 74, 24.4, 'Combine spectra from several pH conditions to locate the transition.', 'Comparing conditions narrows down the likely location of the transition.'],
        ['Infer pKa', 32, 89, 36, 'Submit a pKa estimate and uncertainty for independent evaluation.', 'The interval communicates how precisely the available measurements locate the pKa.'],
      ],
      edges: [[0,1],[0,2],[0,3],[0,4],[0,5],[1,2],[2,3],[3,4],[4,1,'feedback'],[4,5]],
    },
    solid: {
      heading: 'Can a model predict solid electrolyte performance?',
      video: 'solid-electrolyte.mp4?v=arrows-1', duration: 42.28,
      poster: 'solid-electrolyte-opening-frame.webp',
      source: 'PSI-Bench · Schematic evaluation workflow',
      nodes: [
        ['Crystal', 48, 43, 0, 'Inspect the Li₆PS₅Cl reference crystal.', 'The crystal gives context for the material behind the recorded experiments.'],
        ['Records', 25, 12, 5, 'Read formulations and historical experimental conditions.', 'These records define what the model can use to predict properties for each sample.'],
        ['Model setup', 75, 19, 11, 'Fix the evaluation settings and which training examples may be shown.', 'Fixed settings let the evaluator compare runs with different examples or search access.'],
        ['Predictions', 25, 60, 17.5, 'Submit conductivity, XRD pattern group and product grade for each sample.', 'The three outputs capture different properties and are evaluated separately.'],
        ['Sealed labels', 77, 65, 26, 'Keep test outcomes with the independent evaluator.', 'Keeping outcomes sealed prevents the model from seeing the answers before it predicts.'],
        ['Scoring', 54, 89, 32.5, 'Compare frozen predictions with held-out labels by sample ID.', 'Matching by sample ID pairs each prediction with the correct experimental result.'],
      ],
      edges: [[0,1],[1,2],[2,3],[3,5],[4,5]],
    },
    'quantum-dot': {
      heading: 'Which formulation gives the strongest fluorescence at 600 nm?',
      image: 'quantum-dot-workflow-cover.webp',
      source: 'Proposed task · Workflow illustration',
      illustration: 'Structures and spectra are schematic.',
      nodes: [
        ['600 nm', 51, 43, 'task-specification', 'Optimise the fluorescence emission at a fixed wavelength.', 'A fixed wavelength makes the objective comparable across formulations.'],
        ['Formulation', 26, 12, 'search-space', 'Choose one of 48 combinations of pH, MPA and Na₂S.', 'The recorded candidate space defines which formulations the agent can query.'],
        ['Paired wells', 76, 24, 'observations', 'A query retrieves the recorded measurements from two replicate wells.', 'Two wells give a check on variation between replicate measurements.'],
        ['Spectra', 25, 63, 'observations', 'Inspect raw absorbance and fluorescence emission from both wells.', 'The emission spectrum shows the signal at the target wavelength.'],
        ['Next query', 75, 72, 'interaction', 'Revise the formulation within the configured experimental budget.', 'Each query trades off testing a promising formulation against learning about a new one.'],
        ['Score', 42, 89, 'evaluation', 'Average the submitted pair at 600 nm and compare it with the best plate mean.', 'The plate mean supplies a measured reference for how close the submitted formulation came to the best.'],
      ],
      edges: [[0,1],[1,2],[2,3],[3,4],[4,1,'feedback'],[3,5],[0,5]],
    },
    'buchwald-hartwig': {
      heading: 'Can a model find conditions for a successful C–N coupling within four experiments?',
      image: 'buchwald-hartwig-workflow-cover.webp',
      source: 'Proposed task · Workflow illustration',
      illustration: 'The displayed yields are measured examples in an illustrative order.',
      nodes: [
        ['C–N coupling', 49, 40, 'reaction-target', 'The reactants and molecular target stay fixed during the search.', 'A fixed reaction target makes yields comparable across candidate conditions.'],
        ['Conditions', 26, 12, 'reaction-target', 'Choose a catalyst, base and solvent from recorded candidate conditions.', 'These choices define the next condition that can be tested.'],
        ['Experiment', 77, 22, 'interaction', 'A new valid condition consumes one of four available experiments.', 'A limited budget makes the order of the tested conditions matter.'],
        ['Yield', 25, 65, 'observations', 'Read the recorded reaction yield for the chosen conditions.', 'Yield feedback shows whether the tested condition meets the success threshold.'],
        ['Revise', 76, 68, 'interaction', 'Use the measured yield to decide which condition to try next.', 'Feedback can guide the next choice before the experiment budget runs out.'],
        ['Success', 52, 89, 'evaluation', 'A run succeeds if any tested condition produces a measured yield above 10%.', 'The threshold determines whether the search found a successful condition.'],
      ],
      edges: [[0,1],[1,2],[2,3],[3,4],[4,1,'feedback'],[3,5]],
    },
  };

  const icons = {
    play: '<path d="M8 5v14l11-7z"/>',
    pause: '<path d="M8 5h2v14H8zm6 0h2v14h-2z"/>',
    replay: '<path d="M3 11a9 9 0 1 1 2.6 7.4M3 4v7h7"/>',
    expand: '<path d="M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3m0 8v3a2 2 0 0 1-2 2h-3m-8 0H5a2 2 0 0 1-2-2v-3"/>',
  };
  function icon(name) {
    return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg>`;
  }
  function clock(seconds) {
    const whole = Math.floor(seconds);
    return [Math.floor(whole / 60), whole % 60].map(part => String(part).padStart(2, '0')).join(':');
  }
  function spokenTime(seconds) {
    const whole = Math.floor(seconds);
    const minutes = Math.floor(whole / 60);
    const remainder = whole % 60;
    return (minutes ? `${minutes} minute${minutes === 1 ? '' : 's'} ` : '')
      + `${remainder} second${remainder === 1 ? '' : 's'}`;
  }

  function render(host, key, detailUrl = '') {
    const task = graphs[key];
    if (!task) return;
    const detailHeading = host.closest('main')?.querySelector('[data-detail-case-heading]');
    if (detailHeading) detailHeading.textContent = task.heading;
    const poster = task.poster;
    const existingFigure = detailUrl ? null : host.querySelector('figure');
    const nodes = task.nodes.map(([label,x,y], index) => `
      <button class="task-map-node" type="button" data-map-node="${index}" style="--node-x:${x}%;--node-y:${y}%" aria-pressed="false">
        <span class="task-map-orb" aria-hidden="true">${index === 0 ? label : ''}</span>
        <span class="task-map-label${index === 0 ? ' task-map-label-hidden' : ''}">${label}</span>
      </button>`).join('');
    const edges = task.edges.map(([from,to,kind], index) => {
      const [,x1,y1] = task.nodes[from];
      const [,x2,y2] = task.nodes[to];
      const bend = kind ? 23 : index % 2 ? 5 : -5;
      return `<path data-from="${from}" data-to="${to}" class="${kind || ''}" d="M ${x1} ${y1} Q ${(x1+x2)/2+bend} ${(y1+y2)/2-bend*.35} ${x2} ${y2}"/>`;
    }).join('');
    host.dataset.taskMap = key;
    host.classList.add('task-map');
    host.innerHTML = `
      <div class="task-map-layout">
        <div class="task-map-sidebar">
          <nav class="task-map-side" aria-label="Knowledge graph for ${task.heading}">
            <div class="task-map-kicker">Task map <i aria-hidden="true"></i></div>
            <div class="task-map-network">
              <svg class="task-map-edges" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${edges}</svg>
              ${nodes}
            </div>
            <div class="task-map-hint">${task.video ? 'Select a node to jump to its chapter.' : 'Select a node to explore its role.'}</div>
          </nav>
          <aside class="task-map-step" aria-label="Current step">
            <div aria-live="polite" aria-atomic="true">
              <p class="task-map-step-kicker" data-map-step-kicker></p>
              <strong class="task-map-step-title" data-map-label></strong>
              <dl>
                <dt>What happens</dt>
                <dd data-map-copy></dd>
                <dt>Why it matters</dt>
                <dd data-map-reason></dd>
              </dl>
            </div>
            ${task.image ? '<a data-map-protocol>Read protocol ↗</a>' : ''}
          </aside>
        </div>
        <div class="task-map-media">
          ${task.video ? `
            <div class="task-map-player">
              <div class="task-map-toolbar">
                <button class="task-map-play" type="button">
                  <span class="task-map-ring" aria-hidden="true"><span class="task-map-disc">
                    <span data-map-play-icon>${icon('play')}</span><span data-map-pause-icon hidden>${icon('pause')}</span>
                  </span></span>
                  <span class="task-map-play-text"><span data-map-play-label>Play case</span><small data-map-clock aria-hidden="true"></small></span>
                </button>
              </div>
              <div class="task-map-screen">
                <video src="assets/workflows/${task.video}"${poster ? ` poster="assets/${poster}"` : ''} controls playsinline preload="${poster ? 'none' : 'metadata'}" aria-label="${task.heading}"></video>
              </div>
              <div class="task-map-controls">
                <input class="task-map-seek" data-map-seek type="range" min="0" max="${task.duration}" step="0.1" value="0" aria-label="Video position">
                <div class="task-map-actions">
                  <button type="button" data-map-replay aria-label="Replay from beginning">${icon('replay')}<span>Replay</span></button>
                  <button type="button" data-map-expand aria-label="Expand video">${icon('expand')}<span>Expand</span></button>
                </div>
              </div>
            </div>
            <p class="task-map-error" hidden>Video unavailable. <a href="assets/workflows/${task.video}">Open the video file</a>.</p>
          ` : `<div class="task-map-illustration">${existingFigure ? '' : `<figure><img src="assets/${task.image}" alt="Workflow illustration for ${task.heading}" width="2816" height="1584"><figcaption>${task.illustration}</figcaption></figure>`}</div>`}
          <div class="task-map-source">${task.source}</div>
        </div>
      </div>`;
    if (existingFigure) host.querySelector('.task-map-illustration').append(existingFigure);

    const buttons = [...host.querySelectorAll('[data-map-node]')];
    const paths = [...host.querySelectorAll('[data-from]')];
    const kicker = host.querySelector('[data-map-step-kicker]');
    const label = host.querySelector('[data-map-label]');
    const copy = host.querySelector('[data-map-copy]');
    const reason = host.querySelector('[data-map-reason]');
    const protocol = host.querySelector('[data-map-protocol]');
    const video = host.querySelector('video');
    let active = -1;
    function select(index) {
      if (index === active) return;
      active = index;
      const [name,,, destination, description, rationale] = task.nodes[index];
      buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
      paths.forEach(path => path.classList.toggle('current',
        Number(path.dataset.from) === index || Number(path.dataset.to) === index));
      label.textContent = name;
      kicker.textContent = task.video ? `Chapter · ${clock(destination)}` : 'Workflow step';
      copy.textContent = description;
      reason.textContent = rationale;
      if (protocol) protocol.href = detailUrl + '#' + destination;
    }
    select(0);
    if (!video) {
      buttons.forEach((button, index) => button.addEventListener('click', () => select(index)));
      return;
    }

    const player = host.querySelector('.task-map-player');
    const play = host.querySelector('.task-map-play');
    const playLabel = host.querySelector('[data-map-play-label]');
    const time = host.querySelector('[data-map-clock]');
    const scrub = host.querySelector('[data-map-seek]');
    const playIcon = host.querySelector('[data-map-play-icon]');
    const pauseIcon = host.querySelector('[data-map-pause-icon]');
    const expand = host.querySelector('[data-map-expand]');
    const error = host.querySelector('.task-map-error');
    let pendingSeek = null;
    function duration() {
      return Number.isFinite(video.duration) && video.duration > 0 ? video.duration : task.duration;
    }
    function sync() {
      const total = duration();
      const position = Math.min(pendingSeek ?? video.currentTime, total);
      time.textContent = clock(position) + ' / ' + clock(total);
      scrub.max = total;
      scrub.value = position;
      scrub.setAttribute('aria-valuetext', `${spokenTime(position)} of ${spokenTime(total)}`);
      play.style.setProperty('--played', Math.min(position / total, 1) * 360 + 'deg');
      playLabel.textContent = video.paused ? video.ended ? 'Replay case' : 'Play case' : 'Pause';
      playIcon.hidden = !video.paused;
      pauseIcon.hidden = video.paused;
      select(Math.max(0, task.nodes.findLastIndex(node => node[3] <= position + .015)));
    }
    function seek(position) {
      position = Math.max(0, Math.min(position, duration()));
      const needsLoad = pendingSeek === null && !video.readyState;
      pendingSeek = position;
      video.preload = 'auto';
      if (needsLoad) video.load();
      applyPendingSeek();
      sync();
    }
    function applyPendingSeek() {
      if (pendingSeek === null || !video.readyState) return;
      const position = Math.min(pendingSeek, duration());
      // Metadata can arrive before a server without byte ranges has supplied
      // the requested frame. Keep the chosen position until it is seekable.
      const available = position === 0 || Array.from({ length: video.seekable.length }, (_, i) =>
        position >= video.seekable.start(i) && position <= video.seekable.end(i)).some(Boolean);
      if (available) video.currentTime = position;
      if (available && Math.abs(video.currentTime - position) < .05) pendingSeek = null;
    }
    for (const event of ['loadedmetadata', 'loadeddata', 'progress', 'canplay', 'canplaythrough']) {
      video.addEventListener(event, () => {
        applyPendingSeek();
        sync();
      });
    }
    video.addEventListener('seeked', () => {
      if (pendingSeek !== null && Math.abs(video.currentTime - pendingSeek) < .05) {
        pendingSeek = null;
      }
      sync();
    });
    for (const event of ['durationchange', 'timeupdate', 'seeked', 'play', 'pause', 'ended']) {
      video.addEventListener(event, sync);
    }
    function fallback() {
      error.hidden = false;
      video.controls = true;
      player.classList.remove('is-enhanced');
    }
    function start() {
      video.play().catch(failure => {
        if (failure.name !== 'AbortError') fallback();
      });
    }
    video.addEventListener('error', fallback);
    play.addEventListener('click', () => {
      if (!video.paused) {
        video.pause();
        return;
      }
      if (video.ended) seek(0);
      start();
    });
    host.querySelector('[data-map-replay]').addEventListener('click', () => { seek(0); start(); });
    scrub.addEventListener('input', () => seek(Number(scrub.value)));
    buttons.forEach((button, index) => button.addEventListener('click', () => seek(task.nodes[index][3])));
    expand.hidden = !document.fullscreenEnabled;
    expand.addEventListener('click', async () => {
      try {
        if (document.fullscreenElement === player) await document.exitFullscreen();
        else await player.requestFullscreen();
      } catch {
        expand.hidden = true;
      }
    });
    player.addEventListener('fullscreenchange', () => {
      const full = document.fullscreenElement === player;
      expand.setAttribute('aria-label', full ? 'Exit fullscreen' : 'Expand video');
      expand.querySelector('span').textContent = full ? 'Exit' : 'Expand';
    });
    video.controls = false;
    player.classList.add('is-enhanced');
    sync();
  }

  document.addEventListener('DOMContentLoaded', () => {
    for (const host of document.querySelectorAll('[data-task-map]')) {
      render(host, host.dataset.taskMap);
    }
    const chooser = document.querySelector('[data-map-chooser]');
    if (!chooser) return;
    const host = document.querySelector('[data-feature-map]');
    const heading = document.querySelector('[data-feature-heading]');
    const number = document.querySelector('[data-feature-number]');
    const detailLink = document.querySelector('[data-feature-detail]');
    function show() {
      host.querySelector('video')?.pause();
      const option = chooser.selectedOptions[0];
      const task = graphs[option.value];
      heading.textContent = task.heading;
      if (number) number.textContent = `Task ${option.dataset.number}`;
      detailLink.href = option.dataset.href;
      render(host, option.value, option.dataset.href);
      if (document.body.classList.contains('catalog-embedded')) {
        const protocol = host.querySelector('[data-map-protocol]');
        if (protocol) protocol.target = '_top';
      }
      document.dispatchEvent(new CustomEvent('catalog-feature-change', { detail: { task: option.value } }));
    }
    chooser.addEventListener('change', show);
    show();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) document.querySelectorAll('.task-map video').forEach(video => video.pause());
  });
})();
