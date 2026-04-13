package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"sync"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/mattnickolaus/versmith/internal/auth"
	"github.com/mattnickolaus/versmith/internal/database"
)

/*
	- [ ] Okay so I'm going to first focus on a pretty naive implementation where I'll stand up a websocket with the
	client and just read pretty much every updated key press into some sort of simple in memory cache that eventually
	reads that data into the database.

	- [ ] After I get that going I'll also want to figure out storing other information like cursor position.

	- [ ] And after that then I'll think about implementing RabbitMQ for pubsub out to publish document changes out to all users
*/

func (cfg *apiConfig) serverDocumentWS(w http.ResponseWriter, r *http.Request) {
	conn, err := cfg.upgrader.Upgrade(w, r, nil)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Couldn't upgrade connection to websocket", err)
		return
	}
	defer conn.Close()

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

	go cfg.wsDocUpdateReader(conn, documentID)
}

type DocumentUpdateParams struct {
	Content string `json:"content"`
}

func (cfg apiConfig) wsDocUpdateReader(conn *websocket.Conn, docID uuid.UUID) {
	// Go routine checking in loop for updates to document

	doc := DocumentUpdateParams{}
	for {
		err := conn.ReadJSON(doc)
		if err != nil {
			wsCriticalErrorCloseConn(conn, websocket.CloseInternalServerErr, "Could not parse JSON", err)
			return
		}

		cfg.db.UpdateDocumentContentByID(
			context.Background(),
			database.UpdateDocumentContentByIDParams{
				ID:      docID,
				Content: sql.NullString{String: doc.Content, Valid: true},
			},
		)

	}
}

// TODO: Write helper fuctions except Websockets that are similar to respondWithJSON or respondWithError

// NOTE: gorilla has a helper func: conn.WriteJSON(v interface{}) error (as well as ReadJSON), which seems to meet the needs of respondWithJSON
// Errors are a different story because if the error is critical I will just close the ws connection or if no critical it
// will return back json with the error
func wsRespondWithError(conn *websocket.Conn, msg string, err error) {
	if err != nil {
		log.Println(err)
	}
	type errorResponse struct {
		Error string `json:"error"`
	}
	conn.WriteJSON(
		errorResponse{
			Error: msg,
		},
	)
}

func wsCriticalErrorCloseConn(conn *websocket.Conn, code int, msg string, err error) {
	if err != nil {
		log.Println(err)
	}
	// See Gorilla Close Codes https://pkg.go.dev/github.com/gorilla/websocket#pkg-constants
	if code > 1000 {
		log.Printf("Closing connection with code %d: %s", code, msg)
	}
	closeMsg := websocket.FormatCloseMessage(code, msg)

	err = conn.WriteMessage(websocket.CloseMessage, closeMsg)
	if err != nil {
		wsRespondWithError(conn, "Couldn't write close message", err)
		return
	}
	conn.Close()
}

// Below is an example method to broadcast Messages to multiple clients -- instead will likely opt for RabbitMQ
var clients = make(map[*websocket.Conn]bool) // Connected clients
var broadcast = make(chan []byte)            // Broadcast channel
var mutex = &sync.Mutex{}                    // Protect clients map

func (cfg apiConfig) wsHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := cfg.upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("Error upgrading:", err)
		return
	}
	defer conn.Close()

	mutex.Lock()
	clients[conn] = true
	mutex.Unlock()

	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			mutex.Lock()
			delete(clients, conn)
			mutex.Unlock()
			break
		}
		broadcast <- message
	}
}

func handleMessages() {
	for {
		// Grab the next message from the broadcast channel
		message := <-broadcast

		// Send the message to all connected clients
		mutex.Lock()
		for client := range clients {
			err := client.WriteMessage(websocket.TextMessage, message)
			if err != nil {
				client.Close()
				delete(clients, client)
			}
		}
		mutex.Unlock()
	}
}
