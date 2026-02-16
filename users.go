package main

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/mattnickolaus/versmith/internal/auth"
	"github.com/mattnickolaus/versmith/internal/database"
)

type User struct {
	ID           uuid.UUID `json:"id"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
	Email        string    `json:"email"`
	Token        string    `json:"token"`
	RefreshToken string    `json:"refresh_token"`
}

func (cfg *apiConfig) handlerUserCreate(w http.ResponseWriter, r *http.Request) {
	type userParameters struct {
		Password string `json:"password"`
		Email    string `json:"email"`
	}

	decoder := json.NewDecoder(r.Body)
	u := userParameters{}

	err := decoder.Decode(&u)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Couldn't decode paramters", err)
		return
	}
	if u.Password == "" || u.Email == "" {
		respondWithError(w, http.StatusBadRequest, "Email and password are required", nil)
		return
	}

	hashedPassword, err := auth.HashPassword(u.Password)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Couldn't hash password", err)
		return
	}
	sqlHashedPassword := sql.NullString{String: hashedPassword, Valid: true}

	user, err := cfg.db.CreateUser(
		r.Context(),
		database.CreateUserParams{
			Email:          u.Email,
			HashedPassword: sqlHashedPassword,
		},
	)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Couldn't create user in database", err)
		return
	}

	tokenString, err := auth.MakeJWT(user.ID, cfg.secret, time.Minute*30)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Unable to generate access JWT", err)
		return
	}

	refreshToken, err := auth.MakeRefreshToken()
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Unable to create refresh token", err)
		return
	}

	// setting initial signup to a sooner expiration for refresh token
	expiresTwentyFourHoursFromNow := sql.NullTime{
		Time:  time.Now().Add(time.Hour * 24),
		Valid: true,
	}

	writtenRefreshToken, err := cfg.db.CreateRefreshToken(
		r.Context(),
		database.CreateRefreshTokenParams{
			Token:     refreshToken,
			ExpiresAt: expiresTwentyFourHoursFromNow,
			UserID:    user.ID,
		},
	)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Couldn't save refresh token", err)
		return
	}

	returnedUser := User{
		ID:           user.ID,
		CreatedAt:    user.CreatedAt.Time,
		UpdatedAt:    user.UpdatedAt.Time,
		Email:        user.Email,
		Token:        tokenString,
		RefreshToken: writtenRefreshToken.Token,
	}

	respondWithJSON(w, http.StatusOK, returnedUser)
}

func (cfg *apiConfig) handlerLogin(w http.ResponseWriter, r *http.Request) {
	type loginParameters struct {
		Password string `json:"password"`
		Email    string `json:"email"`
	}

	decoder := json.NewDecoder(r.Body)
	u := loginParameters{}

	err := decoder.Decode(&u)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Couldn't decode paramters", err)
		return
	}

	user, err := cfg.db.GetUserByEmail(r.Context(), u.Email)
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, "Incorrect email or passowrd", err)
		return
	}

	matched, err := auth.CheckPasswordHash(u.Password, user.HashedPassword.String)
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, "Incorrect email or passowrd", err)
		return
	}
	if !matched {
		respondWithError(w, http.StatusUnauthorized, "Incorrect email or passowrd", err)
		return
	}

	tokenString, err := auth.MakeJWT(user.ID, cfg.secret, time.Minute*30)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Unable to generate access JWT", err)
		return
	}

	refreshToken, err := auth.MakeRefreshToken()
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Unable to create refresh token", err)
		return
	}

	expiresFourteenDaysFromToday := sql.NullTime{
		Time:  time.Now().Add(time.Hour * 24 * 14),
		Valid: true,
	}

	writtenRefreshToken, err := cfg.db.CreateRefreshToken(
		r.Context(),
		database.CreateRefreshTokenParams{
			Token:     refreshToken,
			ExpiresAt: expiresFourteenDaysFromToday,
			UserID:    user.ID,
		},
	)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Couldn't save refresh token", err)
		return
	}

	returnedUser := User{
		ID:           user.ID,
		CreatedAt:    user.CreatedAt.Time,
		UpdatedAt:    user.UpdatedAt.Time,
		Email:        user.Email,
		Token:        tokenString,
		RefreshToken: writtenRefreshToken.Token,
	}

	respondWithJSON(w, http.StatusOK, returnedUser)
}
