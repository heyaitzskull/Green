import { useState, useEffect } from "react";
import { useRoutes } from "react-router-dom";
import "./App.css";
import Login from "./pages/Login";
import SignUp from "./pages/Signup";
import CreateProfile from "./pages/CreateProfile";
import ProtectedRoute from "./pages/ProtectedRoute";
import HomePage from "./pages/Homepage";
import { supabase } from "./lib/supabaseClient";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(null); // null = not checked yet

  // Check session on app load
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show nothing (or spinner) while checking session
  if (isLoggedIn === null) {
    return <div>Loading...</div>;
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
      path: "/signup",
      element: <SignUp />,
    },
  ]);

  return <div className="content">{element}</div>;
}

export default App;
