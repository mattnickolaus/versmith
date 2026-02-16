-- +goose up
ALTER TABLE documents
DROP COLUMN url;

-- +goose down
ALTER TABLE documents 
ADD COLUMN url TEXT UNIQUE NOT NULL;
