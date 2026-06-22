# Demo — Data Portability (PDF & CSV Export)

Screenshots and recordings demonstrating the **Export Symptom History** feature.

## Screenshots

| File | Description |
|---|---|
| `01_symptom_history_page.png` | Full History page with both records shown and the **Export Data** button visible (top-right) |
| `02_export_dropdown_open.png` | Export dropdown open showing **Export as CSV** and **Export as PDF** options |
| `03_export_csv_success.png` | After clicking "Export as CSV" — file downloads + success toast |
| `04_export_pdf_success.png` | After clicking "Export as PDF" — PDF generated via jsPDF + success toast |
| `05_home_page.png` | App home/landing page |
| `06_history_page_auth.png` | History page before authentication |

## Recordings (WebP animated)

| File | Description |
|---|---|
| `recording_data_export_demo.webp` | Short session recording of the export demo |
| `recording_export_feature.webp` | Full interactive session — navigation → dropdown → CSV → PDF |

## Feature Implementation

- **Location**: `src/pages/History/index.tsx`
- **CSV**: Client-side `Blob` with `text/csv` MIME, auto-downloaded
- **PDF**: `jsPDF` + `jspdf-autotable`, auto-downloaded
- **UI**: `DropdownMenu` trigger with two `DropdownMenuItem`s
- **Condition**: Export button only appears when `history.length > 0`
