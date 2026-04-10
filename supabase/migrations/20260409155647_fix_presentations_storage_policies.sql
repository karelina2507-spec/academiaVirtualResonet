/*
  # Fix storage policies for course-presentations bucket

  Adds UPDATE and DELETE policies so that upsert operations work correctly
  for authenticated users uploading presentations.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
    AND policyname = 'Authenticated users can update presentations'
  ) THEN
    CREATE POLICY "Authenticated users can update presentations"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (bucket_id = 'course-presentations')
      WITH CHECK (bucket_id = 'course-presentations');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
    AND policyname = 'Authenticated users can delete presentations'
  ) THEN
    CREATE POLICY "Authenticated users can delete presentations"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'course-presentations');
  END IF;
END $$;
