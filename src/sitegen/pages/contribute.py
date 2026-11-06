"""Local contribution and review workspaces, before task integration."""

import os
from pathlib import Path


def contribute_document(version):
    """Use the supplied standalone design without the shared page styles."""
    template = Path(__file__).resolve().parents[1] / "templates/contribute.html"
    site_url = os.environ.get("AISLE_SITE_URL", "https://aisle.science").rstrip("/")
    return template.read_text(encoding="utf-8").replace(
        "__ASSET_VERSION__", version
    ).replace("__SITE_URL__", site_url)


def workspace(mode):
    reviewing = mode == "review"
    title = "Review a scientific task." if reviewing else "Bring your experiment to AISLE."
    intro = (
        "Assess the scientific question, the decisions an AI scientist can make, and whether the task can be executed and evaluated."
        if reviewing else
        "Start with a short proposal. Once the direction is approved, prepare the materials an AI scientist needs to act, receive feedback and be evaluated."
    )
    switch = '<a class="cw-link" href="contribute.html">Contributor workspace &rarr;</a>' if reviewing else '<a class="cw-link" href="review.html">Review workspace &rarr;</a>'
    return f'''<main id="main" class="contribution-page wrap">
      <section class="cw-hero"><p class="cw-eyebrow">AISLE / {"TASK REVIEW" if reviewing else "CONTRIBUTE A TASK"}</p>
        <h1>{title}</h1><p class="cw-lead">{intro}</p>{switch}
        <p><a class="cw-link" href="flow/index.html#overall">View the agreed contribution flow (Chinese) &rarr;</a></p>
      </section>
      <ol class="cw-route" aria-label="Contribution process">
        <li><span>01</span> Short proposal</li><li><span>02</span> Complete materials</li>
        <li><span>03</span> Scientific &amp; technical review</li><li><span>04</span> Accepted for integration</li>
      </ol>
      <div class="cw-local"><strong>Local workspace</strong><span>Drafts, files and review decisions stay in this browser on this device. The review view is a local demonstration, without account permissions or shared server storage.</span></div>
      <details class="cw-before"><summary>Before you begin · requirements and an example</summary>
        <div class="cw-guide-grid"><div><h2>Is this a suitable task?</h2><p>A meaningful scientific question; decisions for the AI to make; accessible resources and clear evaluation; reliable materials with permission to use them. Read <a class="cw-link" href="tasks.html">current task examples</a> and the proposal board below before starting.</p><p>Contributor details are entered once and reused for your next local proposal. Account sign-in and shared permissions will be connected with the server.</p></div>
        <div><h2>Illustrative proposal: formulation search</h2><p><strong>Scientific purpose:</strong> assess whether the AI improves a formulation through experiments. <strong>Decisions:</strong> choose the next mixture. <strong>Feedback:</strong> measured colour after each round. <strong>Evaluation:</strong> final error, experiment budget and decision record.</p><p>The complete task would add actual starting inputs, allowed mixtures, feedback fields, output format, an evaluation rule and the operating protocol. This example explains the form; it is not a submitted task or a required task category.</p></div></div>
        <p class="cw-muted">This workspace covers contributing a new task. Participating in an integrated task and sending experimental measurements will follow after server integration.</p>
      </details>
      <div id="contribution-app" data-mode="{mode}" aria-busy="true"><p>Loading your workspace…</p></div>
      <noscript><p>Enable JavaScript to save a proposal and use the review workspace.</p></noscript>
      <details class="cw-guide"><summary>What makes a useful AISLE contribution?</summary>
        <div class="cw-guide-grid"><div><h2>A scientific decision loop</h2><p>Explain the scientific purpose, what the AI can decide, what feedback it receives, and how success is evaluated. Existing task categories are examples, not a restriction on new contributions.</p></div>
        <div><h2>A proposal first, a runnable task later</h2><p>A short explanation and an illustrative example are enough to discuss a proposal. Before full task review, provide actual inputs or an access plan, allowed actions, feedback, output requirements and evaluation criteria. A unique reference answer is not required when a clear judgment rule is available.</p></div>
        <div><h2>Materials reviewers can inspect</h2><p>Include protocols, resource requirements, provenance and usage rights. Separate material intended for participants from reviewer-only references and hidden scoring information. Wet-lab tasks should explain who operates the experiment and how observations become AI feedback.</p></div>
        <div><h2>After acceptance</h2><p>An accepted task waits for integration. Running experiments, returning measurements and connecting the experimental database are a later step.</p></div></div>
      </details>
    </main>'''


def contribute():
    return workspace("contributor")


def review():
    return workspace("review")
