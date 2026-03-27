// User requests

export interface User {
  id: string;
  created_at: string;
  updated_at: string;
  email: string;
  display_name: string;
}

export async function getUser(accessToken: string | null): Promise<User> {
  if (accessToken === null) {
    throw new Error("Access token was not provided (null), unable to getUser");
  }
  const url = '/api/users';
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

  const responseData: User = await response.json();
  console.log(responseData);
  return responseData;
}

