import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [error, setError] = useState('');
    const [passwordMismatch, setPasswordMismatch] = useState(false);

    const handleSubmit = (event) => {
	event.preventDefault();
	if (password !== confirmPassword) {
	    setPasswordMismatch(true);
	    setError('Password does not match');
	    return;
	}
	setError('');
	setPasswordMismatch(false);

	// TODO: login logic (connect to backend)
	console.log('Login submitted:', { email, password });
    };

    return (
    <>
	<div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
	    <div className="sm:mx-auto sm:w-full sm:max-w-sm">
	      <img
		alt="Versmith Logo"
		src="https://static.thenounproject.com/png/17491-200.png"
		className="invert mx-auto h-10 w-auto"
	      />
	      <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-white">Create Your Account</h2>
	    </div>

	    <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
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
		    <div className="text-sm">
		    {error && <p className="font-semibold text-red-500">{error}</p>}
		    </div>
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
		      className={`block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6 ${passwordMismatch ? 'border-red-500 focus:outline-red-500' : ' '}`}
		    />
		  </div>
		</div>

		<div>
		  <div className="flex items-center justify-between">
		    <label htmlFor="password" className="block text-sm/6 font-medium text-gray-100">
		      Confrim Password
		    </label>
		  </div>
		  <div className="mt-2">
		    <input
		      id="ConfirmPassword"
		      name="ConfirmPassword"
		      type="password"
		      value={confirmPassword}
		      onChange={(e) => setConfirmPassword(e.target.value)}
		      required
		      autoComplete="current-password"
		      className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
		    />
		  </div>
		</div>

		<div>
		  <button
		    type="submit"
		    className="flex w-full justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm/6 font-semibold text-white hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
		  >
		   Create Account 
		  </button>
		</div>
	      </form>

	      <p className="mt-10 text-center text-sm/6 text-gray-400">
		Already have an account?{' '}
		<Link to="/login" className="font-semibold text-indigo-400 hover:text-indigo-300">
		    Sign In
		</Link>
	      </p>
	    </div>
	  </div>
      </>
    );
}

export default SignUp;
