# Contributing to the workflow preview

Use this fork for Task Contribution changes:

- Repository: https://github.com/yangsen-hub-dot/AISLE
- Pull request base: contribution-workflow
- Live workspace: https://yangsen-hub-dot.github.io/AISLE/contribute.html
- Flow diagram: https://yangsen-hub-dot.github.io/AISLE/flow/index.html#overall

Create a branch for each change, run the relevant checks, push that branch and
open a pull request against contribution-workflow. Include the resulting user
behavior and how it was checked. Leave the pull request for review; do not merge
or push directly to the base branch unless the repository owner requests it.

Pull requests run the preview build and contribution checks without deploying.
After a pull request is merged, the same workflow deploys the checked artifact
to the existing Pages URL. Keep the release target on this fork. Do not push
changes to upstream nlz25/AISLE or change its aisle.science deployment.

Edit sources in src/ and public resources in public/. The agreed flow diagram
is public/flow/index.html. Do not edit or commit generated dist/ or .qa/.
See the README for local startup and the module map.

The browser-local prototype ends at acceptance for integration. It does not
share submissions between users or collect real experimental measurements.
