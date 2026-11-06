# Supplied contribution portal

The owner requested replacement of /contribute.html with the supplied
aisle-contribute-demo.html, retaining its black/blue visual design and its
Dry Lab / Wet Lab interactions. It is built at the existing address so every
current Contribute navigation link continues to work.

Original supplied file SHA256:
8a7ea03cdda301bb5ae381eabea83ec3dbfedb4e8217bc460c29d86b20cd630c.

The page is split into a standalone template, stylesheet and script:

- src/sitegen/templates/contribute.html
- src/styles/contribute-demo.css
- src/scripts/contribute-demo.js
- public/assets/contribute/lab-gateway.webp (the original embedded image bytes)

The build applies its asset version and site URL. It uses the supplied page
chrome instead of loading the old contribution controller or shared styles.
Home and Tasks navigation resolve relative to the deployed GitHub Pages prefix.
The GitHub handoff remains directed to yangsen-hub-dot/AISLE.

Supported hash routes are /, /dry/auth, /dry/dashboard, /wet/auth and
/wet/dashboard. The server always serves the same contribute.html document.
Dry Lab supports task IDs, local task management and a copyable PR outline.
Wet Lab adds availability notices and simulated evidence-package statuses.

This remains a browser-local demonstration. It creates no accounts, retains no
passwords and sends no form data to a server. Profile/task records use the source
key aisle-contribute-demo-v1 in localStorage. Publishing the page does not migrate
records previously created at a file URL. The earlier IndexedDB review prototype
retains its separate records; this portal does not feed that review queue.
