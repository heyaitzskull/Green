import { useState, useEffect } from "react";
import { useRoutes, useNavigate } from "react-router-dom";
import "./App.css";
import Login from "./pages/Login";
import CreateProfile from "./pages/CreateProfile";
import ProtectedRoute from "./pages/ProtectedRoute";
import HomePage from "./pages/HomePage";
import AddPost from "./pages/AddPost"
import ProfilePage from "./pages/ProfilePage"
import PostView from "./pages/PostView"
import EditProfile from "./pages/EditProfile"
import Map from "./pages/Map"
import { supabase } from "./lib/supabaseClient";
import { Link } from "react-router-dom";
import leafLogo from "./assets/leaf-logo.png"

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  //call useRoutes BEFORE any conditional returns
  const element = useRoutes([
    {
      path: "/login",
      element: <Login setIsLoggedIn={setIsLoggedIn} />,
    },
    {
      path: "/homepage",
      element: <HomePage />,
    },
    {
      path: "/createProfile",
      element: <CreateProfile />,
    },
    {
      path: "/",
      element: (
        <ProtectedRoute isLoggedIn={isLoggedIn}>
          <CreateProfile />
        </ProtectedRoute>
      ),
    },
    {
      path: "/addpost",
      element: <AddPost />,
    },
    {
      path: "/profilepage",
      element: <ProfilePage />,
    },
    {
      path: "/postview/:postId",
      element: <PostView />,
    },
    {
      path: "/profilepage/editprofile/:userName",
      element: <EditProfile />,
    },
    {
      path: "/addpost/map",
      element: <Map />,
    }
  ]);

  const fetchProfile = async (currentUser) => {
    if (!currentUser) return;

    const {data, error} = await supabase
      .from("profiles")
      .select("*")
      .eq('id', currentUser.id)
      .single();
    
    if (error) {
      console.log("Error fetching profile:", error);
      return;
    }

    setProfile(data);
  }

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
      setUser(session?.user || null);
      setAuthReady(true);
      
      if (session?.user) {
        fetchProfile(session.user);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      setUser(session?.user || null);
      
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUser(null);
    setProfile(null);
    navigate("/login");
  };

  //check for loading AFTER all hooks have been called
  if (isLoggedIn === null || !authReady) {
    return <h2 style={{display:'flex', justifyContent:'center', textAlign:'center'}}>Loading...</h2>;
  }

  return (
    <div className="main" style={{display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", height:"100%"}}>
      <div className="window glass active window-responsive" style={{minHeight:"550px"}}>
        <div className="title-bar" style={{height: "37px"}}>
          <div className="title-bar-text" style={{fontSize: "20px", marginLeft:"5px", display:"flex", flexDirection:"row", gap:"10px"}}> 
            <img className="leaf-logo" src={leafLogo} alt="Logo" />
            The Environmental Post
          </div>
          <div className="title-bar-controls">
            <button aria-label="Minimize"></button>
            <button aria-label="Maximize"></button>
            <button aria-label="Close"></button>
          </div>
        </div>
        
        <section className="tabs">
          <menu role="tablist" aria-label="Tabs Template">
            <button role="tab" aria-controls="tab-A"><Link to="/homepage">Feed</Link></button>
            <button role="tab" aria-controls="tab-B"><Link to="/addpost">Add Post</Link></button>
            <button role="tab" aria-controls="tab-C"><Link to='/profilepage'>Profile</Link></button>
            <button role="tab" aria-controls="tab-D" onClick={handleLogout}><Link to="/login">Logout</Link></button>
          </menu>
        </section>

        <div className="window-body has-space">
          <article role="tabpanel" id="tab-A" style={{minHeight:"550px"}}>{element}</article>
          <article role="tabpanel" id="tab-B" hidden style={{minHeight:"550px"}}>{element}</article>
          <article role="tabpanel" id="tab-C" hidden style={{minHeight:"550px"}}>{element}</article>
          <article role="tabpanel" id="tab-D" hidden style={{minHeight:"550px"}}>{element}</article>
        </div>
      </div>
    </div>
  );
}

export default App;