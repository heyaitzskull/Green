import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "/src/lib/supabaseClient";
import Card from 'react-bootstrap/Card';
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./ProfilePage.css"; // Import ProfilePage specific CSS


const ProfilePage = () => {
  
  const {user, loading} = useAuth();
  const [profile, setProfile] = useState(null);
  const [err, setErr] = useState("");

  const [posts, setPosts] = useState([]);
  const [goings, setGoings] = useState([]);
  const [goingsLoaded, setGoingsLoaded] = useState(false);
  const [leafs, setLeafs] = useState([]);
  const [leafsLoaded, setLeafsLoaded] = useState(false);
  const [recycles, setRecycles] = useState([]);

  const [userReactions, setUserReactions] = useState([])
  const [activeTab, setActiveTab] = useState('Posts');

  const tabItems = ['Posts', 'Goings', 'Leafs'];
  const navigate = useNavigate();

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

  //fetch user's posts.
  const fetchUserPosts = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("posts")
      .select(`
        *`)
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.log("Error fetching posts: ", error);
      return;
    }
    setPosts(data);
  };

  const fetchUserGoings =  async () => {
    if (!user) {
      return
    }

    const {data, error} = await supabase
      .from("user_post_reactions")
      .select(`
        post_id,
        goings
        `)
      .eq('profile_id', user.id)
      .eq("goings", 1)
      .order('created_at', {ascending:false})

    if (error) {
      console.log("Error fetching user reactions: ", error)
    }

    const postIds = data.map(item => item.post_id);

    const {data:posts, err} = await supabase
      .from("posts")
      .select("*")
      .in("id", postIds)
      .order('created_at', {ascending:false});

    if (err) {
      console.log("Error fetching posts:", err);
    } 
    setGoings(posts);

  }

  const fetchUserLeafs =  async () => {
    if (!user) {
      return
    }

    const {data, error} = await supabase
      .from("user_post_reactions")
      .select(`
        post_id,
        leafs
        `)
      .eq('profile_id', user.id)
      .eq("leafs", 1)
      .order('created_at', {ascending:false})

    if (error) {
      console.log("Error fetching user reactions: ", error)
    }

    const postIds = data.map(item => item.post_id);

    const {data:posts, err} = await supabase
      .from("posts")
      .select("*")
      .in("id", postIds)
      .order('created_at', {ascending:false});

    if (err) {
      console.log("Error fetching posts:", err);
    } 
    setLeafs(posts);

  }

  const fetchUserRecycles =  async () => {
    if (!user) {
      return
    }

    const {data, error} = await supabase
      .from("user_post_reactions")
      .select(`
        post_id,
        recycles
        `)
      .eq('profile_id', user.id)
      .eq("recycles", 1)
      .order('created_at', {ascending:false})

    if (error) {
      console.log("Error fetching user reactions: ", error)
    }

    const postIds = data.map(item => item.post_id);

    const {data:posts, err} = await supabase
      .from("posts")
      .select("*")
      .in("id", postIds)
      .order('created_at', {ascending:false});

    if (err) {
      console.log("Error fetching posts:", err);
    } 
    setRecycles(posts);

  }

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
    if (!loading && user) {
      fetchProfile();
      fetchUserPosts();
    }
  }, [user, loading]);

  useEffect(() => {
    if (activeTab === "Goings" && !goingsLoaded) {
      fetchUserGoings().then(() => setGoingsLoaded(true));
    }
  }, [activeTab, goingsLoaded]);

  useEffect(() => {
    if (activeTab === "Leafs" && !leafsLoaded) {
      fetchUserLeafs().then(() => setLeafsLoaded(true));
    }
  }, [activeTab, leafsLoaded]);

  if (!user) {
    return <h2 style={{display:'flex', justifyContent:'center', textAlign:'center'}}>Loading...</h2>;

  }

  return (
    <div className="profile-outer">
      <div className="profile-page-content">
        <div className="profile-info">

          
          <wrapper className="profile-wrapper">
            <div className="profile-box">
              <img src={profile?.profile_pic_path} style={{width: "150px", height: "150px", borderRadius: "15px", border:"2px solid rgb(66, 66, 66)", boxShadow: "0 0 1px 1px rgb(255, 255, 255)", objectFit:"cover", display: "block"}}/>
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
              <Link to={`/profilepage/editprofile/${profile?.username}`}>
                <button>Edit</button>
              </Link>
              
            </div>
            <h1>@{profile?.username}</h1>
            
            {profile?.name && <p><strong>Name:</strong> {profile.name}</p>}
            {profile?.phone_number && profile?.display_number === 1 && <p><strong>Phone:</strong> {profile.phone_number}</p>}
            {profile?.bio && <p><strong>Bio:</strong> {profile.bio}</p>}

            add interests array of interest that user can select from a list
            also add "other" for user to type in incase interest isn't there


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
                // const stats = post.post_stats?.[0] || { leafs: 0, goings: 0, recycles: 0 };
                
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

          {activeTab === 'Goings' && (
            goings.length === 0 ? (
              <p>Loading...</p>
            ) : (
      
              goings.map ((post) => {

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

          {activeTab === 'Leafs' &&(
            
            leafs.length === 0 ? (
              <p>Loading...</p>
            ) : (
          
            leafs.map ((post) => {

                return (
                  <Link to={`/postview/${post.id}`} className="card-link">
                    <Card key={post.id} className="profile-card">
                                      
                        <Card.Title style={{marginTop:"10px"}}><strong>{post.title}</strong></Card.Title>
                        
                        {post.image_url && (
                          <img
                            src={post.image_url}
                            alt="Post"
                            style={{ width: "auto", height:"320px", marginTop: "10px", objectFit: "cover"}}
                          />
                        )}

                    </Card>
                    </Link>

                );
              }))
            )
            }
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;