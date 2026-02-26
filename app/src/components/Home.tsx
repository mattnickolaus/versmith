import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'

interface Document {
    id: string;
    created_at: string;
    updated_at: string;
    title: string;
    user_id: string;
    owner: string;
    owner_email: string;
}

interface DocumentsResponse {
    documents: []Document;
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
    console.log(responseData);
    return responseData;
}

function Home() {
    const { accessToken, isAuthenticated } = useAuth();
    const [documentData, setDocumentData] = useState(null);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    useEffect(() => {
	if (isAuthenticated) {
	    getDocuments(accessToken).then((data) => {
	      setDocumentData(data);
	      setLoading(false);
	    });
	} else {
	    console.log("Did not get access token");
	    navigate('/login');
	}
    }, [accessToken, isAuthenticated]);

    if (loading) {
	return <div>Loading</div>
    }
    console.log(`This should be a document: ${documentData?.documents}`);

    return(
	<div>
	    <h1 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-white">A home page</h1>

	</div>
    );
}

export default Home;
