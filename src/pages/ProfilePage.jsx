import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "/src/lib/supabaseClient";
import "./HomePage.css"
import Nav from 'react-bootstrap/Nav';
import leafLogo from "../assets/leaf-logo.png"

const ProfilePage = () => {
    
        const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    
    useEffect(() => {
        const fetchUser = async () => {
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (!authUser) {
            navigate("/login");
            return;
        }

        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", authUser.id)
            .single();

        if (error) console.log(error);
        else setUser(data);
        };

        fetchUser();
    }, []);

    const handleLogout = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signOut();
        setLoading(false);
        if (error) return setErr(error.message);
        navigate("/login");
    };

  return (
    <div className="outer">

      <div className="header">
          <img className="leaf-logo" src={leafLogo} alt="Logo" />
          <h1>The Environmental Post</h1>
      </div>

      <div className="main-container">
        <Nav className="navbar">
          <Nav.Link href="/homepage">Feed</Nav.Link>
          <Nav.Link href="/addpost">Add Post</Nav.Link>
          <Nav.Link href="/profilepage">Profile</Nav.Link>
          <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
        </Nav>

        <div className="page-content">
            <p>Username: </p>

            {/* if name, if number(ask if they wanna display or not in creating profile), if bio */}
            <p>name: num: bio: </p>

            {/* this is where my posts, my likes, and my reposts will be */}
            <div className="activity">


            </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;