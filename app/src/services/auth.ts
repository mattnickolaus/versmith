// Authentication requests

export interface CreateUserRequestData {
  email: string;
  password: string;
}

export interface CreateUserResponseData {
  id: string;
  created_at: string;
  updated_at: string;
  email: string;
  access_token: string;
}

export async function createUser(data: CreateUserRequestData): Promise<CreateUserResponseData> {
  const url = '/api/users';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data),
  } as RequestInit);

  if (!response.ok) {
    throw new Error(`${response.status}`);
  }

  const responseData: CreateUserResponseData = await response.json();
  return responseData;
}

export interface LoginRequestData {
  email: string;
  password: string;
}

export interface LoginResponseData {
  id: string;
  created_at: string;
  updated_at: string;
  email: string;
  access_token: string;
}

export async function loginUser(data: LoginRequestData): Promise<LoginResponseData> {
  const url = '/api/login';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data),
  } as RequestInit);

  if (!response.ok) {
    throw new Error(`${response.status}`);
  }

  const responseData: LoginResponseData = await response.json();
  return responseData;
}


export interface RefreshResponse {
  access_token: string;
}

export async function refreshAccessToken(): Promise<RefreshResponse> {
  const url = 'api/refresh';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'applciation/json',
    },
  } as RequestInit);

  if (!response.ok) {
    throw new Error(`${response.status}`);
  }

  const responseData: RefreshResponse = await response.json();
  console.log(`Refresh Response: ${responseData.access_token}`);
  console.log(responseData);
  return responseData;
}

export async function revokeRefreshToken(): Promise<void> {
  const url = 'api/revoke';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'applciation/json',
    },
  } as RequestInit)

  if (response.status !== 204) {
    throw new Error(`Refresh token revoke failed, HTTP error status: ${response.status}`);
  }
}
