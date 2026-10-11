#!/bin/bash
# One-line install for Searchable Text:
#   curl -fsSL https://raw.githubusercontent.com/chrisgauthier9/searchable-text/main/install.sh | bash
# Downloads the latest release, puts it in Applications, adds it to the Dock and opens it.
set -e
URL="https://github.com/chrisgauthier9/searchable-text/releases/latest/download/Searchable.Text.zip"
APP="Searchable Text.app"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "Downloading Searchable Text..."
curl -fsSL "$URL" -o "$TMP/app.zip"
ditto -x -k "$TMP/app.zip" "$TMP"
[ -d "$TMP/$APP" ] || { echo "The download looks wrong. Nothing was installed."; exit 1; }

DEST="/Applications"
[ -w "$DEST" ] || { DEST="$HOME/Applications"; mkdir -p "$DEST"; }
pkill -f "$APP/Contents/MacOS/applet" 2>/dev/null || true
rm -rf "$DEST/$APP"
cp -R "$TMP/$APP" "$DEST/"

if ! defaults read com.apple.dock persistent-apps 2>/dev/null | grep -q "Searchable%20Text.app"; then
  ENC="file://$(printf '%s' "$DEST/$APP/" | sed 's/ /%20/g')"
  defaults write com.apple.dock persistent-apps -array-add "<dict><key>tile-data</key><dict><key>file-data</key><dict><key>_CFURLString</key><string>$ENC</string><key>_CFURLStringType</key><integer>15</integer></dict></dict></dict>"
  killall Dock
fi

echo ""
echo "Searchable Text is installed and in your Dock."
echo "Open a report from the chart, then click the Searchable Text icon."
