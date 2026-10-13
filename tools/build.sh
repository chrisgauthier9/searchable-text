#!/bin/zsh
# Builds "Searchable Text.app" from pdf2text.js, signs it with Chris's Developer ID, installs it in
# /Applications and writes dist/ (drag-to-Applications dmg + zip).
# NOTARIZE=1 tools/build.sh also notarizes with Apple, so downloads open with no warning
# (needs the "searchable-text" notarytool profile in the Keychain; release.sh sets it).
set -e
cd "${0:A:h}/.."
IDENTITY="Developer ID Application: Christophe Gauthier (J77HL5VNWR)"
VERSION=$(sed -n "s/^const VERSION = '\(.*\)';/\1/p" pdf2text.js)
ROOT="$PWD"
# Build outside the project: iCloud syncs Documents and tags files in ways code signing rejects.
BUILD="$(mktemp -d /tmp/searchable-text-build.XXXX)"
trap 'rm -rf "$BUILD"' EXIT
APP="$BUILD/Searchable Text.app"
rm -rf "$ROOT/Searchable Text.app"
osacompile -s -l JavaScript -o "$APP" pdf2text.js
P="$APP/Contents/Info.plist"
plutil -replace NSAppleEventsUsageDescription -string "Searchable Text reads the report that is open in your PDF viewer so it can copy its text." "$P"
plutil -replace CFBundleIdentifier -string "ca.searchabletext.app" "$P"
plutil -replace LSUIElement -bool true "$P"
plutil -replace CFBundleShortVersionString -string "$VERSION" "$P"
plutil -replace CFBundleVersion -string "$VERSION" "$P"
cp tools/applet.icns "$APP/Contents/Resources/applet.icns"
rm -f "$APP/Contents/Resources/Assets.car"
plutil -remove CFBundleIconName "$P" 2>/dev/null || true
xattr -cr "$APP"
codesign --force --deep --options runtime --timestamp --entitlements tools/entitlements.plist -s "$IDENTITY" "$APP"
codesign --verify --strict "$APP"

notarize() {   # file to submit, then what to staple
  xcrun notarytool submit "$1" --keychain-profile searchable-text --wait | grep -E "status:|id:" | tail -2
  xcrun stapler staple -q "$2"
}

mkdir -p dist
if [[ "$NOTARIZE" == 1 ]]; then
  ditto -c -k --keepParent "$APP" "$BUILD/notarize.zip"
  notarize "$BUILD/notarize.zip" "$APP"
fi

pkill -f "Searchable Text.app/Contents/MacOS/applet" || true
rm -rf "/Applications/Searchable Text.app"
ditto "$APP" "/Applications/Searchable Text.app"

rm -f "dist/Searchable Text.zip" "dist/Searchable Text.dmg"
ditto -c -k --keepParent "$APP" "dist/Searchable Text.zip"
tools/.venv/bin/dmgbuild -s tools/dmg_settings.py -D app="$APP" -D icon=tools/applet.icns -D background=tools/dmg-background.png "Searchable Text" "dist/Searchable Text.dmg" >/dev/null
codesign --force --timestamp -s "$IDENTITY" "dist/Searchable Text.dmg"
if [[ "$NOTARIZE" == 1 ]]; then notarize "dist/Searchable Text.dmg" "dist/Searchable Text.dmg"; fi
echo "built version $VERSION$([[ "$NOTARIZE" == 1 ]] && echo ', notarized'), installed, package in dist/"
