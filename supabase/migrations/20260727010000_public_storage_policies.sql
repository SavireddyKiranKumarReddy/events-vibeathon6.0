-- Add permissive public storage policies for event-submissions bucket
-- This allows any client (including anonymous) to upload, update, and delete files

-- Drop restrictive authenticated-only policies
DROP POLICY IF EXISTS "authenticated uploads to event-submissions" ON storage.objects;
DROP POLICY IF EXISTS "authenticated reads event-submissions" ON storage.objects;
DROP POLICY IF EXISTS "public reads event-submissions" ON storage.objects;

-- Public read access
CREATE POLICY "public reads event-submissions"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-submissions');

-- Public insert access (anyone can upload)
CREATE POLICY "public inserts event-submissions"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'event-submissions');

-- Public update access
CREATE POLICY "public updates event-submissions"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'event-submissions');

-- Public delete access
CREATE POLICY "public deletes event-submissions"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'event-submissions');
