import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "/src/lib/supabaseClient";
import "./CreateProfile.css"
import leafLogo from "../assets/leaf-logo.png"

const CreateProfile = () => {
  const [profileExist, setProfileExist] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [bio, setBio] = useState("");

  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const getUserId = () =>
    supabase.auth.getUser().then((res) => res.data.user?.id);

  const checkProfile = async () => {
    const userId = await getUserId();
    if (!userId) {
      setPageLoading(false);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      //profile exists, now redirect immediately without rendering
      navigate("/homepage", { replace: true });
      return;
    }

    //no profile, render the form
    setProfileExist(false);
    setPageLoading(false);
  };

  useEffect(() => {
    checkProfile();
  }, []);

  const handleCreateProfile = async () => {
    if (!username) {
      setErr("Username is required");
      return;
    }

    if (/\s/.test(username)) {
      setErr("Username cannot contain spaces");
      return;
    }

    setLoading(true);

    const userId = await getUserId();
    if (!userId) {
      setErr("User not found");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("profiles").insert({
      id: userId,
      username,
      name,
      bio,
      phone_number: phoneNumber,
    });

    setLoading(false);

    if (error) {
      if (error.code === "23505") {
        setErr("That username is already taken. Please choose another.");
      } else {
        setErr("Something went wrong. Please try again.");
      }
      return;
    }

    navigate("/homepage");
  };

  const handleLogout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);
    if (error) return setErr(error.message);
    navigate("/login");
  };

  if (pageLoading) {
    return <h2>Loading...</h2>;
  }

  return (
    <div className="outer">

      {/* <div className="header">
          <img className="leaf-logo" src={leafLogo} alt="Logo" />
          <h1>The Environmental Post</h1>
      </div> */}
    <div class='container' >
      <h1 class="title">First, let's create your profile</h1>
      <div class="inputs" style={{ backgroundColor:"rgba(219, 238, 255, 0.6)"}}>
        {err && <p style={{ color: "red"}}>{err}</p>}

      <div className="input-container">
        <div style={{ display: "flex", flexDirection: "row" }}>
          <p style={{ color: "red"}} > *</p>
          <p> Username:</p>
        </div>
        <input
          className="text"
          type="text"
          placeholder="Start typing..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>

      <div className="input-container">
        <p>Name</p>
        <input
          className="text"
          type="text"
          placeholder="Start typing..."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="input-container">
        <p>Phone Number</p>
        <input
          className="text"
          type="text"
          placeholder="(123) 456-789"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />
      </div>

      <div className="input-container">
        <p>Bio</p>
        <input
          className="text"
          type="text"
          placeholder="Start typing..."
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </div>

        <br/>
        <br/>
      <div>
        <button className="default"onClick={handleCreateProfile} disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </button>
        <button className="default" onClick={handleLogout} disabled={loading}>
          {loading ? "Loading..." : "Logout"}
        </button>
        </div>
      </div>
    </div>
    </div>
  );
};

export default CreateProfile;