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
      {/* <div className="header">
        <img className="leaf-logo" src={leafLogo} alt="Logo" />
        <h1>The Environmental Post</h1>
      </div> */}
      
      {/* <Nav className="profile-navbar">
        <Nav.Link href="/homepage">Feed</Nav.Link>
        <Nav.Link href="/addpost">Add Post</Nav.Link>
        <Nav.Link href="/profilepage">Profile</Nav.Link>
        <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
      </Nav> */}

      <div className="profile-page-content">
        <div className="profile-info">
          <h2>@{user?.username}</h2>
          {user?.name && <p><strong>Name:</strong> {user.name}</p>}
          {user?.bio && <p><strong>Bio:</strong> {user.bio}</p>}
          {user?.phone_number && <p><strong>Phone:</strong> {user.phone_number}</p>}
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