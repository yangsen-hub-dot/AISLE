# AISLE — AI Scientists' Last Exam

[aisle.science](https://aisle.science/) presents the experimental evaluation of AI scientists. The site is English only, with an interactive research network, experimental films, fixed-cohort leaderboards and task protocols.

## Open the workflow preview

- [Task Contribution workspace](https://yangsen-hub-dot.github.io/AISLE/contribute.html)
- [Review workspace](https://yangsen-hub-dot.github.io/AISLE/review.html)
- [Agreed contribution flow diagram, in Chinese](https://yangsen-hub-dot.github.io/AISLE/flow/index.html#overall)

These are rendered pages. The contribution and review demo shares records only
within the same browser; online multi-user review is not connected yet.

## Clone this development version

The `contribution-workflow` branch contains the interactive task catalogue and
the local contributor/reviewer workflow. It does not deploy over the live website.

```sh
git clone --branch contribution-workflow --single-branch https://github.com/yangsen-hub-dot/AISLE.git
cd AISLE
python -X utf8 scripts/build_site.py
python -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Use Python 3.12 or later. On macOS/Linux, replace `python` with `python3` if needed;
on Windows, `py -3 -X utf8 scripts/build_site.py` also works. A normal build needs
only Python's standard library, with no database, npm install, or API credentials.

Open `http://127.0.0.1:4173/index.html` manually. The new views are
`/contribute.html` and `/review.html`. Keep the same browser, hostname and port when
switching between them so they share the same local records.

Edit source files and run the build command again, then refresh the page.
Create a personal branch with `git switch -c your-change` before making changes.
Collaborators with write access can push that branch; others can work in a fork.
Open collaboration pull requests against `yangsen-hub-dot/AISLE` with
`contribution-workflow` as the base branch. The upstream project is
`nlz25/AISLE`; this fork keeps the local development work separate.

### Where to edit

- Page structure and guidance: `src/sitegen/pages/contribute.py`.
- Form fields and review checklists: `src/scripts/contribution-fields.js`.
- Submission state transitions: `src/scripts/contribution-model.js`.
- Interactive forms, queue and decisions: `src/scripts/contribution.js`.
- Local persistence and export: `src/scripts/contribution-store.js`.
- Workflow styling: `src/styles/contribution.css`.
- Interactive task catalogue and its assets: `public/task-cards/`.

The workflow ends at acceptance for later integration. Each collaborator gets
their own browser-local data; cloning the repository does not share submissions
or experimental measurements. See the [workflow guide](docs/contribution-workflow.md)
for the future server boundary.

## Develop

Requires Python **3.12+**. Node 22+ is used for JavaScript syntax checks. The website has no client framework; its optional entrance globe uses a locally bundled Globe.gl / Three.js runtime.

```sh
make check     # build, validate links/data/media, check JavaScript
make serve     # serve dist/ at http://127.0.0.1:4173
```

If your default Python is older, use `make check PYTHON=/path/to/python3.12` (and the same for `make serve`).

`make serve` connects the optional entrance counter to a separate local Worker. See [Portal click counter](docs/counter.md) for startup instructions. Local preview clicks do not affect the production total.

The checked-in globe bundle needs no npm install for ordinary builds or deployment.
To regenerate it after changing dependencies:

```sh
cd scripts/globe-vendor
npm ci --ignore-scripts
npm run build
```

Commit the lockfile, generated `public/assets/vendor/globe.gl.js` and dependency
licenses together. See [architecture and performance](docs/architecture.md) for
the entrance's loading and rendering budgets.

## Project structure

```text
src/
  sitegen/
    pages/          # home, leaderboard, tasks, contribute and review
    components/     # layout, portal, map, result tables, institutions
    context.py      # build paths, study data and HTML escaping
  styles/           # base components, dark theme, entrance, research network
  scripts/          # navigation, view loading, portal, globe, research, map
public/             # files copied into the deployed website
  assets/           # optimized artwork, fonts, logos, map, films
  CNAME             # aisle.science
  favicon.png
  apple-touch-icon.png
data/               # study scores and research-network metadata
scripts/            # build, validation and optional asset tools
design/             # originals, authoring previews/intermediates and archives
docs/               # architecture, content and media provenance
.github/workflows/  # validation and GitHub Pages deployment
dist/               # generated output; ignored by Git
```

Edit `src/`, `public/` and `data/`. Never edit `dist/`. Every build starts from a clean output directory; only that output is deployed. Original media and design experiments are excluded from publication.

Keep only current browser assets in `public/`. Optional asset tools use explicit
recipes in `scripts/optimize_assets.py`; archived originals are not regenerated
into the website. Map intermediates and standalone hand-part SVG previews live
in `design/generated/`. See [editing content](docs/content-guide.md) for regeneration.

## Publication

The upstream `nlz25/AISLE` repository deploys `main` through
`.github/workflows/pages.yml` to `aisle.science`. This fork is separate:
its workflow preview uses `.github/workflows/contribution-preview.yml` and
GitHub Actions, without a custom domain. Pull requests into
`contribution-workflow` run checks only. After merging, a push to that branch
builds and deploys the checked artifact to the same preview URLs above.

To prepare an updated fork preview, run `python -X utf8 scripts/prepare_preview.py`.
It writes `.qa/pages-preview/` with the fork URL, no production counter endpoint,
no `CNAME`, and a `.nojekyll` marker. `python scripts/check_preview.py` checks
that artifact. The workflow uploads it with the official Pages actions;
contributors do not need to push a generated `gh-pages` branch.

Repository setup: select GitHub Actions as the Pages source and allow only
`contribution-workflow` in the `github-pages` environment's deployment branch
rules. Disable the inherited upstream `pages.yml` workflow in this fork so a
push to its `main` cannot replace the workflow preview. The old `gh-pages`
branch remains as the earlier published snapshot.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the agreed PR and deployment process.

## Documentation

- [Architecture and performance](docs/architecture.md)
- [Editing content](docs/content-guide.md)
- [Score provenance](docs/data-provenance.md)
- [Research films](docs/network-media.md)
- [Entrance artwork](docs/portal-art.md)
- [Portal click counter](docs/counter.md)
- [Roadmap](docs/roadmap.md)
- [Local contribution and review workflow](docs/contribution-workflow.md)

## Local contribution workspace

Open `contribute.html` from the site navigation to prepare a short proposal, then
a complete task package after proposal approval. `review.html` provides the local
review queue, requests for changes, scientific/technical sign-off and acceptance
for later integration. No experiment execution or measurement ingestion is connected.

Records and attachment bytes are saved in IndexedDB in the same browser and origin.
This is a local workflow prototype, not authenticated multi-user review. Use the
explicit package export to retain a copy of all revisions and their materials.
Switching port/browser or clearing site data starts a separate local workspace.

The controller and persistence check runs without opening a browser:

```sh
npm install --prefix .qa --no-save --package-lock=false --ignore-scripts jsdom fake-indexeddb
node scripts/check_contribution_ui.mjs
```

Scores describe an evaluated research cohort, not a live ranking of current models. The research network's four regions and supplied films do not describe coverage of the scored benchmark. Original logos and laboratory footage retain their respective owners' rights.
