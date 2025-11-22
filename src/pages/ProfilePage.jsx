import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "/src/lib/supabaseClient";
import Nav from 'react-bootstrap/Nav';
import Card from 'react-bootstrap/Card';
import leafLogo from "../assets/leaf-logo.png"
import { Link } from "react-router-dom";
import "./ProfilePage.css"; // Import ProfilePage specific CSS


const ProfilePage = () => {
    
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('Posts');
  const tabItems = ['Posts', 'Goings', 'Leafs'];
  const navigate = useNavigate();

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
        

    if (error) {
      console.log(error);
    } else {
      setUser(data);
    }
  };

  //fetch user's posts
  const fetchUserPosts = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("posts")
      .select(`
        *,
        lgr_stats (
          id,
          leafs,
          goings,
          recycles
        )
      `)
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.log("Error fetching posts:", error);
      return;
    }
    setPosts(data);
  };

  const previewProfilePic = () => {

  }

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserPosts();
    }
  }, [user]);

  const handleLogout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);
    if (error) return setErr(error.message);
    navigate("/login");
  };

  if (!user) {
    return <h2 style={{display:'flex', justifyContent:'center', textAlign:'center'}}>Loading...</h2>;

  }

  return (
    <div className="profile-outer">
      <div className="profile-page-content">
        <div className="profile-info">

          
          <wrapper className="profile-wrapper">
            <div className="profile-box">
              <img src={user?.profile_pic_path} style={{width: "150px", height: "150px", borderRadius: "15px", border:"2px solid rgb(66, 66, 66)", boxShadow: "0 0 1px 1px rgb(255, 255, 255)", objectFit:"cover", display: "block"}}/>
            </div>
          </wrapper>
        
          <br/>
          
          <svg width="0" height="0">
              <clipPath id="svgClip" clipPathUnits="objectBoundingBox">
                  <path d="M.067.067C.1676 0 .8379 0 .9385.067C1.0055.1676 1.0055.8379.9385.9385C.8379 1.0055.1676 1.0055.067.9385C0 .8379 0 .1676.067.067"></path>
              </clipPath>
          </svg>
         
          <div style={{width:'100vh'}}>

            {/* this will only appear here if profile user is logged in */}
            <div style={{textAlign:"right"}}>
              <button>Edit</button>
            </div>
            <h1>@{user?.username}</h1>
            
            {user?.name && <p><strong>Name:</strong> {user.name}</p>}
            {user?.phone_number && user?.display_number === 1 && <p><strong>Phone:</strong> {user.phone_number}</p>}
            {user?.bio && <p><strong>Bio:</strong> {user.bio}</p>}

            add interests array of interest
            

          </div>

        </div>

        <div className="activity-tabs">
          {tabItems.map(tab => (
            <button
              key={tab}
              className={`activity-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="activity-content">
          {activeTab === 'Posts' && (
            posts.length === 0 ? (
              <p>No posts yet...</p>
            ) : (
              posts.map((post) => {
                const stats = post.lgr_stats?.[0] || { leafs: 0, goings: 0, recycles: 0 };
                
                return (
                  
                
                  <Link to={`/postview/${post.id}`} className="card-link">
                  <Card key={post.id} className="profile-card">
                                        
                      <Card.Title style={{marginTop:"10px"}}><strong>{post.title}</strong></Card.Title>
                      {/* <p><strong>Location:</strong> {post.location}</p> */}
                      {/* <p><strong>Scale:</strong> {post.scale}</p> */}

                      
                      {post.image_url && (
                        <img
                          src={post.image_url}
                          alt="Post"
                          style={{ width: "auto", height:"320px", marginTop: "10px", objectFit: "cover"}}
                        />
                      )}

                      {/* <p style={{ fontSize: '12px', color: '#666' }}>
                        {new Date(post.created_at).toLocaleString()}
                      </p>
                       */}
                    
                  </Card>
                  </Link>
                );
              })
            )
          )}

          {activeTab === 'Goings' && <p>Your goings will appear here...</p>}
          {activeTab === 'Leafs' && <p>Your leafs will appear here...</p>}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;