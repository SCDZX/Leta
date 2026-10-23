# Leta project page

Self-contained static site. Figures and the 40 comparison videos live under `assets/`;
nothing is fetched from sibling directories or from external CDNs or font services, so
the page works offline and on GitHub Pages without extra setup.

The PDF is deliberately **not** in this directory. It is still a draft, and anything
committed here is public once Pages is enabled — including in git history, where a
later delete does not remove it. The paper buttons are inert placeholders until the
arXiv version is out.

## Preview locally

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

## Publish

Upload the **contents of this directory** to the root of a repository and point GitHub
Pages at that branch's root. `.nojekyll` is already present so Jekyll leaves the files
alone.

## Layout

| File | Role |
| --- | --- |
| `index.html` | Page content: hero, results, method, abstract, BibTeX |
| `styles.css` | Design tokens, layout, light and dark themes |
| `app.js` | Card rendering, lazy video playback, modal, theme toggle, scroll spy |
| `data.js` | The 20 matched cases (`CASES`), each with a prompt and two video paths |
| `assets/` | figure PNGs and `videos/{leta,dmd}/` |

## When the paper goes live

Two buttons are placeholders: one in the hero, one in the Paper section. Both are marked
`data-pending` with an empty `href` and a `TODO` comment above them. For each, set `href`
to the arXiv abs URL, restore `target="_blank" rel="noreferrer"`, change the label back to
`Read the paper` / `Open PDF`, and remove `data-pending`, `aria-disabled`, `role="link"`,
and the `is-pending` class. Then add `eprint`/`archivePrefix` to the BibTeX block.

Keep linking to arXiv rather than committing the PDF, so the page always points at the
current version instead of a frozen copy.

## Notes

- The 20 matched DMD/Leta cases exclude case 0104.
- Figure PNGs are rendered from the paper's `image/*.pdf` sources with Ghostscript,
  which rasterizes at true resolution. Do **not** use `sips` for this: it renders a PDF
  at 72 dpi and then upscales, so the result is blurry no matter what width you ask for.

  ```bash
  SRC=../cvpr26/author-kit-main/image
  gs -q -dNOPAUSE -dBATCH -sDEVICE=png16m -r200 \
     -dTextAlphaBits=4 -dGraphicsAlphaBits=4 \
     -sOutputFile=assets/concept.png $SRC/concept.pdf
  gs ... -r240 -sOutputFile=assets/method.png  $SRC/method.pdf
  gs ... -r450 -sOutputFile=assets/spiral.png  $SRC/score_delta_spiral_full_range.pdf
  ```

  The spiral figure is pure vector, so it takes a high dpi well. `concept` and `method`
  embed photos, so beyond ~200-240 dpi only the file grows. After re-rendering, update
  each `<img>`'s `width`/`height` in `index.html` to the new pixel size so the page does
  not shift while images load.
- Videos are 832×480; the CSS uses that aspect ratio, so frames are never cropped.
- Video sources attach only as a card nears the viewport, which keeps the initial load
  to the few pairs actually on screen rather than all 23 MB.
- Theme follows the OS by default; the header toggle overrides it and the choice is
  remembered in `localStorage`.
