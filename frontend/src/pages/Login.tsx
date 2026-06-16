import { useState, type ChangeEvent, type FormEvent } from "react";

import { Link, useNavigate } from "react-router-dom";

import API from "../api/axios";

interface LoginForm {
  username: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
}

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState<LoginForm>({
    username: "",
    password: "",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,

      [e.target.name]: e.target.value,
    });
  };

  const loginUser = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const response = await API.post<LoginResponse>(
        "/auth/login",

        form,
      );

      localStorage.setItem("token", response.data.access_token);

      // With:
      sessionStorage.setItem("access_token", response.data.access_token);
      sessionStorage.setItem("refresh_token", response.data.refresh_token);

      navigate("/dashboard");
    } catch (error) {
      alert("Invalid username or password");
    }
  };

  return (
    <div className="container">
      <h2>Login</h2>

      <form onSubmit={loginUser}>
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
        />

        <button type="submit">Login</button>
      </form>

      <p>
        New User?
        <Link to="/">Signup</Link>
      </p>
    </div>
  );
}

export default Login;
