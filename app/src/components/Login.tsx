import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (event) => {
	event.preventDefault();
	// TODO: login logic (connect to backend)
	console.log('Login submitted:', { email, password });
    };

    return (
	<form onSubmit={handleSubmit}>
	  <h2>Login</h2>
	  <div>
	    <label>Email:</label>
	    <input
	      type="email"
	      value={email}
	      onChange={(e) => setEmail(e.target.value)}
	      required
	    />
	  </div>
	  <div>
	    <label>Password:</label>
	    <input
	      type="password"
	      value={password}
	      onChange={(e) => setPassword(e.target.value)}
	      required
	    />
	  </div>
	  <button type="submit">Log In</button>
	  <p>
	    Don't have an account? <Link to="/signup">Sign Up</Link>
	  </p>
	</form>
    );
}

export default Login;
