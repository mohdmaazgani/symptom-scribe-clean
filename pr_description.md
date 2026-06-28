# PR Design: Fix Offline & Cached Symptom Consultation Results

**Branch Name**: `fix/offline-symptom-dashboard-display`
**PR Title**: `fix(offline): persist offline consultations and fallback to local DB on dashboard`

## PR Description

### Description
This PR resolves the issue where completed symptom consultations through the AI Health Assistant are not displayed in either the Dashboard or the History sections (#392). 

Previously, when offline:
1. Attempting to save a completed symptom check in [ChatInterface.tsx](file:///c:/Users/param/Downloads/gssoc/symptom-scribe-clean/src/components/chat/ChatInterface.tsx) or [AIHealthAssistant.tsx](file:///c:/Users/param/Downloads/gssoc/symptom-scribe-clean/src/pages/Health/AIHealthAssistant.tsx) would fail due to the failed Supabase insert. The record was completely discarded.
2. The [Dashboard](file:///c:/Users/param/Downloads/gssoc/symptom-scribe-clean/src/pages/Dashboard/index.tsx) solely relied on cached Redis or direct Supabase queries, reverting to `0` consultations even if local Dexie records existed.

To resolve these:
* We handle network and fetch failures on Supabase insertions by immediately saving the encrypted record to Dexie with `pending_sync: 1`. This safely queues the consultation to sync once connection is restored.
* The [Dashboard](file:///c:/Users/param/Downloads/gssoc/symptom-scribe-clean/src/pages/Dashboard/index.tsx) now queries local Dexie records when offline or on database fetch failure, matching the offline support behavior of the [History Page](file:///c:/Users/param/Downloads/gssoc/symptom-scribe-clean/src/pages/History/index.tsx).

*I am a GSSoC contributor contributing to the improvement of user offline-resilience and local data integrity.*

### Type of Change
- [x] **Bug Fix** (non-breaking change which fixes an issue)
- [ ] **New Feature** 
- [ ] **Refactoring / Performance**
- [ ] **Documentation Update**

### Related Issue
- Fixes #392

### How Has This Been Tested?
- [x] **Local Build**: App builds successfully (`npm run build`).
- [x] **Unit Tests**: Ran dashboard tests to ensure no regressions.
- [x] **Manual Verification**: Offline simulation verifies that consultations save locally, display correctly on the dashboard stats/history list, and synchronize upon reconnection.
