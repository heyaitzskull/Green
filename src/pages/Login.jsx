import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "/src/lib/supabaseClient.js";
import "./Login.css";
import leafLogo from "../assets/leaf-logo.png"

const Login = ({ setIsLoggedIn }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loadingSignup, setLoadingSignup] = useState(false);
  const [user, setUser] = useState(null)
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

  
    const handleSignup = async () => {
        setErr("");

        //validate input
        if (!email) return setErr("Email is required.");
        if (!password) return setErr("Password is required.");

        setLoadingSignup(true);

        try {

        //check if email already exists via RPC
        const { data: exists, error: rpcError } = await supabase.rpc(
            "is_email_exist",
            { p_email: email }
        );

        if (rpcError) {
            setLoadingSignup(false);
            return setErr(rpcError.message);
        }

        if (exists) {
            setLoadingSignup(false);
            return setErr("This email is already registered. Please log in.");
        }

        //sign up user with Supabase Auth
        const { data: authData, error: signupError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (signupError) {
            setLoadingSignup(false);
            return setErr(signupError.message);
        }

        const newUser = authData.user;


        setUser(newUser);
        setLoadingSignup(false);

        } catch (error) {
            setErr("An unexpected error occurred.");
            setLoadingSignup(false);
        }
        
    };


  const handleLogin = async () => {
    setErr("");
    if (!email) return setErr("Email is required.");
    if (!password) return setErr("Password is required.");
    setLoadingLogin(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoadingLogin(false);

    if (error) return setErr(error.message);

    // Mark user as logged in
    setIsLoggedIn(true);

    // Redirect to homepage
    navigate("/");
  };

  return (
    <div className="outer">

        {/* <div className="header">
            <img className="leaf-logo" src={leafLogo} alt="Logo" />
            <h1>The Environmental Post</h1>
        </div> */}
        <br/>
        <br/>
        <br/>
        <br/>


        <div className="main-container" >
            
        <div className="card" style={{ backgroundColor:"rgba(219, 238, 255, 0.6)"}}>
            <h2>Login</h2>
            {err && <p className="signup-err">{err}</p>}
            {!loadingSignup && user && <p className='confirm-email'>Please confirm your email in order to log in</p>}


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
            <button className="default" onClick={handleLogin} disabled={loadingLogin}>
                {loadingLogin ? "Loading..." : "Login"}
            </button>
            <button className='default' onClick={handleSignup} disabled={loadingSignup}> 
                    {loadingSignup ? "Loading..." : "Sign Up" }
                </button>
            </div>


        </div>
        </div>
    </div>
  );
};

export default Login;
