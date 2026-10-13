# Searchable Text – setup guide

For whoever installs it on a doctor's Mac. Takes about 5 minutes per Mac. The doctor does not need to do any of this.

## What it does
The doctor opens a report PDF from the chart, clicks the **clipboard icon** in the menu bar (top right of the screen), and the report's text is copied, cleaned up and ready to paste into a chart note with **Command-V**. Everything happens on the Mac itself. No patient data is sent anywhere.

## Install (once per Mac)
Send the doctor the install page: https://chrisgauthier9.github.io/searchable-text/ (English and French). Or by hand:

1. Download https://github.com/chrisgauthier9/searchable-text/releases/latest/download/Searchable.Text.dmg and double-click it.
2. In the window that opens, drag **Searchable Text** onto the **Applications** folder.
3. Double-click it in Applications and click **Open** when macOS asks (the app is signed and notarized by Apple, so there is no security warning).
4. A clipboard icon appears in the menu bar and the app starts with the Mac from then on. Hidden? System Settings > Menu Bar > switch on Searchable Text.

Upgrading from 1.x (the Dock version): install as above, then drag the old icon out of the Dock. The menu bar change needs this one reinstall; later updates are automatic again.

## First run (once per Mac)
1. Open any report from the chart so it shows in Acrobat (or Preview).
2. Click the **clipboard icon** in the menu bar.
3. When macOS asks whether Searchable Text may control **Adobe Acrobat** (or Preview), click **Allow**.
4. When macOS asks about notifications, click **Allow**.
5. Open TextEdit and press **Command-V**. The report text should appear.

## Updates
Nothing to do. The app updates itself after a click when a new version is out. Only updates signed by Chris are accepted.

## Daily use (what to tell the doctor)
1. Open the report from the chart.
2. Click the **clipboard icon** in the menu bar.
3. Click in the chart note and press **Command-V**.

If the notification says **"please check it"**, the report has an unusual layout. The text is still copied, but read it over before saving.

## If something goes wrong
| Message | What to do |
|---|---|
| No report is open | Open the report first, then click the icon again. |
| Needs permission to see the open report | System Settings > Privacy & Security > Automation > Searchable Text: switch on Acrobat (or Preview). |
| This report is a scanned image | Nothing to copy; the PDF has no text in it. |
| Something went wrong | Send Chris the file `~/Library/Logs/Searchable Text.log`. It holds no patient names or report text. |

When something fails, the clipboard has been emptied first, so pasting can never put in the previous patient's report.
