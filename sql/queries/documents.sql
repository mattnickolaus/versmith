-- name: CreateDocument :one
INSERT INTO documents (
    id,
    created_at,
    updated_at,
    title,
    user_id
) VALUES (
    gen_random_uuid(),
    NOW(),
    NOW(),
    $1,
    $2
)
RETURNING *;

-- name: GetDocumentsByOwner :many
SELECT 
    documents.id,
    documents.created_at,
    documents.updated_at,
    documents.title,
    documents.user_id as user_id,
    users.display_name as owner,
    users.email as owner_email
FROM documents
JOIN users ON user_id = users.id
WHERE user_id = $1
ORDER BY documents.updated_at DESC;

-- name: GetDocumentByID :one
SELECT 
    documents.id,
    documents.created_at,
    documents.updated_at,
    documents.title,
    documents.user_id as user_id,
    documents.content,
    users.display_name as owner,
    users.email as owner_email
FROM documents
JOIN users ON user_id = users.id
WHERE documents.id = $1;

-- name: DeleteDocumentByID :exec
DELETE FROM documents
    WHERE id = $1;

-- name: UpdateDocumentContentByID :one
UPDATE documents
SET content = $2,
    updated_at = NOW()
WHERE id = $1
RETURNING *;


-- name: UpdateDocumentTitleByID :one
UPDATE documents
SET title = $2,
    updated_at = NOW()
WHERE id = $1
RETURNING *;
