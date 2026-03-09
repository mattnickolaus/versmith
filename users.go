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
	ID          uuid.UUID `json:"id"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	Email       string    `json:"email"`
	AccessToken string    `json:"access_token"`
	DisplayName string    `json:"display_name"`
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
	setRefreshTokenCookie(w, writtenRefreshToken)

	returnedUser := User{
		ID:          user.ID,
		CreatedAt:   user.CreatedAt.Time,
		UpdatedAt:   user.UpdatedAt.Time,
		Email:       user.Email,
		AccessToken: tokenString,
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
	setRefreshTokenCookie(w, writtenRefreshToken)

	returnedUser := User{
		ID:          user.ID,
		CreatedAt:   user.CreatedAt.Time,
		UpdatedAt:   user.UpdatedAt.Time,
		Email:       user.Email,
		AccessToken: tokenString,
	}

	respondWithJSON(w, http.StatusOK, returnedUser)
}

func setRefreshTokenCookie(w http.ResponseWriter, refreshToken database.RefreshToken) {
	cookie := http.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken.Token,
		Expires:  refreshToken.ExpiresAt.Time,
		HttpOnly: true,
		// Secure:   true, // turn back on after implementing https
		Path:     "/", // NOTE: May want to restrict this to /api/refresh and /api/revoke (need to test)
		SameSite: http.SameSiteStrictMode,
	}

	http.SetCookie(w, &cookie)
}

func (cfg *apiConfig) handlerGetUser(w http.ResponseWriter, r *http.Response) {
	token, err := auth.GetBearerToken(r.Header)
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, "Counldn't find JWT", err)
		return
	}
	userID, err := auth.ValidateJWT(token, cfg.secret)
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, "Counldn't validate JWT", err)
		return
	}

	u, err := cfg.db.GetUserByID(r.Request.Context(), userID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Unable to find user by that ID", err)
		return
	}

	returnedUser := User{
		ID:          u.ID,
		CreatedAt:   u.CreatedAt.Time,
		UpdatedAt:   u.CreatedAt.Time,
		Email:       u.Email,
		DisplayName: u.DisplayName.String,
	}

	respondWithJSON(w, http.StatusOK, returnedUser)
}
