/*
  # Recreate TMS RESONET lessons inside Herramientas y Sistemas Internos

  Recreates the two TMS RESONET lessons inside the "Capacitación TMS RESONET" module
  within the "Herramientas y Sistemas Internos" course (dee7e971-f5d4-4e5c-ac66-d13ec3685016).
*/

INSERT INTO lessons (module_id, course_id, title, lesson_type, video_url, sort_order, duration_seconds)
VALUES
  (
    '5b773023-9651-4103-a37f-8931f726f76b',
    'dee7e971-f5d4-4e5c-ac66-d13ec3685016',
    'Presentación TMS RESONET',
    'presentation',
    '/TMS_RESONET.pptx',
    1,
    0
  ),
  (
    '5b773023-9651-4103-a37f-8931f726f76b',
    'dee7e971-f5d4-4e5c-ac66-d13ec3685016',
    'Video de Capacitación TMS RESONET',
    'video',
    '/0409.mp4',
    2,
    0
  );
