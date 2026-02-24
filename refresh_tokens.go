package main

import (
	"net/http"
	"time"

	"github.com/mattnickolaus/versmith/internal/auth"
)

func (cfg *apiConfig) handlerRefresh(w http.ResponseWriter, r *http.Request) {
	type accessTokenResponse struct {
		Token string `json:"token"`
	}

	cookie, err := r.Cookie("refresh_token")
	if err != nil {
		if err == http.ErrNoCookie {
			respondWithError(w, http.StatusUnauthorized, "Refresh token cookie not found", err)
		}
		respondWithError(w, http.StatusBadRequest, "Bad request", err)
	}
	refreshTokenString := cookie.Value

	user, err := cfg.db.GetUserFromRefreshToken(r.Context(), refreshTokenString)
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, "Couldn't get user from refresh token", err)
		return
	}

	accessToken, err := auth.MakeJWT(
		user.ID,
		cfg.secret,
		time.Minute*30,
	)
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, "Couldn't validate token", err)
		return
	}

	respondWithJSON(w, http.StatusOK, accessTokenResponse{
		Token: accessToken,
	})
}

func (cfg *apiConfig) handlerRevoke(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("refresh_token")
	if err != nil {
		if err == http.ErrNoCookie {
			respondWithError(w, http.StatusUnauthorized, "Refresh token cookie not found", err)
		}
		respondWithError(w, http.StatusBadRequest, "Bad request", err)
	}
	refreshTokenString := cookie.Value

	_, err = cfg.db.RevokeRefreshToken(r.Context(), refreshTokenString)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Couldn't revoke session", err)
		return
	}

	respondWithJSON(w, http.StatusNoContent, nil)
}
