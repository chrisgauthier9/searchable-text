#!/bin/zsh
# Builds "Searchable Text.app" from pdf2text.js and installs it in /Applications.
set -e
cd "${0:A:h}/.."
rm -rf "Searchable Text.app"
osacompile -l JavaScript -o "Searchable Text.app" pdf2text.js
P="Searchable Text.app/Contents/Info.plist"
plutil -replace NSAppleEventsUsageDescription -string "Searchable Text reads the report that is open in your PDF viewer so it can copy its text." "$P"
plutil -replace CFBundleIdentifier -string "ca.searchabletext.app" "$P"
VERSION=$(sed -n "s/^const VERSION = '\(.*\)';/\1/p" pdf2text.js)
plutil -replace CFBundleShortVersionString -string "$VERSION" "$P"
plutil -replace CFBundleVersion -string "$VERSION" "$P"
cp tools/applet.icns "Searchable Text.app/Contents/Resources/applet.icns"
rm -f "Searchable Text.app/Contents/Resources/Assets.car"
plutil -remove CFBundleIconName "$P" 2>/dev/null || true
codesign -f -s - "Searchable Text.app" 2>/dev/null
pkill -f "Searchable Text.app/Contents/MacOS/applet" || true
rm -rf "/Applications/Searchable Text.app"
cp -R "Searchable Text.app" /Applications/
mkdir -p dist && rm -f "dist/Searchable Text.zip"
ditto -c -k --keepParent "Searchable Text.app" "dist/Searchable Text.zip"
rm -f "dist/Searchable Text.dmg"
tools/.venv/bin/dmgbuild -s tools/dmg_settings.py -D app="Searchable Text.app" -D icon=tools/applet.icns -D background=tools/dmg-background.png "Searchable Text" "dist/Searchable Text.dmg" >/dev/null
echo "installed version $VERSION, package in dist/"
