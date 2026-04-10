/*
  # Add Confluence integration fields to lessons
  Adds confluence_url and confluence_page_title columns to lessons table
  so individual lessons can be linked to Confluence documentation pages.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lessons' AND column_name = 'confluence_url'
  ) THEN
    ALTER TABLE lessons ADD COLUMN confluence_url text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lessons' AND column_name = 'confluence_page_title'
  ) THEN
    ALTER TABLE lessons ADD COLUMN confluence_page_title text DEFAULT '';
  END IF;
END $$;
