# Searchable Text

Mac app that turns a hospital report PDF (opened from Telus PS Suite in Acrobat or Preview) into clean, searchable text on the clipboard, to paste into the chart. Runs entirely on the Mac; no LLM, no network.

- `pdf2text.js` – the whole thing (JavaScript for Automation + PDFKit). Bump `VERSION` on every change.
- `tools/build.sh` – builds `Searchable Text.app`, installs it in /Applications, writes `dist/Searchable Text.zip`.
- `tools/release.sh` – ships an update to every Mac (see Updates).
- `fixtures/` – invented test reports (no real patient data). Never commit a real report.
- `SETUP.md` – install guide for each doctor's Mac.

## Test
```
osascript -l JavaScript pdf2text.js fixtures/fake_two_column.pdf      # print the text
osascript -l JavaScript pdf2text.js --check fixtures/*.pdf            # warnings only
```

## How it reads a report
1. Characters and positions from PDFKit (one-character selections; `characterBoundsAtIndex` drifts at synthesized newlines).
2. Rows by baseline, cells by wide gaps.
3. Repeated headers/footers dropped after page 1 (only rows with real words, never bare dates/times).
4. One column gutter for the whole document, taken from the clearest page; a narrow lab-table column is never a gutter.
5. Reading order: header, left column of every page, right column of every page, the rest, "Electronically Signed" last.
6. Wrapped lines rejoin only when the next word could not have fit (hanging indent, or same indent and lowercase / prose). When unsure the line break stays.
7. Table rows: wrapped cell fragments fold back into their cell; cells joined with ` | `.
8. Checks: every non-space character in the PDF must be in the output except removed headers; scanned pages and 3+ column layouts are flagged. A flagged report still copies, with a "please check it" notification.

## Updates
1. Change `pdf2text.js` and bump `VERSION`.
2. Run `tools/release.sh`: tests the fake reports, builds, signs the script, pushes it here and attaches the zip to a GitHub release.
3. Each Mac checks `version.txt` after every click (one small request, no patient data). A newer `pdf2text.js` is downloaded, its signature checked against the public key built into the app, and used from the next click. An unsigned or tampered file is ignored.

The signing key is `~/.config/searchable-text/signing-key.pem` on Chris's Mac only. Lose it and updates stop (reinstall the app with a new key); leak it and anyone can ship code to the doctors' Macs. Changes to the app shell itself (icon, permissions, the updater) still need a reinstall from the latest release.
