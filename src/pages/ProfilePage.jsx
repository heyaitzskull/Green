import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "/src/lib/supabaseClient";
import Card from 'react-bootstrap/Card';
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./ProfilePage.css";
import goldfish from "../assets/goldfish.jpg"

const ProfilePage = () => {
  const {user, loading} = useAuth();
  const { username } = useParams();

  const [profile, setProfile] = useState(null);
  // const [profilepic, setProfilePic] = useState("");

  const [posts, setPosts] = useState([]);
  const [joins, setJoins] = useState([]);
  const [leafs, setLeafs] = useState([]);
  const [recycles, setRecycles] = useState([]);
  const [activeTab, setActiveTab] = useState('Posts');
  const [filterPosts, setFilterPosts] = useState("all");
  const [postsLoading, setPostsLoading] = useState(false);
  const [joinsLoading, setJoinsLoading] = useState(false);
  const [leafsLoading, setLeafsLoading] = useState(false);
  

  const tabItems = ['Posts', 'Joins', 'Leafs'];
  const navigate = useNavigate();

  const fetchProfile = async () => {
    if (!user) return;

    const {data, error} = await supabase
      .from("profiles")
      .select("*")
      .eq('username', username)
      .single();
    
    if (error) {
      console.log("Error fetching profile:", error);
      return;
    }

    setProfile(data);
  }

  const fetchUserPosts = async (e) => {
    if (!profile) return;

    setPostsLoading(true);
    const filterActive = e === "active" ? true : false;

    let postsQuery = supabase
      .from("posts")
      .select("*")
      .eq('profile_id', profile.id);

    if (e !== "all") {
      postsQuery = postsQuery.eq('is_active', filterActive);
    }

    const { data, error } = await postsQuery.order('created_at', { ascending: false });

    if (error) {
      console.log("Error fetching posts: ", error);
      setPostsLoading(false);
      return;
    }
    
    setPosts(data);
    setPostsLoading(false);
  };

  const fetchUserJoins = async (e) => {
    if (!profile) return;

    setJoinsLoading(true);
    const filterActive = e === "active" ? true : false;

    const { data, error } = await supabase
      .from("user_post_reactions")
      .select("post_id, joins")
      .eq('profile_id', profile.id)
      .eq("joins", 1)
      .order('created_at', {ascending: false});
    
    if (error) {
      console.log("Error fetching user reactions: ", error);
      setJoinsLoading(false);
      return;
    }

    const postIds = data.map(item => item.post_id);

    let postsQuery = supabase
      .from("posts")
      .select("*")
      .in("id", postIds);

    if (e !== "all") {
      postsQuery = postsQuery.eq('is_active', filterActive);
    }

    const {data: posts, error: err} = await postsQuery.order('created_at', {ascending: false});

    if (err) {
      console.log("Error fetching posts:", err);
      setJoinsLoading(false);
      return;
    } 
    
    setJoins(posts);
    setJoinsLoading(false);
  }

  const fetchUserLeafs = async (e) => {
    if (!profile) return;

    setLeafsLoading(true);
    const filterActive = e === "active" ? true : false;

    const {data, error} = await supabase
      .from("user_post_reactions")
      .select("post_id, leafs")
      .eq('profile_id', profile.id)
      .eq("leafs", 1)
      .order('created_at', {ascending: false});

    if (error) {
      console.log("Error fetching user reactions: ", error);
      setLeafsLoading(false);
      return;
    }

    const postIds = data.map(item => item.post_id);

    let postsQuery = supabase
      .from("posts")
      .select("*")
      .in("id", postIds);

    if (e !== "all") {
      postsQuery = postsQuery.eq('is_active', filterActive);
    }

    const {data: posts, error: err} = await postsQuery.order('created_at', {ascending: false});

    if (err) {
      console.log("Error fetching posts:", err);
      setLeafsLoading(false);
      return;
    } 
    
    setLeafs(posts);
    setLeafsLoading(false);
  }

  const fetchUserRecycles = async () => {
    if (!profile) return;

    const {data, error} = await supabase
      .from("user_post_reactions")
      .select("post_id, recycles")
      .eq('profile_id', profile.id)
      .eq("recycles", 1)
      .order('created_at', {ascending: false});

    if (error) {
      console.log("Error fetching user reactions: ", error);
      return;
    }

    const postIds = data.map(item => item.post_id);

    const {data: posts, error: err} = await supabase
      .from("posts")
      .select("*")
      .in("id", postIds)
      .order('created_at', {ascending: false});

    if (err) {
      console.log("Error fetching posts:", err);
      return;
    } 
    setRecycles(posts);
  }

  // First useEffect: Check auth, check username, and fetch profile
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
    if (!loading && user) {
      fetchProfile();
    }
  }, [user, loading, username]);

  // Second useEffect: Once profile loads, fetch initial posts
  useEffect(() => {
    if (profile) {
      fetchUserPosts(filterPosts);
    }
  }, [profile]);

  // Third useEffect: When tab or filter changes, refetch appropriate data
  useEffect(() => {
    if (!profile) return;
    
    if (activeTab === "Posts") {
      fetchUserPosts(filterPosts);
    } else if (activeTab === "Joins") {
      fetchUserJoins(filterPosts);
    } else if (activeTab === "Leafs") {
      fetchUserLeafs(filterPosts);
    }
  }, [activeTab, filterPosts, profile]);

  if (!user || !profile) {
    return <h2 style={{display:'flex', justifyContent:'center', textAlign:'center'}}>Loading...</h2>;
  }

  return (
    <div className="profile-outer">
      <div className="profile-page-content">
        <div className="profile-info">
          <wrapper className="profile-wrapper">
            <div className="profile-box">
              <img 
                src={profile?.profile_pic_path ? profile?.profile_pic_path : goldfish} 
                style={{
                  width: "150px", 
                  height: "150px", 
                  borderRadius: "15px", 
                  border:"2px solid rgb(66, 66, 66)", 
                  boxShadow: "0 0 1px 1px rgb(255, 255, 255)", 
                  objectFit:"cover", 
                  display: "block"
                }}
                alt="Profile"
              />
            </div>
          </wrapper>
        
          <br/>
          
          <svg width="0" height="0">
            <clipPath id="svgClip" clipPathUnits="objectBoundingBox">
              <path d="M.067.067C.1676 0 .8379 0 .9385.067C1.0055.1676 1.0055.8379.9385.9385C.8379 1.0055.1676 1.0055.067.9385C0 .8379 0 .1676.067.067"></path>
            </clipPath>
          </svg>
         
          <div style={{width:'100vh'}}>
            {user.id === profile.id && (
              <div style={{textAlign:"right"}}>
                <Link to={`/profilepage/editprofile/${profile?.username}`}>
                  <button>Edit</button>
                </Link>
              </div>
            )}
            
            <h1>@{username}</h1>
            
            {profile?.name && <p><strong>Name:</strong> {profile.name}</p>}
            {profile?.phone_number && profile?.display_number === 1 && <p><strong>Phone:</strong> {profile.phone_number}</p>}
            {profile?.bio && <p><strong>Bio:</strong> {profile.bio}</p>}
          </div>
        </div>

        <input
          type="radio"
          id="all"
          value="all"
          checked={filterPosts === "all"}
          onChange={(e) => setFilterPosts(e.target.value)}
        />
        <label htmlFor="all" style={{marginRight: "5px"}}>All</label>

        <input
          type="radio"
          id="active"
          value="active"
          checked={filterPosts === "active"}
          onChange={(e) => setFilterPosts(e.target.value)}
        />
        <label htmlFor="active" style={{marginRight: "10px"}}>Active</label>

        <input
          type="radio"
          id="complete"
          value="complete"
          checked={filterPosts === "complete"}
          onChange={(e) => setFilterPosts(e.target.value)}
        />
        <label htmlFor="complete" style={{marginRight: "10px"}}>Complete</label>

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
            postsLoading ? (
              <p>Loading...</p>
            ) : posts.length === 0 ? (
              <p>No posts yet...</p>
            ) : (
              posts.map((post) => (
                <Link key={post.id} to={`/postview/${post.title}/${post.id}`} className="card-link">
                  <Card className="profile-card">
                    <Card.Title style={{marginTop:"10px"}}>
                      <strong>{post.title}</strong>
                    </Card.Title>
                    
                    {post.image_url && (
                      <img
                        src={post.image_url}
                        alt="Post"
                        style={{ width: "auto", height:"320px", marginTop: "10px", objectFit: "cover"}}
                      />
                    )}
                  </Card>
                </Link>
              ))
            )
          )}

          {activeTab === 'Joins' && (
            joinsLoading ? (
              <p>Loading...</p>
            ) : joins.length === 0 ? (
              <p>No joins so far...</p>
            ) : (
              joins.map((post) => (
                <Link key={post.id} to={`/postview/${post.title}/${post.id}`} className="card-link">
                  <Card className="profile-card">
                    <Card.Title style={{marginTop:"10px"}}>
                      <strong>{post.title}</strong>
                    </Card.Title>
                    
                    {post.image_url && (
                      <img
                        src={post.image_url}
                        alt="Post"
                        style={{ width: "auto", height:"320px", marginTop: "10px", objectFit: "cover"}}
                      />
                    )}
                  </Card>
                </Link>
              ))
            )
          )}

          {activeTab === 'Leafs' && (
            leafsLoading ? (
              <p>Loading...</p>
            ) : leafs.length === 0 ? (
              <p>No leafs yet...</p>
            ) : (
              leafs.map((post) => (
                <Link key={post.id} to={`/postview/${post.title}/${post.id}`} className="card-link">
                  <Card className="profile-card">
                    <Card.Title style={{marginTop:"10px"}}>
                      <strong>{post.title}</strong>
                    </Card.Title>
                    
                    {post.image_url && (
                      <img
                        src={post.image_url}
                        alt="Post"
                        style={{ width: "auto", height:"320px", marginTop: "10px", objectFit: "cover"}}
                      />
                    )}
                  </Card>
                </Link>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;