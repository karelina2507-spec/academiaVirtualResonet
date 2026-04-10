/*
  # Move Capacitación TMS RESONET into Herramientas y Sistemas Internos

  The "Capacitación TMS RESONET" course needs to be a module inside
  "Herramientas y Sistemas Internos" rather than a standalone course.

  Changes:
  - Create a new module "Capacitación TMS RESONET" inside the Herramientas course
  - Move its two lessons (Presentación TMS RESONET, Video de Capacitación) into the new module
  - Delete the old standalone module and course
*/

DO $$
DECLARE
  v_herramientas_course_id uuid := 'dee7e971-f5d4-4e5c-ac66-d13ec3685016';
  v_new_module_id uuid;
BEGIN
  -- Create the new module inside Herramientas y Sistemas Internos
  INSERT INTO modules (course_id, title, sort_order)
  VALUES (v_herramientas_course_id, 'Capacitación TMS RESONET', 2)
  RETURNING id INTO v_new_module_id;

  -- Move the two lessons to the new module
  UPDATE lessons
  SET module_id = v_new_module_id, sort_order = 1
  WHERE id = '03314d3b-b794-4f7e-92f6-d09956649f7d'; -- Presentación TMS RESONET

  UPDATE lessons
  SET module_id = v_new_module_id, sort_order = 2
  WHERE id = '49d7164c-9989-419d-befb-5a4b704f3083'; -- Video de Capacitación

  -- Delete the old module (now empty)
  DELETE FROM modules WHERE id = 'e50ce902-3d3a-4605-b35f-8c1d8316cfbc';

  -- Delete the old standalone course
  DELETE FROM courses WHERE id = '0059ced6-197f-4791-b816-8b95c43c6657';
END $$;
