/*
  # Add lessons to "Herramientas y Sistemas Internos"

  Creates a module with 2 lessons:
  - Lesson 1: Presentation (article type with embedded PowerPoint viewer)
  - Lesson 2: Video (video type using the uploaded mp4 file)
*/

-- Insert module for "Herramientas y Sistemas Internos"
INSERT INTO modules (course_id, title, description, sort_order)
SELECT id, 'Modulo 1: Herramientas de la Empresa', 'Presentacion y video introductorio', 1
FROM courses WHERE title = 'Herramientas y Sistemas Internos'
ON CONFLICT DO NOTHING;

-- Insert Lesson 1: Presentation
INSERT INTO lessons (course_id, module_id, title, content, lesson_type, duration_seconds, sort_order)
SELECT 
  c.id,
  m.id,
  'Presentacion: Herramientas y Sistemas Internos',
  'En esta leccion encontraras la presentacion oficial de las herramientas y sistemas que utilizamos en la empresa. Revisa cada diapositiva con atencion ya que contiene informacion clave sobre los accesos, buenas practicas y canales de soporte IT disponibles para todos los colaboradores.',
  'mixed',
  600,
  1
FROM courses c
JOIN modules m ON m.course_id = c.id AND m.title = 'Modulo 1: Herramientas de la Empresa'
WHERE c.title = 'Herramientas y Sistemas Internos'
ON CONFLICT DO NOTHING;

-- Insert Lesson 2: Video
INSERT INTO lessons (course_id, module_id, title, content, video_url, lesson_type, duration_seconds, sort_order)
SELECT 
  c.id,
  m.id,
  'Video: Introduccion a los Sistemas Internos',
  'Video introductorio que cubre los principales sistemas y herramientas que utilizaras en tu trabajo diario. Incluye demostraciones practicas y consejos de los expertos del equipo IT.',
  '/0409.mp4',
  'video',
  1800,
  2
FROM courses c
JOIN modules m ON m.course_id = c.id AND m.title = 'Modulo 1: Herramientas de la Empresa'
WHERE c.title = 'Herramientas y Sistemas Internos'
ON CONFLICT DO NOTHING;

-- Update the confluence_url for lesson 1 to embed the PPTX via Office Online Viewer
UPDATE lessons 
SET confluence_url = '/TMS_RESONET.pptx',
    confluence_page_title = 'Descargar Presentacion: TMS_RESONET.pptx'
WHERE title = 'Presentacion: Herramientas y Sistemas Internos';
