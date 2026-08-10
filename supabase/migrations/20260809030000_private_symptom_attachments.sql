-- Private medical attachments: remove public read, scope objects to the owner path.
-- Bucket may already exist from dashboard provisioning; create if missing.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'symptom-attachments',
  'symptom-attachments',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read symptom-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload symptom-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update symptom-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete symptom-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own symptom attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own symptom attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own symptom attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own symptom attachments" ON storage.objects;

CREATE POLICY "Users can upload own symptom attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'symptom-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can read own symptom attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'symptom-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own symptom attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'symptom-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'symptom-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own symptom attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'symptom-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
