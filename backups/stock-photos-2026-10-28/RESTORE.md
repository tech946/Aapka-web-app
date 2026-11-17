# Backup: template photos, 2026-10-28

Before this change the new-design pages used the reference template's stock
photos (hikers, foreign cities labelled as UAE places). They now use Dubai /
UAE photos from Pexels (free for commercial use, no attribution required),
saved in `public/images/stock/` at 1400px wide.

Not changed: graphics and vectors (earth render, partner logos, SVG car /
plane / balloon / arrows, Lottie animation), CRM package photos, and the
scroll-section videos.

Also in this change: the homepage hero cards are smaller (row max 960px,
220px tall, rounded) in `foreigner.css`.

## Files changed (backed up here as `.bak`)

- `src/app/(marketing)/Home/foreigner/content.ts`: hero cards, about, destinations, FAQ, stories, review photos
- `src/app/(marketing)/About/foreigner/content.ts`: banner, intro, destinations, review photo
- `src/app/(marketing)/faq/foreigner/content.ts`: banner photos
- `src/app/(marketing)/contact/page.tsx`, `src/app/(marketing)/become-partner/page.tsx`: banner photos
- `src/app/(marketing)/Home/foreigner/foreigner.css`: hero card size

## How to go back

```bash
cd backups/stock-photos-2026-10-28 && find src -name "*.bak" | while read f; do cp "$f" "../../${f%.bak}"; done
```

The photos in `public/images/stock/` can stay; nothing else uses them.

## Photo sources (Pexels)

| File | Pexels page |
| ---- | ----------- |
| `card-limited-deals.jpg` | https://www.pexels.com/photo/35705174/ |
| `card-desert-tours.jpg` | https://www.pexels.com/photo/15332112/ |
| `card-anydate.jpg` | https://www.pexels.com/photo/35138838/ |
| `card-marina-cruise.jpg` | https://www.pexels.com/photo/36070165/ |
| `about-woman-views.jpg` | https://www.pexels.com/photo/36770874/ |
| `about-couple-desert.jpg` | https://www.pexels.com/photo/20734803/ |
| `dest-dubai.jpg` | https://www.pexels.com/photo/29470840/ |
| `dest-abu-dhabi.jpg` | https://www.pexels.com/photo/34029394/ |
| `dest-sharjah.jpg` | https://www.pexels.com/photo/36879667/ |
| `dest-ras-al-khaimah.jpg` | https://www.pexels.com/photo/32762474/ |
| `dest-fujairah.jpg` | https://www.pexels.com/photo/39288917/ |
| `dest-al-ain.jpg` | https://www.pexels.com/photo/38777996/ |
| `dest-musandam.jpg` | https://www.pexels.com/photo/36471614/ |
| `dest-hatta.jpg` | https://www.pexels.com/photo/34471736/ |
| `faq-dubai-frame.jpg` | https://www.pexels.com/photo/36770826/ |
| `story-food.jpg` | https://www.pexels.com/photo/36796431/ |
| `story-abu-dhabi.jpg` | https://www.pexels.com/photo/29766947/ |
| `story-desert.jpg` | https://www.pexels.com/photo/35109569/ |
| `story-dhow.jpg` | https://www.pexels.com/photo/38799326/ |
| `review-burj-al-arab.jpg` | https://www.pexels.com/photo/36770856/ |
| `review-couple-desert.jpg` | https://www.pexels.com/photo/31640448/ |
| `review-atlantis.jpg` | https://www.pexels.com/photo/39757403/ |
| `banner-burj-palms.jpg` | https://www.pexels.com/photo/21327689/ |
| `banner-dunes-suv.jpg` | https://www.pexels.com/photo/38036768/ |
| `banner-dubai-dusk.jpg` | https://www.pexels.com/photo/18341554/ |
| `traveller-quad.jpg` | https://www.pexels.com/photo/20734774/ |
| `traveller-downtown.jpg` | https://www.pexels.com/photo/36770807/ |
| `traveller-sharjah.jpg` | https://www.pexels.com/photo/36879669/ |
| `traveller-couple-dunes.jpg` | https://www.pexels.com/photo/20734809/ |
| `traveller-couple-quad.jpg` | https://www.pexels.com/photo/20734784/ |

## Scroll-section videos (Home and About)

The template clips (Paris, Rome, St Peter's Square, a train, …) were
replaced with Dubai / UAE clips from Pexels, compressed with Windows'
built-in Media Foundation encoder to 1280×720, 1.5 Mbps, no audio, max 10 s
(0.8–2 MB each, ~9 MB total). Posters are each clip's own frame. Files:
`public/videos/strips/<name>.mp4` + `<name>.jpg`.

Code: `content.ts` (Home and About) now use a `clip(name)` helper instead of
the template `video(name)`; `FrScrollImages.tsx` makes the WebM source
optional. Backups here: `FrScrollImages.tsx.bak`, and
`content.ts.scroll-videos.bak` for both content files (to undo only the
videos, copy those over `content.ts` and `FrScrollImages.tsx`).

| File | Pexels video |
| ---- | ------------ |
| `dubai-marina.mp4` | https://www.pexels.com/video/20760797/ |
| `desert-road.mp4` | https://www.pexels.com/video/6826177/ |
| `grand-mosque.mp4` | https://www.pexels.com/video/16998220/ |
| `sheikh-zayed-road.mp4` | https://www.pexels.com/video/8359173/ |
| `burj-al-arab-beach.mp4` | https://www.pexels.com/video/11849894/ |
| `dubai-frame-dusk.mp4` | https://www.pexels.com/video/8397996/ |

## Holiday-type cards (2026-11-10)

Homepage "Explore Dubai & UAE Across 4 Holiday Types" cards (`CATEGORY_CARDS` in
`src/app/(marketing)/Home/ex/ExSections.tsx`). Downloaded at 800px wide, Pexels license.

| File | Pexels photo |
| ---- | ------------ |
| `public/images/stock/type-anydate.jpg` | https://www.pexels.com/photo/12099895/ |
| `public/images/stock/type-offers.jpg` | https://www.pexels.com/photo/18561239/ |
| `public/images/stock/type-tours.jpg` | https://www.pexels.com/photo/18650345/ |
| `public/images/stock/type-marina.jpg` | https://www.pexels.com/photo/19212313/ |
