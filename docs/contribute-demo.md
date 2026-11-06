# AISLE contribution portal

The supplied November 6 demo is built at `/contribute.html`. Its template,
stylesheet and script live under `src/`. The page uses the site’s existing
fonts and a logo in `public/assets/contribute/`.

Dry Lab creates task records and prepares GitHub pull-request handoffs. Wet Lab
adds per-task lab availability, notices and simulated evidence submission.
Evidence records contain file names and sizes. Authentication, task management
and submission status are browser-local demo interactions.

The portal uses `aisle-contribute-demo-v2` in localStorage. On first use it can
read the previous contribution demo’s records from the same GitHub Pages origin.
Existing contributors can use the same email to find their records. The older
`#/dry/auth` and `#/wet/auth` routes still open the respective sign-in pages.
