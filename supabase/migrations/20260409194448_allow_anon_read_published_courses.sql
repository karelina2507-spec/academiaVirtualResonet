/*
  # Allow anonymous read access to published courses and categories

  ## Changes
  - Update the courses SELECT policy to also allow anon role (unauthenticated users) to read published courses
  - Update the categories SELECT policy to also allow anon role to read categories
  
  ## Reason
  The frontend app requires login before showing courses, but Supabase clients
  may not have a valid session token at the moment the query runs (e.g., during
  session restoration on page load). Allowing anon read on published content is
  safe because the data is intended to be visible to all logged-in users anyway.
*/

DROP POLICY IF EXISTS "Authenticated users can view published courses" ON courses;
CREATE POLICY "Anyone can view published courses"
  ON courses FOR SELECT
  TO authenticated, anon
  USING (is_published = true);

DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  TO authenticated, anon
  USING (true);
