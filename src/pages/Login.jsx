import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "/src/lib/supabaseClient.js";
import "./Login.css";

const Login = ({ setIsLoggedIn }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

   //if user is already logged in, redirect to homepage
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsLoggedIn(true);
        navigate("/");
      }
    };
    checkSession();
  }, [navigate, setIsLoggedIn]);


  const handleLogin = async () => {
    setErr("");
    if (!email) return setErr("Email is required.");
    if (!password) return setErr("Password is required.");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) return setErr(error.message);

    // Mark user as logged in
    setIsLoggedIn(true);

    // Redirect to homepage
    navigate("/");
  };

  return (
    <div className="main-container">
      <div className="card">
        <h2>React Supabase Login</h2>
        {err && <p className="signup-err">{err}</p>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="button-group">
          <button className="login" onClick={handleLogin} disabled={loading}>
            {loading ? "Loading..." : "Login"}
          </button>
        </div>

        <p>
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
