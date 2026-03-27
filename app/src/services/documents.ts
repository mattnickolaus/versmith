// Document requests

export interface CreateDocumentRequestData {
  title: string;
}

export interface DocumentCreatedResponseData {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  user_id: string;
}

export async function createDocumentRequest(data: CreateDocumentRequestData, accessToken: string | null): Promise<DocumentCreatedResponseData> {
  if (accessToken === null) {
    throw new Error("Access token was not provided (null), unable to createDocument");
  }
  const url = '/api/documents';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  } as RequestInit);

  if (!response.ok) {
    throw new Error(`Response Code:${response.status}: ${response}`);
  }

  const responseData: DocumentCreatedResponseData = await response.json();
  return responseData;
}


export interface Document {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  user_id: string;
  owner: string;
  owner_email: string;
}

export interface DocumentsResponse {
  documents: Document[];
}

export async function getDocuments(accessToken: string | null): Promise<DocumentsResponse> {
  if (accessToken === null) {
    throw new Error("Access token was not provided (null), unable to getDocuments");
  }

  const url = 'api/documents';
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  } as RequestInit);

  if (!response.ok) {
    throw new Error(`HTTP error, status: ${response.status}`);
  }

  const responseData: DocumentsResponse = await response.json();
  console.log(responseData);
  return responseData;
}

export async function deleteDocument(accessToken: string | null, documentId: string): Promise<void> {
  if (accessToken === null) {
    throw new Error("Access token was not provided (null), unable to deleteDocuments");
  }
  const url = `api/documents/${documentId}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }
  } as RequestInit);

  if (response.status !== 204) {
    throw new Error(`Delete failed HTTP error, status: ${response.status}`);
  }
}

