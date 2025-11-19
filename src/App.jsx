import { useState, useEffect } from "react";
import { useRoutes } from "react-router-dom";
import "./App.css";
import Login from "./pages/Login";
import SignUp from "./pages/Signup";
import CreateProfile from "./pages/CreateProfile";
import ProtectedRoute from "./pages/ProtectedRoute";
import HomePage from "./pages/Homepage";
import AddPost from "./pages/AddPost"
import ProfilePage from "./pages/ProfilePage"
import PostView from "./pages/PostView"
import { supabase } from "./lib/supabaseClient";
import leafLogo from "./assets/leaf-logo.png"

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [authReady, setAuthReady] = useState(false);

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

    
  ]);

  return (
    <div className="main-content">
      {element}
    </div>
  );
}

export default App;