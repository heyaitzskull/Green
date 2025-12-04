import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "/src/lib/supabaseClient";
import "./CreateProfile.css"
import goldfish from "../assets/goldfish.jpg"
import { v4 as uuidv4 } from 'uuid';

const CreateProfile = () => {
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [profileExist, setProfileExist] = useState();

  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [bio, setBio] = useState("");
  const [numberChecked, setNumberChecked] = useState(false);
  const [profilePic, setProfilePic] = useState(goldfish);
  const [profilePicFile, setProfilePicFile] = useState(null);

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
      navigate("/homepage", { replace: true });
      return;
    }

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

    // Upload profile picture if one was selected
    let publicUrl = null; // Changed variable name

    if (profilePicFile) {
      const filePath = `${userId}/${uuidv4()}-${profilePicFile.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('profile-images')
        .upload(filePath, profilePicFile);
      
      if (uploadError) {
        console.error("Upload Error:", uploadError);
        setErr("Image upload failed: " + uploadError.message);
        setLoading(false);
        return;
      }

      //getting the public URL for the newly uploaded file
      const { data: { publicUrl: imageUrl } } = supabase
        .storage
        .from('profile-images')
        .getPublicUrl(uploadData.path); 
      
      publicUrl = imageUrl
    }

    // Insert profile data
    const { error } = await supabase.from("profiles").insert({
      id: userId,
      username,
      name,
      bio,
      phone_number: phoneNumber,
      display_number: numberChecked ? 1 : 0,
      profile_pic_path: publicUrl, // This will be null if no image was uploaded
    });

    setLoading(false);

    if (error) {
      console.error("Profile Insert Error:", error);
      if (error.code === "23505") {
        setErr("That username is already taken. Please choose another.");
      } else {
        setErr("Something went wrong: " + error.message);
      }
      return;
    }

    navigate("/homepage");
  };

  const previewProfilePic = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(URL.createObjectURL(file));
      setProfilePicFile(file);
    }
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
    <div className='container'>
      <h1 className="title">First, let's create your profile</h1>
      <div className="inputs">
        
        <wrapper className="create-wrapper">
          <div className="create-box">
            <img src={profilePic} style={{width: "150px", height: "150px", borderRadius: "15px", border:"2px solid rgb(66, 66, 66)", boxShadow: "0 0 1px 1px rgb(255, 255, 255)", objectFit:"cover", display: "block"}}/>
          </div>
        </wrapper>
      
        <br/>
        <input type="file" accept="image/*" onChange={previewProfilePic}/>

        <svg width="0" height="0">
            <clipPath id="svgClip" clipPathUnits="objectBoundingBox">
                <path d="M.067.067C.1676 0 .8379 0 .9385.067C1.0055.1676 1.0055.8379.9385.9385C.8379 1.0055.1676 1.0055.067.9385C0 .8379 0 .1676.067.067"></path>
            </clipPath>
        </svg>

        <br/>
        <br/>

        {err && <p className="errorMsg">{err}</p>}
        
        <div className="input-container" style={{ display: "flex", flexDirection: "column" }}>
          <p>Username</p>
          <input
            className="create-text"
            type="text"
            id="text30"
            placeholder="Start typing..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="input-container" style={{ display: "flex", flexDirection: "column"}}>
          <p>Name</p>
          <input
            className="create-text"
            type="text"
            placeholder="Start typing..."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="input-container" style={{ display: "flex", flexDirection: "column" }}>
          <p>Phone Number</p>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <input
              className="create-text"
              type="text"
              placeholder="(123) 456-789"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <input 
              type="checkbox" 
              id="example1"
              checked={numberChecked}
              onChange={(e) => setNumberChecked(e.target.checked)}
            />
            <label style={{marginTop:"2px"}} htmlFor="example1">Show on Profile</label>
          </div>
        </div>

        <div className="input-container" style={{ display: "flex", flexDirection: "column" }}>
          <p>Bio</p>
          <textarea
            className="bio-text"
            placeholder="Start typing..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
          />
        </div>

        <br/>
       
        <div>
          <button className="default save" onClick={handleCreateProfile} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
          <button className="default logout" onClick={handleLogout} disabled={loading}>
            {loading ? "Loading..." : "Logout"}
          </button>
        </div>
        <br/>
      </div>
    </div>
  );
};

export default CreateProfile;