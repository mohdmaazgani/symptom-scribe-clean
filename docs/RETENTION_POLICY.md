# Data Retention Policy for Health Records

## Overview

Symptom Scribe implements a user-centric data retention policy that complies with GDPR's data minimization principle and HIPAA's storage limitation requirements. Users have full control over their health data retention.

## Retention Principles

1. **User Control**: Users can delete individual symptom records or all their health data at any time
2. **Minimal Storage**: By default, symptom analysis records are retained for 1 year from creation
3. **Right to Erasure**: Users can exercise their GDPR right to erasure through account deletion or bulk deletion

## Record Types and Retention

### Symptom History
- Contains: User-reported symptoms, AI analysis, severity levels, possible causes, recommendations
- Retention Period: 1 year from `created_at` (configurable)
- User Actions: Can delete individual records or all records at any time
- Risk: Contains PHI (Protected Health Information); outdated records should not be retained

### Health Metrics
- Contains: Vital signs, measurements, and health observations
- Retention Period: 1 year from `recorded_at` (configurable)
- User Actions: Can delete individual metrics or all metrics at any time

### User Profile Data
- Contains: Blood type, allergies, chronic conditions, emergency contacts, date of birth
- Retention Period: Retained while account is active; deleted on account deletion
- Encryption: All fields encrypted at rest using AES-256-GCM
- Note: Never automatically deleted; requires explicit user action or account deletion

## User Controls

### Delete Individual Record
Users can delete a single symptom record from the History page:
1. Navigate to Health > History
2. Click the delete icon on any record
3. Confirm deletion
4. Record is immediately removed from database

**API Endpoint**: `DELETE /functions/v1/delete-symptom-history`
```json
{
  "deleteMode": "single",
  "recordId": "<uuid>"
}
```

### Delete All Health Data
Users can delete all their symptom history and health metrics from Settings:
1. Navigate to Settings
2. Scroll to "Data & Privacy"
3. Click "Delete All My Health Data"
4. Review confirmation (lists records to be deleted)
5. Confirm permanent deletion
6. All records are immediately removed

**API Endpoint**: `POST /functions/v1/delete-symptom-history`
```json
{
  "deleteMode": "all"
}
```

### Account Deletion
When a user deletes their account:
- All user data including profiles, symptom history, and metrics are deleted
- Deletion is permanent and cannot be undone
- Uses Supabase auth admin API with cascade delete

**API Endpoint**: `POST /functions/v1/delete-account`

## Automatic Data Cleanup (Future Implementation)

Future versions will implement:
1. **Scheduled Cleanup**: Database function runs daily to delete records older than retention period
2. **User Preference**: Settings to configure retention period (default: 1 year)
3. **Retention Warnings**: Notifications 30 days before automatic deletion
4. **Audit Logging**: Track deletions for compliance reporting

## Compliance

### GDPR Compliance
- Users can request all their personal data (export)
- Users can exercise right to erasure (delete all data)
- Data minimization: Only necessary data is retained
- Storage limitation: Data not kept longer than necessary

### HIPAA Compliance
- PHI (Protected Health Information) is encrypted at rest
- Access controls via Row-Level Security policies
- User-initiated deletion for right of deletion
- Audit logs for access tracking

### CCPA Compliance
- Users can request deletion of personal information
- Clear opt-out mechanisms for data collection
- No cross-site tracking or data sales

## Data Export

Users can request a copy of all their health data:
1. Navigate to Settings > Data & Privacy
2. Click "Export My Data"
3. Receive encrypted JSON export of all records
4. Export includes symptoms, metrics, and profile information

## Questions & Support

For data retention questions or privacy concerns, users should:
1. Review this policy in the app (Settings > Privacy)
2. Contact support@symptom-scribe.example.com
3. Submit privacy requests through the GDPR request form

## Policy Updates

This policy may be updated periodically. Users will be notified of material changes via email or in-app notification. Continued use of the service after updates indicates acceptance.

**Last Updated**: 2026-07-31
**Version**: 1.0.0
