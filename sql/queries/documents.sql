-- name: CreateDocument :one
INSERT INTO documents (
    id,
    created_at,
    updated_at,
    title,
    url,
    user_id
) VALUES (
    $1,
    NOW(),
    NOW(),
    $2,
    $3,
    $4
)
RETURNING *;

