# Local installation and development

[← New Tab Japji](../README.md)

## Install locally

1. Clone this repository and run `npm ci`, then `npm run build` (Node.js 22 or newer).
2. Create `<vault>/.obsidian/plugins/new-tab-japji/`.
3. Copy `main.js`, `manifest.json`, and `styles.css` into that folder.
4. Reload Obsidian and enable **New Tab Japji** in Community plugins.
5. Open a new tab. You can also use the **New Tab Japji: Open new tab** command.

The build uses only browser APIs and Obsidian’s plugin API at runtime, allowing desktop and mobile use. Actual device verification is still required before publication. Other plugins that customize empty tabs may conflict.

## Development and verification

`npm run dev` watches source changes. `npm run build` type-checks and bundles the plugin. `npm test` checks corpus completeness, verse pairing, pauri boundaries, sequential rotation, saved progress, offline first launch, note creation, and tab cleanup.

Before release, test in a disposable vault:

- New and existing empty tabs, splits, multiple windows, and restored workspaces.
- File opening/closing without duplicate panels or changes to note contents.
- All shortcuts, duplicate Untitled filenames, nested notes, and an empty vault.
- Light/dark themes, custom interface fonts, keyboard focus, narrow panes, and mobile.
- Offline first launch, two-row passages for pauris with paired sentences, four-row passages elsewhere, pauri boundaries, and saved progress after restart.
- Disable/re-enable and confirm native empty-tab content returns.

## Community release

This repository is prepared for a community release, but has not been published or reviewed. Check the current [submission requirements](https://docs.obsidian.md/community-directory/submission-requirements-for-plugins) before submitting.

After completing device testing, set the release version in `manifest.json`, `package.json`, and `versions.json`. Tag the release with the exact version (for example `1.0.0`). The release workflow builds and attaches `main.js`, `manifest.json`, and `styles.css` to a draft GitHub release. Publish the release and follow Obsidian’s community submission process.

## Bundled text

The editable corpus is [data/japji-sahib.json](../data/japji-sahib.json): 40 sections and 277 transliteration/translation pairs from SikhiWiki, revision 123444. Source spelling, punctuation, and section grouping are retained; incidental HTML whitespace is normalized. Displayed line numbers refer to paired source rows, which sometimes contain multiple poetic lines.

The build embeds the corpus, its attribution, and its license into `main.js`. Users need only the three installation files listed above. The plugin makes no network requests and stores only the next reading position in its local `data.json`.

If editing the corpus, preserve its attribution and licensing and update [the adaptation history](../data/NOTICE.md). Restart the development build after changing the corpus documentation so the bundled notices stay current.

## Code licensing and release source

Plugin code is licensed under GPL-3.0-only; bundled SikhiWiki text remains GFDL-1.2-or-later. See [COPYRIGHT.md](../COPYRIGHT.md). The build embeds both licenses and attribution in `main.js`.

For each compiled release, make the corresponding source available alongside the build. The release tag must point to the exact code used to build the assets, including the package lockfile and build instructions. GitHub provides source archives for that tag; retain them and identify them in the release notes. Distributors of modified builds must provide their matching source under GPLv3 as well.
