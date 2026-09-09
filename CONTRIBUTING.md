# Contributing

## Workflow

1. Create a branch for non-trivial work.
2. Keep changes focused (one concern per PR when possible).
3. Run locally before opening a PR:

```bash
npm run lint
npm run build
```

## Database changes

Add a new numbered SQL file under `supabase/` and update `000_all.sql` (or regenerate by concatenating 001+). Document it in `docs/DATABASE.md`.

## Docs / screenshots

After UI changes that affect the first-run experience, regenerate shots with `npm run screenshots` (see `docs/SCREENSHOTS.md`) and refresh README embeds if filenames change.

## Secrets

Do not commit `.env`, service-role keys, or screenshot credentials.
