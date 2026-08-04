-- Add images column to symptom_history
ALTER TABLE public.symptom_history 
ADD COLUMN images text[] DEFAULT NULL;

-- Create symptom-attachments storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('symptom-attachments', 'symptom-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for symptom-attachments
CREATE POLICY "Anyone can view attachments"
ON storage.objects FOR SELECT
USING ( bucket_id = 'symptom-attachments' );

CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK ( bucket_id = 'symptom-attachments' );

CREATE POLICY "Users can update their attachments"
ON storage.objects FOR UPDATE TO authenticated
USING ( bucket_id = 'symptom-attachments' );

CREATE POLICY "Users can delete their attachments"
ON storage.objects FOR DELETE TO authenticated
USING ( bucket_id = 'symptom-attachments' );
