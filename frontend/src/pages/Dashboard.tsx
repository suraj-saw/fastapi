import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

interface User {
    id: number;
    username: string;
    email: string;
}

// How often (ms) we re-validate the session with the server.
// A short interval makes session-kick visible quickly without a user action.
const SESSION_POLL_INTERVAL_MS = 5_000;

function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [sessionStatus, setSessionStatus] = useState<"checking" | "active" | "kicked">(
        "checking"
    );
    // Keep a stable ref so the cleanup in useEffect can always clear the latest timer.
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchMe = async () => {
        try {
            const response = await API.get<User>("/auth/me");
            setUser(response.data);
            setSessionStatus("active");
        } catch {
            // The axios interceptor already attempted a token refresh and failed,
            // meaning the session was invalidated server-side.
            setSessionStatus("kicked");
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        }
    };

    useEffect(() => {
        fetchMe();
        intervalRef.current = setInterval(fetchMe, SESSION_POLL_INTERVAL_MS);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    const logout = async () => {
        const refreshToken = sessionStorage.getItem("refresh_token");
        if (refreshToken) {
            try {
                await API.post("/auth/logout", { refresh_token: refreshToken });
            } catch {
                // Clear locally even if the API call fails.
            }
        }
        sessionStorage.clear();
        navigate("/login");
    };

    if (sessionStatus === "kicked") {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
                        <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Session terminated</h2>
                    <p className="text-sm text-gray-500 mb-6">
                        Your account was signed in from another location.
                    </p>
                    <button
                        onClick={() => navigate("/login")}
                        className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold
                                   text-white hover:bg-indigo-700 transition focus:outline-none
                                   focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Back to login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <button
                        onClick={logout}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium
                                   text-gray-700 hover:bg-gray-50 transition focus:outline-none
                                   focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Log out
                    </button>
                </div>

                {sessionStatus === "checking" && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10"
                                stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor"
                                d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Verifying session…
                    </div>
                )}

                {sessionStatus === "active" && user && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-green-700
                                        bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M5 13l4 4L19 7" />
                            </svg>
                            Session active
                        </div>

                        <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
                            <div className="px-4 py-3">
                                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                                    Username
                                </p>
                                <p className="text-sm font-medium text-gray-900">{user.username}</p>
                            </div>
                            <div className="px-4 py-3">
                                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                                    Email
                                </p>
                                <p className="text-sm font-medium text-gray-900">{user.email}</p>
                            </div>
                            <div className="px-4 py-3">
                                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                                    User ID
                                </p>
                                <p className="text-sm font-medium text-gray-900">#{user.id}</p>
                            </div>
                        </div>

                        <p className="text-xs text-gray-400">
                            Session verified every {SESSION_POLL_INTERVAL_MS / 1000}s.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Dashboard;
