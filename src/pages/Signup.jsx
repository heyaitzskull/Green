import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from "/src/lib/supabaseClient.js";
import './Login.css'

const SignUp = () => {

    const [email, setEmail] = useState("")
    const [password, setPassword] =  useState("")
    const [username, setUsername] =  useState("")
    const [user, setUser] = useState(null)
    const [err, setErr] = useState("")
    const [userExists, setUserExists] = useState(false)
    const [loading, setLoading] =  useState(false)

    //check if email already exists in supabase
    // const checkUser = async () => {
    //     user = supabase.auth.getUser().then(res => res.data.user?.id);

    //     if user.email {
    //         setUserExists(true);
    //     } else{
    //         setUserExists(falsed)
    //     }
    // }

    const handleSignup = async () => {
        setErr("");

        //validate input
        if (!email) return setErr("Email is required.");
        if (!password) return setErr("Password is required.");

        setLoading(true);

        try {

        //check if email already exists via RPC
        const { data: exists, error: rpcError } = await supabase.rpc(
            "is_email_exist",
            { p_email: email }
        );

        if (rpcError) {
            setLoading(false);
            return setErr(rpcError.message);
        }

        if (exists) {
            setLoading(false);
            return setErr("This email is already registered. Please log in.");
        }

        //sign up user with Supabase Auth
        const { data: authData, error: signupError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (signupError) {
            setLoading(false);
            return setErr(signupError.message);
        }

        const newUser = authData.user;


        setUser(newUser);
        setLoading(false);

        } catch (error) {
            setErr("An unexpected error occurred.");
            setLoading(false);
        }
        
    };

    return (
        <div className='main-container'>
            <div className='card'>

                <h2> React Supabase Login</h2>
                {err && <p className='signup-err'>{err}</p>}
                {!loading && user && <p className='confirm-email'>Please confirm your email in order to log in</p>}

                {/* <input 
                    type='text' 
                    placeholder='Username'
                    value={username}
                    onChange={e=>setUsername(e.target.value)}
                /> */}

                <input type='email' 
                    placeholder='Email' 
                    value={email}
                    onChange={e=>setEmail(e.target.value)}
                />

                <input 
                    type='password' 
                    placeholder='Password'
                    value={password}
                    onChange={e=>setPassword(e.target.value)}
                />

                <div className='button-group'>
                <button className='signup' onClick={handleSignup} disabled={loading}> 
                   
                    {loading ? "Loading..." : "Sign Up" }
                </button>

                </div>

                <p> Already have an account? <Link to="/login">Log in</Link></p>
            </div>
        </div>
    )
}

export default SignUp