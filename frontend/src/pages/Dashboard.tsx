import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

interface User {
  id: number;
  username: string;
  email: string;
}

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [sessionStatus, setSessionStatus] = useState<
    "checking" | "active" | "kicked"
  >("checking");

  useEffect(() => {
    fetchMe();

    // Poll /auth/me every 5 seconds so the session kick
    // is visible quickly without waiting for a user action
    const interval = setInterval(fetchMe, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchMe = async () => {
    try {
      const response = await API.get<User>("/auth/me");
      setUser(response.data);
      setSessionStatus("active");
    } catch {
      // axios interceptor already tried to refresh and failed
      // meaning the session was invalidated — we just reflect that
      setSessionStatus("kicked");
    }
  };

  const logout = async (): Promise<void> => {
    const refreshToken = sessionStorage.getItem("refresh_token");
    if (refreshToken) {
      try {
        await API.post("/auth/logout", { refresh_token: refreshToken });
      } catch {
        // clear locally even if API fails
      }
    }
    sessionStorage.clear();
    navigate("/login");
  };

  if (sessionStatus === "kicked") {
    return (
      <div className="container">
        <h2 style={{ color: "#dc2626" }}>Session Terminated</h2>
        <p>Your account was logged in from another location.</p>
        <button onClick={() => navigate("/login")}>Back to Login</button>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Dashboard</h1>

      {sessionStatus === "checking" && (
        <p style={{ color: "#6b7280" }}>Verifying session...</p>
      )}

      {sessionStatus === "active" && user && (
        <div>
          <p style={{ color: "#16a34a", fontWeight: "bold" }}>
            ✓ Session Active
          </p>
          <p>
            Welcome, <strong>{user.username}</strong>
          </p>
          <p style={{ color: "#6b7280", fontSize: "14px" }}>
            ID: {user.id} &nbsp;|&nbsp; Email: {user.email}
          </p>
          <p style={{ color: "#6b7280", fontSize: "12px" }}>
            Session check runs every 5 seconds.
          </p>
        </div>
      )}

      <button onClick={logout} style={{ marginTop: "16px" }}>
        Logout
      </button>
    </div>
  );
}

export default Dashboard;
