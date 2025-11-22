import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "/src/lib/supabaseClient.js";
// import "./Login.css";
import leafLogo from "../assets/leaf-logo.png"
import flower from "../assets/orange_flower.png"

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
    <div className="main-container">
            
            <wrapper className="login-wrapper">
            <div class="login-box">
              {/* <div class="box2"> */}
                <img src={flower} style={{width: "180px", height: "180px", borderRadius: "15px", border:"2px solid rgb(66, 66, 66)", boxShadow: "0 0 1px 1px rgb(255, 255, 255)", objectFit:"cover", display: "block"}}/>
              {/* </div> */}
            </div>
          </wrapper>

          <svg width="0" height="0">
              <clipPath id="svgClip" clipPathUnits="objectBoundingBox">
                  <path d="M.067.067C.1676 0 .8379 0 .9385.067C1.0055.1676 1.0055.8379.9385.9385C.8379 1.0055.1676 1.0055.067.9385C0 .8379 0 .1676.067.067"></path>
              </clipPath>
          </svg>
            
            <h2 style={{fontSize:"20px", marginTop:"20px", marginBottom:"15px"}}>Login</h2>
            {err && <p className="signup-err">{err}</p>}
            {!loadingSignup && user && <p className='confirm-email'>Please confirm your email in order to log in</p>}


          <div class="flex flex-col gap-3">
            <input
              className="email"
              style={{height:"30px", width:"250px", fontSize:"15px"}}
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              className="password"
              style={{height:"30px", width:"250px", marginBottom:"25px", fontSize:"15px"}}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

            <div className="button-group">
            <button className="default" onClick={handleLogin} disabled={loadingLogin}>
                {loadingLogin ? "Loading..." : "Login"}
            </button>
            <button className='default' onClick={handleSignup} disabled={loadingSignup}> 
                    {loadingSignup ? "Loading..." : "Sign Up" }
                </button>
            </div>

            <br/>
            <br/>
            <br/>
            <br/>
            
        
        </div>
    
  );
};

export default Login;
