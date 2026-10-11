# Searchable Text – setup guide

For whoever installs it on a doctor's Mac. Takes about 5 minutes per Mac. The doctor does not need to do any of this.

## What it does
The doctor opens a report PDF from the chart, clicks **Searchable Text** in the Dock, and the report's text is copied, cleaned up and ready to paste into a chart note with **Command-V**. Everything happens on the Mac itself. No patient data is sent anywhere.

## Install (once per Mac)
1. Download **Searchable Text.zip** from https://github.com/chrisgauthier9/searchable-text/releases/latest (or copy it over by AirDrop or USB) and double-click it to unzip.
2. Drag **Searchable Text** into the **Applications** folder.
3. Double-click it in Applications. macOS says it cannot verify the app. Click **Done**.
4. Open **System Settings > Privacy & Security** and scroll down. Next to "Searchable Text was blocked", click **Open Anyway**, enter the Mac password, then click **Open**.
5. Drag **Searchable Text** from Applications onto the Dock.

## First run (once per Mac)
1. Open any report from the chart so it shows in Acrobat (or Preview).
2. Click **Searchable Text** in the Dock.
3. When macOS asks whether Searchable Text may control **Adobe Acrobat** (or Preview), click **Allow**.
4. When macOS asks about notifications, click **Allow**.
5. Open TextEdit and press **Command-V**. The report text should appear.

## Updates
Nothing to do. The app updates itself after a click when a new version is out. Only updates signed by Chris are accepted.

## Daily use (what to tell the doctor)
1. Open the report from the chart.
2. Click **Searchable Text** in the Dock.
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
