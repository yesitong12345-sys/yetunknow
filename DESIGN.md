# Design System: The Desk Is the Interface

## Direction contract

**THESIS** — The photographed handmade desk is the navigation system, not a backdrop behind UI cards. Refuse the illustrated-dashboard imitation.

**OWN-WORLD** — Real fibrous paper, book cloth, wood, graphite, crayon, masking tape, and soft directional shadows. HTML labels behave like small physical annotations attached to objects.

**STORY** — A visitor enters one real desk, recognizes four personal objects, and opens the owner’s ideas, days, work, or locked studio.

**FIRST VIEWPORT** — One edge-to-edge 16:9 desk image with no hero title or slogan. Yellow notes, a two-state journal, blue toolbox, and sealed drawer are four spatial hotspots.

**FORM** — Experience mode; a spatial still-life index pinned directly by the user’s reference image.

## Durable visual rules

- The main desktop scene uses `desk-scene-v2.png` as the visual source of truth. Do not redraw its major objects in CSS.
- The daily hotspot uses the owner's two supplied magenta-background assets without redrawing their contents: closed books by default, original open journal on hover/focus/first touch.
- The idea notes stay blank until the owner supplies hand-drawn art; generated doodle content must not be substituted.
- The locked drawer carries a physical paper-and-wax seal; its attempted movement is visibly resisted by that seal.
- Typography is real HTML. Large Chinese display text uses a calligraphic system stack; navigation and metadata use a restrained sans stack.
- Public labels look physically attached: warm white paper, graphite border, minimal offset shadow, slight rotation. No generic rounded cards or glass effects.
- Palette is sampled from the scene: paper `#F4EEDB`, graphite `#2B2927`, crayon red `#E85D4A`, note yellow `#F2C94C`, toolbox blue `#315FA8`, plant green `#60965B`, wood `#C58D59`.
- Authored motion explains material state: the journal opens through a center reveal, the top idea note peels, and the drawer tugs once before the seal pulls it back.
- Mobile becomes a vertical photographic field guide using object crops and the same material language; it never shows the previous flat illustration.
- Collection pages may use generated book objects as authored editorial assets, but content text remains selectable HTML.
- `prefers-reduced-motion` keeps hover/focus emphasis but removes travel and spring motion.

## Responsive composition

- At 761px and above, preserve the full 16:9 scene inside the viewport with letterboxed wood when necessary.
- Below 761px, lead with a photographic crop and four large object-led sections; retain all destinations in two taps.
- Avoid placing required text inside raster imagery. Keep labels high-contrast and clear of object detail.
