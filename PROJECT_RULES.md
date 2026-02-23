# Project Rules

1. All newly added user-facing text must be in English.
2. All new features must be implemented on top of the existing codebase.
3. Do not reset, remove, or rewrite the project from scratch.
4. Keep previous game features working while adding new ones.
5. After each feature update, run Android sync: `npx cap sync android`.
6. After each feature update, verify debug build: `./gradlew assembleDebug` (from `/android`).
7. Keep the project structure compatible with Capacitor (`web/` assets + `android/`).
8. Ensure all mobile changes remain compatible with iOS as well as Android.
