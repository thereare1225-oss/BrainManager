# BrainManager

BrainManager is a Vite + React + TypeScript self-help web app for short, evidence-informed mental reset exercises.

## Run

```bash
npm install
npm run dev
```

## Checks

```bash
npm run lint
npm run build
```

## v1 Scope

- Five common states: racing thoughts, sadness, fatigue, anger, and anxiety.
- One low-friction exercise per state, driven by `src/data/interventions.ts`.
- Local-only session history in `localStorage`.
- Safety notice when a note includes self-harm language.
