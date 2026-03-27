import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Bars3Icon, BellIcon, XMarkIcon, PlusIcon, EllipsisVerticalIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import CreateDocumentModal from './CreateDocumentModal.js';
import { UserCircleIcon } from '@heroicons/react/24/solid'

import { useAuth } from '../contexts/AuthContext.js';
import { refreshAccessToken, revokeRefreshToken } from '../services/auth.js';
import { getDocuments, deleteDocument, type DocumentsResponse } from '../services/documents.js'

function dateFormatter(dateString: string): string {
  const date = new Date(dateString);

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date); // Example output: "Feb 18, 2025"

  return `${formattedDate}`;
}

const user = {
  name: 'Letem Cook',
  email: 'letem@example.com',
  imageUrl: '',
};
// https://media.istockphoto.com/id/2221502929/vector/flat-illustration-in-grayscale-avatar-user-profile-person-icon-gender-neutral-silhouette.jpg?s=612x612&w=0&k=20&c=UXmJu28hV6V_kdgSdGxSzv86liqvFHu3Kl3-V2P4brc=

const navigation = [
  { name: 'My Documents', href: '#', current: true },
  { name: 'Shared with Me', href: '#', current: false },
];

const userNavigation = [
  { name: 'Your profile', href: '/profile' },
  { name: 'Settings', href: '#' },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

function Home() {
  const { accessToken, setAccessToken, isAuthenticated } = useAuth();
  const [documentData, setDocumentData] = useState<DocumentsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const [openCreate, setOpenCreate] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      getDocuments(accessToken).then((data) => {
        setDocumentData(data);
        setLoading(false);
      });
    } else {
      console.log("Unable to get access token, attemping to refresh");

      refreshAccessToken()
        .then((data) => {
          setAccessToken(data.access_token);
          getDocuments(data.access_token).then((data) => {
            setDocumentData(data);
            setLoading(false);
          });
        })
        .catch((error) => {
          console.log(`Did not get access token: ${error}`);
          navigate('/login');
        });

    }
  }, [accessToken, isAuthenticated]);

  if (loading) {
    return <div>Loading</div>
  }


  const handleOpenDocument = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    console.log("Go to document");
  };

  const handleDocumentDelete = (e: React.MouseEvent<HTMLButtonElement>, document_id: string) => {
    e.stopPropagation()
    deleteDocument(accessToken, document_id).then(() => {
      setLoading(false);
    });
    console.log(`Delete document with id: ${document_id}`);

    setDocumentData(documentData => documentData.filter(document => document.id != document_id));
  };

  const handleRefreshRevoke = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    revokeRefreshToken();
    navigate('/login');
  }

  return (
    <>

      <div className="min-h-full">
        <Disclosure as="nav" className="bg-gray-800/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center">
                <div className="shrink-0">
                  <img
                    alt="Versmith Logo"
                    src="https://static.thenounproject.com/png/17491-200.png"
                    className="size-8 invert"
                  />
                </div>
                <div className="hidden md:block">
                  <div className="ml-10 flex items-baseline space-x-4">
                    {navigation.map((item) => (
                      <a
                        key={item.name}
                        href={item.href}
                        aria-current={item.current ? 'page' : undefined}
                        className={classNames(
                          item.current
                            ? 'bg-gray-950/50 text-white'
                            : 'text-gray-300 hover:bg-white/5 hover:text-white',
                          'rounded-md px-3 py-2 text-sm font-medium',
                        )}
                      >
                        {item.name}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="ml-4 flex items-center md:ml-6">
                  <button
                    type="button"
                    className="relative rounded-full p-1 text-gray-400 hover:text-white focus:outline-2 focus:outline-offset-2 focus:outline-indigo-500"
                  >
                    <span className="absolute -inset-1.5" />
                    <span className="sr-only">View notifications</span>
                    <BellIcon aria-hidden="true" className="size-6" />
                  </button>

                  {/* Profile dropdown */}
                  <Menu as="div" className="relative ml-3">
                    <MenuButton className="relative flex max-w-xs items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">
                      <span className="absolute -inset-1.5" />
                      <span className="sr-only">Open user menu</span>
                      {
                        user.imageUrl ?
                          <img
                            alt=""
                            src={user.imageUrl}
                            className="size-8 rounded-full outline -outline-offset-1 outline-white/10"
                          />
                          :
                          <UserCircleIcon aria-hidden="true" className="size-8 text-gray-500 outline -outline-offset-1 outline-white/10 rounded-full" />
                      }
                    </MenuButton>

                    <MenuItems
                      transition
                      className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-gray-800 py-1 outline-1 -outline-offset-1 outline-white/10 transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
                    >
                      {userNavigation.map((item) => (
                        <MenuItem key={item.name}>
                          <Link
                            to={item.href}
                            className="block px-4 py-2 text-sm text-gray-300 data-focus:bg-white/5 data-focus:outline-hidden"
                          >
                            {item.name}
                          </Link>
                        </MenuItem>
                      ))}

                      <MenuItem key="Signout">
                        <button
                          onClick={(e) => handleRefreshRevoke(e)}
                          className="w-full block px-4 py-2 text-left text-sm text-gray-300 data-focus:bg-white/5 data-focus:outline-hidden"
                        >
                          Sign Out
                        </button>
                      </MenuItem>
                    </MenuItems>
                  </Menu>
                </div>
              </div>
              <div className="-mr-2 flex md:hidden">
                {/* Mobile menu button */}
                <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-white/5 hover:text-white focus:outline-2 focus:outline-offset-2 focus:outline-indigo-500">
                  <span className="absolute -inset-0.5" />
                  <span className="sr-only">Open main menu</span>
                  <Bars3Icon aria-hidden="true" className="block size-6 group-data-open:hidden" />
                  <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-open:block" />
                </DisclosureButton>
              </div>
            </div>
          </div>

          <DisclosurePanel className="md:hidden">
            <div className="space-y-1 px-2 pt-2 pb-3 sm:px-3">
              {navigation.map((item) => (
                <DisclosureButton
                  key={item.name}
                  as="a"
                  href={item.href}
                  aria-current={item.current ? 'page' : undefined}
                  className={classNames(
                    item.current ? 'bg-gray-950/50 text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white',
                    'block rounded-md px-3 py-2 text-base font-medium',
                  )}
                >
                  {item.name}
                </DisclosureButton>
              ))}
            </div>
            <div className="border-t border-white/10 pt-4 pb-3">
              <div className="flex items-center px-5">
                <div className="shrink-0">
                  {
                    user.imageUrl ?
                      <img
                        alt=""
                        src={user.imageUrl}
                        className="size-8 rounded-full outline -outline-offset-1 outline-white/10"
                      />
                      :
                      <UserCircleIcon aria-hidden="true" className="size-8 text-gray-500 outline -outline-offset-1 outline-white/10" />
                  }
                </div>
                <div className="ml-3">
                  <div className="text-base/5 font-medium text-white">{user.name}</div>
                  <div className="text-sm font-medium text-gray-400">{user.email}</div>
                </div>
                <button
                  type="button"
                  className="relative ml-auto shrink-0 rounded-full p-1 text-gray-400 hover:text-white focus:outline-2 focus:outline-offset-2 focus:outline-indigo-500 rounded-full"
                >
                  <span className="absolute -inset-1.5" />
                  <span className="sr-only">View notifications</span>
                  <BellIcon aria-hidden="true" className="size-6" />
                </button>
              </div>
              <div className="mt-3 space-y-1 px-2">
                {userNavigation.map((item) => (
                  <DisclosureButton
                    key={item.name}
                    as="a"
                    href={item.href}
                    className="block rounded-md px-3 py-2 text-base font-medium text-gray-400 hover:bg-white/5 hover:text-white"
                  >
                    {item.name}
                  </DisclosureButton>
                ))}
              </div>
            </div>
          </DisclosurePanel>
        </Disclosure>

        <header className="relative bg-gray-800 after:pointer-events-none after:absolute after:inset-x-0 after:inset-y-0 after:border-y after:border-white/10">
          <div className="flex mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight text-white">My Documents</h1>
            <button onClick={() => setOpenCreate(true)} className="flex items-center space-x-2 p-2 rounded-md bg-indigo-500 text-white hover:bg-indigo-400 cursor-pointer">
              <PlusIcon className="h-5 w-5" />
              <span>Create Document</span>
            </button>
          </div>
        </header>
        <main>
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {
                documentData.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={handleOpenDocument}
                    className="cursor-pointer p-4 border rounded-lg shadow-sm hover:shadow-lg hover:border-indigo-900 transition duration-150 ease-in-out border-white/5 bg-white/5 p-1 text-sm/6 text-white"
                  >
                    <div className="bg-gray-700 h-40 flex items-center justify-center rounded-t-lg">
                      <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                    </div>

                    <div className="mt-3">
                      <Menu as="div" className="relative">
                        <p className="text-sm font-semibold truncate">{doc.title}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-400">Updated {dateFormatter(doc.updated_at)}</p>
                          <MenuButton onClick={(e) => { e.stopPropagation(); }} className="inline-flex items-center gap-2 rounded-full text-sm/6 font-semibold text-white shadow-inner shadow-black/10 focus:not-data-focus:outline-none data-focus:outline data-focus:outline-white data-hover:bg-gray-600 data-open:bg-gray-500">
                            <EllipsisVerticalIcon className="h-5 w-5" />
                          </MenuButton>

                          <MenuItems anchor="bottom end" className="[--anchor-gap:20px] w-43 origin-top rounded-xl border border-white/5 bg-gray-900 p-1 text-sm/6 text-white transition duration-100 ease-out focus:outline-none data-closed:scale-95 data-closed:opacity-0"
                          >
                            <MenuItem>
                              <button className="group flex w-full items-center gap-2 rounded-lg px-3 py-1.5 data-focus:bg-white/10">
                                <PencilIcon className="size-4 fill-white/30" />
                                Rename
                              </button>
                            </MenuItem>
                            <MenuItem>
                              <button
                                onClick={(e) => handleDocumentDelete(e, doc.id)}
                                className="group flex w-full items-center gap-2 rounded-lg px-3 py-1.5 data-focus:bg-white/10 data-focus:text-red"
                              >

                                <TrashIcon className="size-4 fill-white/30" />
                                Delete
                              </button>
                            </MenuItem>
                          </MenuItems>
                        </div>
                      </Menu>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </main>

        <CreateDocumentModal open={openCreate} setOpen={setOpenCreate} />
      </div>
    </>
  );
}

export default Home;
