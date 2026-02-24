import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'

interface Document {
    id: string;
}

interface DocumentsResponse {

}

async function getDocuments(accessToken: string): Promise<DocumentsResponse> {
    const url = 'api/documents';

    const response = await fetch(url, {
	method: 'GET',
	headers: {
	    'Authorization': `Bearer ${accessToken}`,
	    'Content-Type': 'application/json',
	},
    } as RequestInit);

    if (!response.ok) {
	throw new Error (`HTTP error, status: ${response.status}`);
    }

    const responseData: DocumentsResponse = await response.json();
    return responseData;
}

function Home() {

    return(
	<div>
	    <h1 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-white">A home page</h1>
	</div>
    );
}

export default Home;
