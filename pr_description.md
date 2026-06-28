# PR Design: Fix P2P Emergency Mesh Network Signature Failures

**Branch Name**: `fix/mesh-signature-verification`
**PR Title**: `fix(mesh): normalize payload properties to resolve signature verification failures`

## PR Description

### Description
This PR resolves the issue where emergency alerts broadcasted via the P2P mesh network fail signature verification on the receiving end (#455).

To resolve this:
* We updated the `getAlertPayloadString` method in [mesh-network.ts](file:///c:/Users/param/Downloads/gssoc/symptom-scribe-clean/src/lib/mesh-network.ts) to explicitly fallback and normalize optional and missing properties (e.g. `latitude: alert.latitude ?? null`, `longitude: alert.longitude ?? null`, and default empty strings to `""`).
* This guarantees that the JSON serialization produces identical string representation on both the sender side (during signature creation) and the receiver/cache side (during verification), resolving key mismatch errors when properties undergo structured-cloning or IndexedDB retrieval.

*I am a GSSoC contributor contributing to the improvement of user offline-resilience and local data integrity.*

### Type of Change
- [x] **Bug Fix** (non-breaking change which fixes an issue)
- [ ] **New Feature** 
- [ ] **Refactoring / Performance**
- [ ] **Documentation Update**

### Related Issue
- Fixes #455

### How Has This Been Tested?
- [x] **Local Build**: App builds successfully (`npm run build`).
- [x] **Unit Tests**: All 63 unit tests pass successfully.
- [x] **Manual Verification**: Signature verification succeeds correctly when broadcasting emergency mesh packets.
