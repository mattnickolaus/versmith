-- +goose up
ALTER TABLE users 
ADD COLUMN display_name TEXT;

-- +goose down
ALTER TABLE users
DROP COLUMN display_name;
