import { useState, useEffect } from "react";
import { useRoutes } from "react-router-dom";
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

  const fetchProfile  = async () => {
    if (!user) return;

    const {data, error} = await supabase
      .from("profiles")
      .select("*")
      .eq('id', user.id)
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
      setAuthReady(true);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [isLoggedIn]);

  const handleLogout = async () => {
    // setLoading(true);
    // const { error } = await supabase.auth.signOut();
    // setLoading(false);
    // if (error) return setErr(error.message);
    // navigate("/login");
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    navigate("/login");
  };

  if (isLoggedIn === null) {
    return <h2 style={{display:'flex', justifyContent:'center', textAlign:'center'}}>Loading...</h2>;

  }

  if (!authReady) {
    return <h2 style={{display:'flex', justifyContent:'center', textAlign:'center'}}>Loading...</h2>;
  }
  
  

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

  return (
    // <div className="main-content">
    //   {element}
    //   {/* test */}
    // </div>

    //THIS WORKS!!!

    <div className="main"style={{display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", height:"100%"}}>
    {/* <div className="main"> */}
    <div className="window glass active window-responsive" style={{minHeight:"550px"}}>
    <div className="title-bar" style={{height: "37px"}}>
      <div className="title-bar-text" style={{fontSize: "20px", marginLeft:"5px", display:"flex", flexDirection:"row", gap:"10px"}}> 
        <img className="leaf-logo" src={leafLogo} alt="Logo" />
        The Environmental Post
      </div>
      <div className="title-bar-controls">
        <button aria-label="Minimize" ></button>
        <button aria-label="Maximize"></button>
        <button aria-label="Close"></button>
      </div>
    </div>
    
    <section className="tabs">
      <menu role="tablist" aria-label="Tabs Template">
        {/* aria-selected="true" */}
        <button role="tab" aria-controls="tab-A" ><Link to="/homepage">Feed</Link></button>
        <button role="tab" aria-controls="tab-B"><Link to="/addpost">Add Post</Link></button>
        <button role="tab" aria-controls="tab-C"><Link to='/profilepage'>Profile</Link></button>
        <button role="tab" aria-controls="tab-D" onClick={handleLogout}><Link to="/login">Logout</Link></button>
      </menu>
      
    </section>

    <div className="window-body has-space">
      {/* <p>There's so much room for activities!There's so much room for activities!There's so much room for activities!There's so much room for activities!</p> */}
      
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