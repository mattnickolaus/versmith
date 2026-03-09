-- name: CreateUser :one
INSERT INTO users (id, created_at, updated_at, email, hashed_password)
VALUES (
    gen_random_uuid(),
    NOW(),
    NOW(),
    $1,
    $2
)
RETURNING *;

-- name: DeleteAllUsers :exec
DELETE FROM users;

-- name: GetUserByEmail :one
SELECT * FROM users
WHERE $1 = email
LIMIT 1;

-- name: GetUserByID :one
SELECT * FROM users
WHERE id = $1
LIMIT 1;

-- name: UpdateUserEmail :one
UPDATE users
SET
    email = $2,
    updated_at = NOW()
WHERE $1 = id
RETURNING *;

-- name: UpdateUserDisplayName :one
UPDATE users
SET
    display_name = $2,
    updated_at = NOW()
WHERE $1 = id
RETURNING *;

-- name: UpdateUserPassword :one
UPDATE users
SET
    hashed_password = $2,
    updated_at = NOW()
WHERE $1 = id
RETURNING *;
