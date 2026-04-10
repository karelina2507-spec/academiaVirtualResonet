/*
  # Update role system: collaborator, expert, admin

  ## Summary
  Expands the role system to support three roles:
  - collaborator: Default role. Can view courses and take quizzes.
  - expert: Can create courses and manage lessons.
  - admin: Full access.

  ## Changes
  1. Drop old CHECK constraint that only allowed 'admin' and 'learner'
  2. Rename all 'learner' role values to 'collaborator'
  3. Update column default to 'collaborator'
  4. Add new CHECK constraint allowing collaborator, expert, admin
*/

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

UPDATE profiles SET role = 'collaborator' WHERE role = 'learner';

ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'collaborator';

ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('collaborator', 'expert', 'admin'));
