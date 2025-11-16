import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "/src/lib/supabaseClient";

const HomePage = () => {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [username, setUsername] = useState(""); //store username directly
  const navigate = useNavigate();

  //Get current user profile
  const getUser = async () => {

    //getting user info from auth
    const { data: userData, error } = await supabase.auth.getUser();
    if (error) {
      setErr(error.message);
      return;
    }

    //storing auth user's id
    const userId = userData.user.id;

    //getting the matching user from profiles table
    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .single();

    if (profileError) {
      setErr(profileError.message);
      return;
    }

    setUsername(data.username);
  };

  const handleLogout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);
    if (error) return setErr(error.message);
    navigate("/login");
  };

  useEffect(() => {
    getUser();
  }, []);

  return (
    <div>
      <h1>Ayyyy {username}, you made it!</h1>
      {err && <p style={{ color: "red" }}>{err}</p>}
      <button onClick={handleLogout} disabled={loading}>
        {loading ? "Loading..." : "Logout"}
      </button>
    </div>
  );
};

export default HomePage;
