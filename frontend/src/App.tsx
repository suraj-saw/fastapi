import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import API from "./api/axios";

import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

function RootHandler() {
    const navigate = useNavigate();
    
    useEffect(() => {
        const checkAuth = async () => {
            try {
                await API.get("/auth/me");
                navigate("/dashboard");
            } catch (error: any) {
                if (error.response?.status === 401) {
                    navigate("/login");
                } else {
                    // Backend might be restarting (503) or offline, retry faster (250ms)
                    setTimeout(checkAuth, 250);
                }
            }
        };
        checkAuth();
    }, [navigate]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="animate-spin h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Loading...
            </div>
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<RootHandler />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;