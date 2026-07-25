-- Storage policies for event-submissions bucket
-- Allow authenticated users to upload files (images for non-tech design challenges)
CREATE POLICY IF NOT EXISTS "authenticated uploads to event-submissions"
  ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'event-submissions');

-- Allow authenticated users to read files (for viewing submissions)
CREATE POLICY IF NOT EXISTS "authenticated reads event-submissions"
  ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'event-submissions');

-- Allow public read (bucket is public)
CREATE POLICY IF NOT EXISTS "public reads event-submissions"
  ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'event-submissions');
