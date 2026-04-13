package main

import (
	"encoding/json"
	"net/http"
	"regexp"
	"sort"
	"time"

	"github.com/google/uuid"
	"github.com/mattnickolaus/versmith/internal/auth"
	"github.com/mattnickolaus/versmith/internal/database"
)

const (
	allowableTitleChars string = "^[a-zA-Z0-9 _-]+$" // alpha numeric, `-` and `_` and ` `
)

type Document struct {
	ID        uuid.UUID `json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	UserID    uuid.UUID `json:"user_id"`
}

func (cfg *apiConfig) handlerCreateDocument(w http.ResponseWriter, r *http.Request) {
	type documentParameters struct {
		Title string `json:"title"`
	}

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

	decoder := json.NewDecoder(r.Body)
	d := documentParameters{}
	err = decoder.Decode(&d)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Couldn't decode parameters", err)
		return
	}

	validTitle, err := isValidTilte(d.Title)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Couldn't compile regex for title match", err)
		return
	}
	if !validTitle {
		respondWithError(w, http.StatusBadRequest, "Invalid title name", nil)
		return
	}

	createdDocument, err := cfg.db.CreateDocument(
		r.Context(),
		database.CreateDocumentParams{
			Title:  d.Title,
			UserID: userID,
		},
	)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Couldn't create document", err)
		return
	}

	respondWithJSON(w, http.StatusOK, Document{
		ID:        createdDocument.ID,
		CreatedAt: createdDocument.CreatedAt.Time,
		UpdatedAt: createdDocument.UpdatedAt.Time,
		Title:     createdDocument.Title,
		UserID:    createdDocument.UserID,
	})
}

func isValidTilte(title string) (bool, error) {
	match, err := regexp.MatchString(allowableTitleChars, title)
	if err != nil {
		return false, err
	}
	return match, nil
}

func (cfg apiConfig) handlerGetDocuments(w http.ResponseWriter, r *http.Request) {
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

	// TODO: Add URL query parameter for shared_with_me
	// default would be false, in which we would query like below
	// if true we would create a query where we get all the shared docs (only shared)
	//	(frontend would be separate pages but for api standardization)

	documents, err := cfg.db.GetDocumentsByOwner(r.Context(), userID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Couldn't find documents", err)
		return
	}

	type returnHomePageDocuments struct {
		ID         uuid.UUID `json:"id"`
		CreatedAt  time.Time `json:"created_at"`
		UpdatedAt  time.Time `json:"updated_at"`
		Title      string    `json:"title"`
		UserID     uuid.UUID `json:"user_id"`
		Owner      string    `json:"owner"`
		OwnerEmail string    `json:"owner_email"`
	}

	responseDocuments := []returnHomePageDocuments{}
	for _, d := range documents {
		newDoc := returnHomePageDocuments{
			ID:         d.ID,
			CreatedAt:  d.CreatedAt.Time,
			UpdatedAt:  d.UpdatedAt.Time,
			Title:      d.Title,
			UserID:     d.UserID,
			Owner:      d.Owner.String,
			OwnerEmail: d.OwnerEmail,
		}
		responseDocuments = append(responseDocuments, newDoc)
	}

	sortType := r.URL.Query().Get("sort")
	if sortType != "desc" && sortType != "asc" && sortType != "" {
		respondWithError(w, http.StatusNotFound, "Invalid sort parameter: accepts only 'asc' or 'desc'", nil)
		return
	}
	if sortType == "asc" {
		sort.Slice(responseDocuments, func(i, j int) bool {
			return responseDocuments[i].UpdatedAt.Before(responseDocuments[j].UpdatedAt)
		})
	}

	respondWithJSON(w, http.StatusOK, responseDocuments)
}

func (cfg *apiConfig) handlerGetDocument(w http.ResponseWriter, r *http.Request) {
	type returnDocument struct {
		ID         uuid.UUID `json:"id"`
		CreatedAt  time.Time `json:"created_at"`
		UpdatedAt  time.Time `json:"updated_at"`
		Title      string    `json:"title"`
		Content    string    `json:"content"`
		UserID     uuid.UUID `json:"user_id"`
		Owner      string    `json:"owner"`
		OwnerEmail string    `json:"owner_email"`
	}

	token, err := auth.GetBearerToken(r.Header)
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, "Counldn't find JWT", err)
		return
	}
	_, err = auth.ValidateJWT(token, cfg.secret)
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, "Counldn't validate JWT", err)
		return
	}

	documentIDpath := r.PathValue("documentID")
	if documentIDpath == "" {
		respondWithError(w, http.StatusBadRequest, "Unable to retrieve documentID from path", nil)
		return
	}
	documentID, err := uuid.Parse(documentIDpath)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Couldn't to parse uuid from document ID string", err)
		return
	}

	queriedDocument, err := cfg.db.GetDocumentByID(r.Context(), documentID)
	if err != nil {
		respondWithError(w, http.StatusNotFound, "Couldn't find document of that ID", err)
		return
	}

	d := returnDocument{
		ID:         queriedDocument.ID,
		CreatedAt:  queriedDocument.CreatedAt.Time,
		UpdatedAt:  queriedDocument.UpdatedAt.Time,
		Title:      queriedDocument.Title,
		Content:    queriedDocument.Content.String,
		UserID:     queriedDocument.UserID,
		Owner:      queriedDocument.Owner.String,
		OwnerEmail: queriedDocument.OwnerEmail,
	}

	respondWithJSON(w, http.StatusOK, d)
}

func (cfg *apiConfig) handlerDeleteDocument(w http.ResponseWriter, r *http.Request) {
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

	documentIDpath := r.PathValue("documentID")
	if documentIDpath == "" {
		respondWithError(w, http.StatusBadRequest, "Unable to retrieve documentID from path", nil)
		return
	}
	documentID, err := uuid.Parse(documentIDpath)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Couldn't to parse uuid from document ID string", err)
		return
	}

	queriedDocument, err := cfg.db.GetDocumentByID(r.Context(), documentID)
	if err != nil {
		respondWithError(w, http.StatusNotFound, "Couldn't find document of that ID", err)
		return
	}
	if queriedDocument.UserID != userID {
		respondWithError(w, http.StatusForbidden, "Not authorized to delete that document", nil)
		return
	}

	err = cfg.db.DeleteDocumentByID(r.Context(), documentID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Couldn't delete document by that ID", err)
		return
	}

	respondWithJSON(w, http.StatusNoContent, nil)
}
