INSERT INTO branches (code, name, approximate_students, has_sections) VALUES
    ('CSE', 'Computer Science and Engineering', 150, TRUE),
    ('AIML', 'Artificial Intelligence and Machine Learning', 150, TRUE),
    ('AIDS', 'Artificial Intelligence and Data Science', 75, FALSE),
    ('ECE', 'Electronics and Communication Engineering', 75, FALSE),
    ('ME', 'Mechanical Engineering', 75, FALSE),
    ('IT', 'Information Technology', 75, FALSE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings (code, name, distance_meters, map_position) VALUES
    ('IET', 'Institute of Engineering and Technology', 0, '{"x": 35, "y": 46}'::jsonb),
    ('DEEKSHA', 'Deeksha Bhawan', 100, '{"x": 68, "y": 55}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO floors (building_id, floor_number, floor_label)
SELECT b.id, f.floor_number, f.floor_label
FROM buildings b
CROSS JOIN (VALUES
    ('IET', 0, 'Ground Floor'), ('IET', 1, 'First Floor'), ('IET', 2, 'Second Floor'),
    ('DEEKSHA', 0, 'Ground Floor'), ('DEEKSHA', 1, 'First Floor')
) AS f(building_code, floor_number, floor_label)
WHERE b.code = f.building_code
ON CONFLICT (building_id, floor_number) DO NOTHING;

INSERT INTO rooms (floor_id, room_number, name, room_type, capacity, capacity_source, permitted_uses, is_active, is_verified)
SELECT f.id, r.room_number, r.name, r.room_type, r.capacity, r.capacity_source, r.permitted_uses, r.is_active, r.is_verified
FROM (VALUES
    ('IET', 0, 'LIB01', 'Library', 'library', 165, 'supplied_approximation', ARRAY['examination']::TEXT[], TRUE, TRUE),
    ('IET', 0, 'FACULTY', 'Faculty cabins', 'office', NULL, 'not_bookable', ARRAY[]::TEXT[], FALSE, TRUE),
    ('IET', 0, 'DIRECTOR', 'Director''s Office', 'office', NULL, 'not_bookable', ARRAY[]::TEXT[], FALSE, TRUE),
    ('IET', 0, 'ADMIN', 'Administrative Office', 'office', NULL, 'not_bookable', ARRAY[]::TEXT[], FALSE, TRUE),
    ('IET', 0, 'PLACEMENT', 'Placement Cell', 'office', NULL, 'not_bookable', ARRAY[]::TEXT[], FALSE, TRUE),
    ('IET', 1, 'IET17', 'Classroom IET17', 'classroom', 75, 'supplied_approximation', ARRAY['lecture','examination','event']::TEXT[], TRUE, TRUE),
    ('IET', 1, 'IET18', 'Classroom IET18', 'classroom', 75, 'supplied_approximation', ARRAY['lecture','examination','event']::TEXT[], TRUE, TRUE),
    ('IET', 1, 'IET19', 'Classroom IET19', 'classroom', 75, 'supplied_approximation', ARRAY['lecture','examination','event']::TEXT[], TRUE, TRUE),
    ('IET', 1, 'IET20', 'Classroom IET20', 'classroom', 75, 'supplied_approximation', ARRAY['lecture','examination','event']::TEXT[], TRUE, TRUE),
    ('IET', 1, 'CSE_LAB', 'CSE Laboratory', 'laboratory', NULL, 'needs_configuration', ARRAY['practical']::TEXT[], TRUE, TRUE),
    ('IET', 1, 'ME_LAB', 'ME Laboratory', 'laboratory', NULL, 'needs_configuration', ARRAY['practical']::TEXT[], TRUE, TRUE),
    ('IET', 1, 'ECE_LAB', 'ECE Laboratory', 'laboratory', NULL, 'needs_configuration', ARRAY['practical']::TEXT[], TRUE, TRUE),
    ('IET', 1, 'IT_LAB', 'IT Laboratory', 'laboratory', NULL, 'needs_configuration', ARRAY['practical']::TEXT[], TRUE, TRUE),
    ('IET', 2, 'IET24', 'Classroom IET24', 'classroom', NULL, 'needs_configuration', ARRAY['lecture','examination']::TEXT[], TRUE, TRUE),
    ('IET', 2, 'IET25', 'Classroom IET25', 'classroom', NULL, 'needs_configuration', ARRAY['lecture','examination']::TEXT[], TRUE, TRUE),
    ('IET', 2, 'IET28', 'Classroom IET28', 'classroom', NULL, 'needs_configuration', ARRAY['lecture','examination']::TEXT[], TRUE, TRUE),
    ('IET', 2, 'IET29', 'Classroom IET29', 'classroom', NULL, 'needs_configuration', ARRAY['lecture','examination']::TEXT[], TRUE, TRUE),
    ('IET', 2, 'IET30', 'Classroom IET30', 'classroom', NULL, 'needs_configuration', ARRAY['lecture','examination']::TEXT[], TRUE, TRUE),
    ('IET', 2, 'IET32', 'Seminar Hall IET32', 'seminar_hall', 200, 'supplied_approximation', ARRAY['lecture','examination','event']::TEXT[], TRUE, TRUE),
    ('DEEKSHA', 0, 'LH01', 'Lecture Hall LH01', 'classroom', NULL, 'needs_configuration', ARRAY['lecture','examination','event']::TEXT[], TRUE, TRUE),
    ('DEEKSHA', 0, 'LH02', 'Lecture Hall LH02', 'classroom', NULL, 'needs_configuration', ARRAY['lecture','examination','event']::TEXT[], TRUE, TRUE),
    ('DEEKSHA', 0, 'LH03', 'Lecture Hall LH03', 'classroom', NULL, 'needs_configuration', ARRAY['lecture','examination','event']::TEXT[], TRUE, TRUE),
    ('DEEKSHA', 0, 'LH04', 'Lecture Hall LH04', 'classroom', NULL, 'needs_configuration', ARRAY['lecture','examination','event']::TEXT[], TRUE, TRUE),
    ('DEEKSHA', 0, 'LH05', 'Lecture Hall LH05', 'classroom', NULL, 'needs_configuration', ARRAY['lecture','examination','event']::TEXT[], TRUE, TRUE),
    ('DEEKSHA', 0, 'LH06', 'Lecture Hall LH06', 'classroom', NULL, 'needs_configuration', ARRAY['lecture','examination','event']::TEXT[], TRUE, TRUE),
    ('DEEKSHA', 0, 'LH07', 'Lecture Hall LH07', 'classroom', NULL, 'needs_configuration', ARRAY['lecture','examination','event']::TEXT[], TRUE, TRUE),
    ('DEEKSHA', 1, 'LH08', 'Lecture Hall LH08', 'classroom', NULL, 'needs_configuration', ARRAY['lecture','examination','event']::TEXT[], TRUE, TRUE),
    ('DEEKSHA', 1, 'LH09', 'Lecture Hall LH09', 'classroom', NULL, 'needs_configuration', ARRAY['lecture','examination','event']::TEXT[], TRUE, TRUE),
    ('DEEKSHA', 1, 'LH10', 'Lecture Hall LH10', 'classroom', NULL, 'needs_configuration', ARRAY['lecture','examination','event']::TEXT[], TRUE, TRUE),
    ('DEEKSHA', 1, 'LH11', 'Lecture Hall LH11', 'classroom', NULL, 'needs_configuration', ARRAY['lecture','examination','event']::TEXT[], TRUE, TRUE),
    ('DEEKSHA', 1, 'LH12', 'Lecture Hall LH12', 'classroom', NULL, 'needs_configuration', ARRAY['lecture','examination','event']::TEXT[], TRUE, TRUE),
    ('IET', 1, 'IET14†', 'Unverified drawing label IET14', 'classroom', NULL, 'verify_room_register', ARRAY[]::TEXT[], FALSE, FALSE),
    ('IET', 1, 'IET15†', 'Unverified drawing label IET15', 'classroom', NULL, 'verify_room_register', ARRAY[]::TEXT[], FALSE, FALSE),
    ('IET', 1, 'IET16†', 'Unverified drawing label IET16', 'classroom', NULL, 'verify_room_register', ARRAY[]::TEXT[], FALSE, FALSE),
    ('IET', 1, 'IET22†', 'Unverified drawing label IET22', 'classroom', NULL, 'verify_room_register', ARRAY[]::TEXT[], FALSE, FALSE),
    ('IET', 2, 'IET23†', 'Unverified drawing label IET23', 'classroom', NULL, 'verify_room_register', ARRAY[]::TEXT[], FALSE, FALSE),
    ('DEEKSHA', 1, 'LH13†', 'Unverified drawing label LH13', 'classroom', NULL, 'verify_room_register', ARRAY[]::TEXT[], FALSE, FALSE),
    ('DEEKSHA', 1, 'LH14†', 'Unverified drawing label LH14', 'classroom', NULL, 'verify_room_register', ARRAY[]::TEXT[], FALSE, FALSE)
) AS r(building_code, floor_number, room_number, name, room_type, capacity, capacity_source, permitted_uses, is_active, is_verified)
JOIN buildings b ON b.code = r.building_code
JOIN floors f ON f.building_id = b.id AND f.floor_number = r.floor_number
ON CONFLICT (floor_id, room_number) DO NOTHING;