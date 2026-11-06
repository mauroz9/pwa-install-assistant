# Releasing

Only the owner publishes. Nothing is published by merging: a release starts when a `vX.Y.Z` tag is pushed.

## Once

1. **Make the repository public** (Settings › General › Danger zone › Change visibility). Needed for npm provenance
   (it links to a public source and build) and for GitHub Pages on a free plan.
2. **GitHub Pages**: Settings › Pages › Source: *GitHub Actions*. The demo deploys on every push to `main`.
3. **npm**: create the package on npmjs.com under your account and set up *trusted publishing* for
   `mauroz9/pwa-install-assistant`, workflow `release.yml`, environment `npm` (no token needed). Alternatively, add an
   automation token as the `NPM_TOKEN` secret of the `npm` environment.
4. Optionally protect the `npm` environment with a required reviewer, so every publish waits for your approval.

## Every release

1. Move the changes under a new `## [X.Y.Z] — YYYY-MM-DD` section of `CHANGELOG.md` and set `"version"` in
   `package.json` to `X.Y.Z` (in a PR, merged to `main`).
2. Check the notes: `npm run release:notes`.
3. Tag and push:

   ```bash
   git switch main && git pull
   git tag vX.Y.Z && git push origin vX.Y.Z
   ```

The `Release` workflow checks that the tag matches `package.json`, runs lint, types, unit and end-to-end tests, the
size budget and the package contents, publishes with `npm publish --provenance` and creates the GitHub Release with
the notes (summary, changes, how to update).

### Publishing by hand instead

From your machine, logged in with `npm login`:

```bash
npm publish --dry-run   # check the file list (~75 files: dist/, READMEs, LICENSE)
npm publish
```

If npm uses staged publishing, approve the version on npmjs.com afterwards. Then push the tag as above: the workflow
sees the version is already on npm, skips `npm publish` and only creates the GitHub Release. (A hand-published
version has no provenance statement; only the workflow can add one.)

Before tagging, it is worth running the real-browser checks in [`e2e/ios`](../e2e/ios) and
[`e2e/android`](../e2e/android) and updating [`support.md`](./support.md) with the date and version.
