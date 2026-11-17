# Library procedural exterior study — 2026 sources

This prototype changes only the AUC Main Library 3D geometry on /hometest.
It is an **architectural likeness**, not a verified dimensioned digital twin.

## Reference policy

The reference material used for this implementation is a **2026 publication**:
Tamir El-Khouly, Lana Abubakr Ali, Asmaa Eldiasty and Faris Ali Mustafa,
*Exploring the visual–spatial correlation of daylighting and visibility in a
university central library*, **Archnet-IJAR**, published **July 13, 2026**,
DOI: https://doi.org/10.1108/ARCH-01-2026-0068 (CC BY 4.0).

- Figure 2: author's photographs show exterior screening, shading devices,
  glazed spaces and a shaded, descending stair/transition area:
  https://www.emerald.com/view-large/figure/115589790/ARCH-01-2026-0068002.tif
- Table 2 (architectural drawings): five plans, **north, south, east and west**
  elevations and 3D massing views, illustrated with Revit (2025):
  https://www.emerald.com/view-large/figure/115589812/ARCH-01-2026-0068006.tif
- The study describes a rectangular footprint of **90 m × 43 m** (~3,870 m²)
  and **five levels** (garden, plaza, first, second and third), with a northeast
  glazing/atrium and perforated facade screens along southeast/southwest sides.

**Dating caveat:** The paper was published in 2026. The article does not state
the capture dates of its Figure 2 photographs; the Table 2 Revit drawings were
made in 2025. They are included in the 2026 publication but should **not** be
described as photographic evidence captured in 2026. No earlier published
photographs or images are used as source assets in the shipped model.

AUC also published 2026 articles about Library interior renovations. They
indicate that lower-level interiors changed during 2026, but do not supply the
complete exterior dimensions needed to reconstruct this site exactly:
- https://www.aucegypt.edu/news/auc-library-debuts-newly-renovated-learning-commons
- https://www.aucegypt.edu/media/media-releases/auc-library-unveils-renovated-learning-commons-marking-capstone-project

## Implementation choices and uncertainty

- One separate **LibraryBuilding.tsx** module to isolate this experimental
  building from SSE, Business and Humanities.
- Wide glazed elevation and concrete grid screening; darker deep-set west
  slit windows; distinct north/south facade systems; long shaded south
  threshold and entry steps; five floor bands and a tiered flat roof.
- Two-dimensional footprint proportions based on the 2026 figure. Length,
  width and height are scaled to the existing stylized campus scene, not metres.
- The library keeps its existing campus location at [14.5, 0, -4.2] and the
  previous requested clockwise 90° rotation. The route endpoint, highlight
  plane and camera framing are adjusted for the enlarged model.
- Procedurally generated **limestone texture** and **instanced** mullions,
  screens and openings minimize texture downloads and draw calls.
- Figure-derived facades are interpreted, not traced: precise bay count,
  roof geometry, glazing colors, locations of entrances and east/west screen
  orientation should be verified against newer *dated* photographs and surveys.
- No source imagery is embedded or redistributed in the web app.

## What to verify in the Vercel preview

1. Open /hometest, see that the Library is larger and identifiable by its long
   five-level glass elevation and perforated screen, not just an opaque block.
2. Orbit left/right: each of four sides should have different openings.
3. Select the Library: the focus frame should include the enlarged building.
4. Check narrow/mobile screens for building clipping, labels and shadows.
5. Run npm run typecheck and npm run build and verify main site is unchanged.

The model should be improved iteratively from verified 2026-dated photos and
accurate survey dimensions if they become available. This draft does *not*
claim photographic or BIM-level fidelity.
