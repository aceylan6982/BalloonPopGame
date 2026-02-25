# Balloon Pop Game

A fast arcade balloon-popping game built as a web app and packaged for mobile with Capacitor.

## What is implemented

- Goal-based level progression (target score per level)
- Clear fail/success flow:
  - Fail target -> Game Over
  - Reach target -> Level Complete -> automatic next level
- Centered 5-second transition countdown between levels
- Final mission completion state
- Balloon pop effects (sparks + sound)
- Monster targets with bonus score and enhanced hit/pop animations
- Android and iOS Capacitor integration

## Tech stack

- HTML, CSS, JavaScript
- Capacitor (`@capacitor/core`, Android, iOS)

## Run locally (recommended)

```bash
cd /Users/ahmetceylan/Documents/BalloonPopGame
npm install
npm start
```

Open:

- `http://localhost:5511`

## Mobile sync

```bash
npx cap sync
```

## Open native projects

```bash
npx cap open android
npx cap open ios
```

## Notes

- `web/` is the single source of truth for frontend assets.
- Localhost service worker cache is disabled in development flow to avoid stale builds.
