import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "/src/lib/supabaseClient";

const CreateProfile= () => {
  const [profileExist, setProfileExist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [name, setName] = useState(null);
//   const [email, setEmail] = useState("");
//   const [validEmail, setValidEmail] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [bio, setBio] = useState(null);

  const [err, setErr] = useState("");
  const navigate = useNavigate();

  //get current user ID
  const getUserId = () => supabase.auth.getUser().then(res => res.data.user?.id);

  //check if profile exists
  const checkProfile = async () => {
    const userId = await getUserId();
    if (!userId) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    setProfileExist(!!data);
  };

  //create profile
  const handleCreateProfile = async () => {
    if (!username) {
      setErr("Username is required");
      return;
    }

    setLoading(true);

    const userId = await getUserId();
    if (!userId) {
      setErr("User not found");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .insert({ id: userId, username: username, name: name, bio:bio, phone_number: phoneNumber});

    setLoading(false);

    if (error) {
      if (error.code === "23505") {
        setErr("Username already taken");
      } else {
        setErr(error.message);
      }
      return;
    }

    setProfileExist(true);
  };

  const handleLogout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);
    if (error) return setErr(error.message);
    navigate("/login");
  };

useEffect(() => {
  checkProfile();

  if (profileExist) {
    navigate("/homepage");
  }
}, [profileExist, navigate]);

//   if ([page is loading] === null) {
//     return <div>Loading...</div>;
//   }

  return (
    <div>
      <div>
          <h1>Create your profile</h1>

          <div>
            Required: 
            {err && <p style={{ color: "red" }}>{err}</p>}
            <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            
            />
            
         </div>

        <div>
            Optional:

            <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />

            <input
                type="text"
                placeholder="Phone Number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
            />

            <input
                type="text"
                placeholder="Bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <button onClick={handleCreateProfile} disabled={loading}>
            {loading ? "Loading..." : "Save"}
          </button>
          <button onClick={handleLogout} disabled={loading}>
            {loading ? "Loading..." : "Logout"}
          </button>
        </div>
      
    </div>
  );
};

export default CreateProfile;
