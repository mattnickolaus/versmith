import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface LoginRequestData {
	email: string;
	password: string;
}

interface LoginResponseData {
	id: string;
	created_at: string;
	updated_at: string;
	email: string;
	access_token: string;
}

async function loginUser(data: LoginRequestData): Promise<LoginResponseData> {
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

function Login() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');

	const { setAccessToken } = useAuth();

	const navigate = useNavigate();

	const handleSubmit = (event) => {
		event.preventDefault();

		const newLogin: LoginRequestData = {
			email: email,
			password: password,
		};
		loginUser(newLogin)
			.then(loggedInUser => {
				console.log('User logged in with email:', loggedInUser.email, loggedInUser.id, loggedInUser.created_at);

				// NOTE: Remove later used for debugging
				console.log(`Access Token: ${loggedInUser.access_token}`)
				setAccessToken(loggedInUser.access_token);
				navigate('/');
			})
			.catch(error => {
				console.log(error);

				// try to add in specific messages based on http status for user errors
				setError('Unable to authenticate account information');
			})

	};

	return (
		<>
			<div className="flex items-center h-screen flex-col justify-center px-6 py-12 lg:px-8">
				<div className="sm:mx-auto sm:w-full sm:max-w-sm">
					<img
						alt="Your Company"
						src="https://static.thenounproject.com/png/17491-200.png"
						className="invert mx-auto h-10 w-auto"
					/>
					<h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-white">Sign in to your account</h2>
				</div>

				<div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
					{error &&
						<div className="flex items-center text-sm wrap-normal bg-red-300 border-red-500 border-1 rounded-md my-5 ">
							<ExclamationCircleIcon className="m-2 size-6 text-red-500 align-middle" />
							<span className="font-semibold text-red-500 align-middle">{error}</span>
						</div>
					}

					<form onSubmit={handleSubmit} className="space-y-6">
						<div>
							<label htmlFor="email" className="block text-sm/6 font-medium text-gray-100">
								Email address
							</label>
							<div className="mt-2">
								<input
									id="email"
									name="email"
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									autoComplete="email"
									className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
								/>
							</div>
						</div>

						<div>
							<div className="flex items-center justify-between">
								<label htmlFor="password" className="block text-sm/6 font-medium text-gray-100">
									Password
								</label>
							</div>
							<div className="mt-2">
								<input
									id="password"
									name="password"
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									autoComplete="current-password"
									className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
								/>
							</div>
							<div className="my-3 text-sm text-right">
								<a href="#" className="font-semibold text-indigo-400 hover:text-indigo-300">
									Forgot password?
								</a>
							</div>
						</div>

						<div>
							<button
								type="submit"
								className="flex w-full justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm/6 font-semibold text-white hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
							>
								Sign in
							</button>
						</div>
					</form>

					<p className="mt-10 text-center text-sm/6 text-gray-400">
						Don't have an account?{' '}
						<Link to="/signup" className="font-semibold text-indigo-400 hover:text-indigo-300">
							Sign Up
						</Link>
					</p>
				</div>
			</div>
		</>
	);
}

export default Login;

