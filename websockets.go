package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/mattnickolaus/versmith/internal/auth"
)

func (cfg *apiConfig) handlerTestSockets(w http.ResponseWriter, r *http.Request) {
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
		respondWithError(w, http.StatusBadRequest, "Unable to retrieve chirpID from path", nil)
		return
	}
	documentID, err := uuid.Parse(documentIDpath)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Couldn't to parse uuid from document ID string", err)
		return
	}

	go wsDocUpdateReader(conn, documentID)
}

type DocumentUpdateParams struct {
	Title   string `json:"title"`
	Content string `json:"content"`
}

func wsDocUpdateReader(conn *websocket.Conn, docID uuid.UUID) {
	// Go routine checking in loop for updates to document
	for {
		_, data, err := conn.ReadMessage()
		if err != nil {
			// TODO: some response to error
			return
		}

		d := bytes.NewReader(data)

		decoder := json.NewDecoder(d)
		docParam := DocumentUpdateParams{}
		err = decoder.Decode(&docParam)
		if err != nil {
			// TODO: some response to error
			return
		}
		fmt.Printf("Received: %s\n", data)

		if err := conn.WriteMessage(websocket.TextMessage, data); err != nil {
			fmt.Println("Error writing message:", err)
			return
		}
	}
}

// TODO: Write helper fuctions except Websockets that are similar to respondWithJSON or respondWithError

// Below is an example method to broadcast Messages to multiple clients
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
