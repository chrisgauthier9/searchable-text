#!/bin/zsh
# Ship a new version to every Mac: bump VERSION in pdf2text.js first, then run this.
# Checks the test reports, builds the app, pushes the script (Macs pick it up on their next click)
# and attaches the zip to a GitHub release for new installs. The script is signed with the private key
# in ~/.config/searchable-text (never in the repo); Macs ignore any update without a valid signature.
set -e
cd "${0:A:h}/.."
VERSION=$(sed -n "s/^const VERSION = '\(.*\)';/\1/p" pdf2text.js)
[[ "$VERSION" == "$(cat version.txt 2>/dev/null)" ]] && { echo "Bump VERSION in pdf2text.js first (still $VERSION)"; exit 1; }
for f in fixtures/fake_two_column.pdf fixtures/fake_one_column.pdf; do
  r=$(osascript -l JavaScript pdf2text.js --check "$PWD/$f"); [[ "$r" == *": ok" ]] || { echo "Check failed: $r"; exit 1; }
done
[[ "$(osascript -l JavaScript pdf2text.js --check "$PWD/fixtures/fake_three_column.pdf")" == *"more than two columns"* ]] || { echo "3-column warning missing"; exit 1; }
NOTARIZE=1 tools/build.sh
echo "$VERSION" > version.txt
/usr/bin/openssl dgst -sha256 -sign "$HOME/.config/searchable-text/signing-key.pem" pdf2text.js | /usr/bin/base64 > pdf2text.js.sig
git add -A && git commit -qm "Release $VERSION" && git push -q origin main
gh release create "v$VERSION" "dist/Searchable Text.dmg" "dist/Searchable Text.zip" --title "Searchable Text $VERSION" --notes "Install guide: SETUP.md" >/dev/null
echo "Released $VERSION"
