# Buchwald–Hartwig task card

Task 07 is a proposed experimental optimisation task in the task catalogue,
with a static workflow illustration and a separate English specification.
It does not add a runnable evaluator or alter data/results.json.

## Artwork provenance

The owner supplied and approved the corrected BH illustration. It originated
from generated artwork and was locally corrected in earlier design work.
This change only resizes and encodes the final approved image for the website;
it does not regenerate the artwork. The source is preserved at
`design/originals/buchwald-hartwig-clean-final.png` (2816 × 1584).

Source SHA256:
`06aade307c14c503a5311d19193b6ff408fa11fe1be85ddbdd607a53b37a10e6`

Public image encodings, made with Pillow / Lanczos:

- `buchwald-hartwig-workflow-cover.webp`: 2816 × 1584, quality 94, method 6.
  SHA256: `8761269d8e5ec5986c0cdb56820daa7c66786ca75b01d311fafa27dcba2daf83`.
- `buchwald-hartwig-workflow-card.webp`: 1200 × 675, quality 90, method 6.
  SHA256: `fde6c9acc23910b5da6cacaf75a508d8cdffc4afc75317c2b00b7b89669b1fa7`.

The laboratory scene and spectra are schematic. Agent logos identify possible
independent participants, not measured model performance or endorsement.

## Scientific source

- Paper: https://www.nature.com/articles/s43588-026-01017-6
- Data and code: https://github.com/schwallergroup/bh-hte-ood
- Example records: JNJ HTE 2024, in the published curated dataset.

Example reactants: `COc1cnc(Cl)nc1` and `Cc1ncccc1CCN`.
Example product: `COc1cnc(NCCc2cccnc2C)nc1`.

The four conditions and yields were checked against the supplied local copy
of the public curated dataset:

1. gphos-pd-g4 / BTMG / DMSO: 6%.
2. brettphos-pd-g4 / LiHMDS / 1,4-Dioxane: 17%.
3. xphos-pd-g4 / P2Et / DMA: 57%.
4. xantphos-pd-g4 / P2Et / t-AmOH: 73%.

The sequence is an explanatory selection, not an agent trajectory.
The source study recommends four conditions as a set. Sequential yield
feedback is the proposed AISLE extension. The candidate list must contain
measured conditions for the selected reaction; unseen outcomes stay private.
The specification uses four unique successful queries, cached repeats, no
budget cost for invalid queries, and success at yield strictly above 10%.
Missing results must not be converted to zero.

This release adds the card, the seventh All tasks entry, an anchored return
link, and the detail page. The solid electrolyte featured case and existing
four-category aggregate benchmark score are unchanged.
