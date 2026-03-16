'use client'

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { DocumentPlusIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface CreateDocumentRequestData {
    title: string;
}

interface DocumentCreatedResponseData {
    id: string;
    created_at: string;
    updated_at: string;
    title: string;
    user_id: string;
}

async function createDocumentRequest(data: CreateDocumentRequestData, accessToken: string): Promise<DocumentCreatedResponseData> {
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
	throw new Error (`Response Code:${response.status}: ${response}`);
    }

    const responseData: DocumentCreatedResponseData = await response.json();
    return responseData;
}

export default function CreateDocumentModal({open, setOpen}) {
    const [documentTitle, setDocumentTitle] = useState('');
    const { accessToken, isAuthenticated } = useAuth();

    const navigate = useNavigate();

    const handleDocumentCreate = (event) => {
	event.preventDefault();

	if (isAuthenticated) {
	    const newDocument: CreateDocumentRequestData = {
		title: documentTitle,
	    };

	    createDocumentRequest(newDocument, accessToken)
		.then(createdDocument => {
		    const newDoucmentID = createdDocument.id;
		    console.log(`Document ID:${newDoucmentID}, Title:${createdDocument.title}, Created:${createdDocument.created_at}`);

		    // change back to specific document route
		    navigate(`/api/documents/${newDoucmentID}`);
		})
		.catch(error => {
		    console.log(error);
		})
	} else {
	    console.log("Did not get access token");
	    navigate('/login');
	}

    };

  return (
    <div>

      <Dialog open={open} onClose={setOpen} className="relative z-10">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-900/50 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
        />

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <DialogPanel
              transition
              className="relative transform overflow-hidden rounded-lg bg-gray-800 text-left shadow-xl outline -outline-offset-1 outline-white/10 transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg data-closed:sm:translate-y-0 data-closed:sm:scale-95"
            >
              <div className="bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-indigo-500/30 sm:mx-0 sm:size-10">
                    <DocumentPlusIcon aria-hidden="true" className="size-6 text-indigo-400" />
                  </div>

                  <div className="flex-grow mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <DialogTitle as="h3" className="text-base font-semibold text-white">
                      Create Document
                    </DialogTitle>

		    <form id="createDocumentForm" onSubmit={handleDocumentCreate} className="pr-15">
			{ /*
			<div className="mt-2">
			  <label className="text-sm text-gray-400">Document Title</label>
			</div>
			*/}
			<div className="mt-2">
			    <input
			      id="documentTitle"
			      name="documentTitle"
			      value={documentTitle}
			      onChange={(e) => setDocumentTitle(e.target.value)}
			      required
			      placeholder="Document Title"
			      className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
			    />
			</div>
		    </form>

                  </div>

                </div>
              </div>
              <div className="bg-gray-700/25 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 justify-between">
                <button
                  type="submit"
		  form="createDocumentForm"
                  className="inline-flex w-full justify-center rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-400 sm:ml-3 sm:w-auto"
                >
		    <PlusIcon className="h-5 w-5"/>
		    <span className="ml-2">Create</span>
                </button>
                <button
                  type="button"
                  data-autofocus
                  onClick={() => setOpen(false)}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-white inset-ring inset-ring-white/5 hover:bg-white/20 sm:mt-0 sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
