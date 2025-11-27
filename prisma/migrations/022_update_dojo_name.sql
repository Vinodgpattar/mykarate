-- Migration: Update Dojo Name to Official Name
-- Updates the first branch name to the official dojo name

-- Update the first branch (or all branches) with the official name
UPDATE branches 
SET name = 'SHOTOKAN KARATE-DO YOUTH SPORTS CLUB® HUBBALLI'
WHERE id = (SELECT id FROM branches ORDER BY created_at ASC LIMIT 1);

-- Or update all branches if you want the same name everywhere:
-- UPDATE branches 
-- SET name = 'SHOTOKAN KARATE-DO YOUTH SPORTS CLUB® HUBBALLI';

-- Verify the update
SELECT id, name, code, status 
FROM branches 
ORDER BY created_at ASC;

