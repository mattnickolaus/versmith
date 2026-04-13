package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"

	"github.com/mattnickolaus/versmith/internal/database"

	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

type apiConfig struct {
	db       *database.Queries
	port     string
	platform string
	secret   string
	upgrader websocket.Upgrader
}

func main() {
	godotenv.Load(".env")

	dbURL := os.Getenv("DB_URL")
	if dbURL == "" {
		log.Fatal("DB_URL must be set")
	}

	port := os.Getenv("PORT")
	if port == "" {
		log.Fatal("PORT must be set")
	}

	platformType := os.Getenv("PLATFORM")
	if platformType == "" {
		log.Fatal("PLATFORM must be set")
	}

	filePathRoot := os.Getenv("FILEPATH_ROOT")
	if filePathRoot == "" {
		log.Fatal("FILEPATH_ROOT must be set")
	}

	secret := os.Getenv("SECRET")
	if secret == "" {
		log.Fatal("SECRET must be set")
	}

	db, err := openDB(dbURL)
	if err != nil {
		log.Fatalf("Couldn't connect to database: %v", err)
	}
	dbQueries := database.New(db)

	cfg := apiConfig{
		db:       dbQueries,
		port:     port,
		platform: platformType,
		secret:   secret,
	}

	mux := http.NewServeMux()

	mux.Handle("/app/", http.StripPrefix("/app", http.FileServer(http.Dir(filePathRoot))))

	mux.HandleFunc("POST /admin/reset", cfg.handlerReset)

	mux.HandleFunc("POST /api/users", cfg.handlerUserCreate)
	mux.HandleFunc("POST /api/login", cfg.handlerLogin)
	mux.HandleFunc("GET /api/users", cfg.handlerGetUser)
	mux.HandleFunc("PUT /api/users", cfg.handlerUpdateUser)

	mux.HandleFunc("POST /api/documents", cfg.handlerCreateDocument)
	mux.HandleFunc("GET /api/documents", cfg.handlerGetDocuments)
	mux.HandleFunc("GET /api/documents/{documentID}", cfg.handlerGetDocument)
	mux.HandleFunc("DELETE /api/documents/{documentID}", cfg.handlerDeleteDocument)

	mux.HandleFunc("/ws/documents/{documentID}", cfg.serverDocumentWS)

	mux.HandleFunc("POST /api/refresh", cfg.handlerRefresh)
	mux.HandleFunc("POST /api/revoke", cfg.handlerRevoke)

	srv := &http.Server{
		Addr:    ":" + port,
		Handler: mux,
	}

	log.Printf("Serving on: http://localhost:%s\n", port)
	log.Fatal(srv.ListenAndServe())
}

func openDB(dsn string) (*sql.DB, error) {
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, err
	}

	err = db.Ping()
	if err != nil {
		db.Close()
		return nil, err
	}

	return db, nil
}
