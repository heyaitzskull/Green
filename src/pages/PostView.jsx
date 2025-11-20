import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "/src/lib/supabaseClient";
import Nav from 'react-bootstrap/Nav';
import Card from 'react-bootstrap/Card';
import leafLogo from "../assets/leaf-logo.png";
import "./ProfilePage.css"; // Reuse ProfilePage styles

const PostView = () => {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [user, setUser] = useState(null);
  const [post, setPost] = useState(null);
  const [author, setAuthor] = useState(null);
  const [userLeaf, setUserLeaf] = useState(false)
  const [userGoing, setUserGoing] = useState(false)
  const [userRecycle, setUserRecycle] = useState(false)
  const { postId } = useParams();
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

    if (error) console.log(error);
    else setUser(data);
  };

  const fetchPost = async () => {
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
      .eq('id', postId)
      .single();

    if (error) {
      console.log("Error fetching post:", error);
      setErr("Post not found");
      return;
    }

    setPost(data);

    // Fetch the author's profile
    const { data: authorData, error: authorError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.profile_id)
      .single();

    if (authorError) {
      console.log("Error fetching author:", authorError);
    } else {
      setAuthor(authorData);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);
    if (error) return setErr(error.message);
    navigate("/login");
  };

  const handleLeafGoingRecycle = async (type) => {
    if (!post || !post.lgr_stats || post.lgr_stats.length === 0) return;

    const stats = post.lgr_stats[0];
    let updateData = {};

    if (type === 'leaf') {

      if (userLeaf) {
        updateData = { leafs: stats.leafs - 1 };
        setUserLeaf(!userLeaf)
      } else {
        updateData = { leafs: stats.leafs + 1 };
        setUserLeaf(!userLeaf)
      }

    } else if (type === 'going') {
      
      if (userGoing) {
        updateData = { goings: stats.goings - 1 };
        setUserGoing(!userGoing)
      } else {
        updateData = { goings: stats.goings + 1 };
        setUserGoing(!userGoing)
      }
    } else if (type === 'recycle') {
    //   updateData = { recycles: stats.recycles + 1 };

      if (userRecycle) {
        updateData = { recycles: stats.recycles - 1 };
        setUserRecycle(!userRecycle)
      } else {
        updateData = { recycles: stats.recycles + 1 };
        setUserRecycle(!userRecycle)
      }
      
    }

    

    const { error } = await supabase
      .from('lgr_stats')
      .update(updateData)
      .eq('id', stats.id);

    if (error) {
      console.log("Error updating stats:", error);
      return;
    }

    // Refresh post data
    fetchPost();
  };

  useEffect(() => {
    fetchUser();
    fetchPost();
  }, [postId]);

  if (!user || !post) {
    return <h2 style={{display:'flex', justifyContent:'center', textAlign:'center'}}>Loading...</h2>;

  }

  const stats = post.lgr_stats?.[0] || { leafs: 0, goings: 0, recycles: 0 };

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
        {err && <p style={{ color: 'red' }}>{err}</p>}

        <button 
          onClick={() => navigate('/homepage')}
          style={{ marginBottom: '20px', padding: '10px 20px', cursor: 'pointer' }}
        >
          ← Back to Feed
        </button>

        <Card style={{ width: '70%', height: '100%', margin: '0 auto' }}>
          <Card.Body>
            <div style={{ marginBottom: '20px' }}>
              <h2>{post.title}</h2>
              {author && (
                <p style={{ color: '#666', fontSize: '14px' }}>
                  Posted by <strong>@{author.username}</strong> on {new Date(post.created_at).toLocaleString()}
                </p>
              )}
            </div>

            {post.image_url && (
              <img
                src={post.image_url}
                alt="Post"
                style={{ 
                  width: "100%", 
                  maxHeight: "500px", 
                  borderRadius: "12px", 
                  marginBottom: "20px", 
                  objectFit: "contain"
                }}
              />
            )}

            <div style={{ marginTop: '20px' }}>
              <p><strong>Caption:</strong></p>
              <p style={{ fontSize: '16px', lineHeight: '1.6' }}>{post.caption}</p>
            </div>

            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
              <p><strong>Location:</strong> {post.location}</p>
              <p><strong>Scale:</strong> {post.scale}</p>
            </div>

            <div style={{ 
              display: 'flex', 
              gap: '15px', 
              marginTop: '30px',
              marginBottom: '30px',
              paddingTop: '20px',
              borderTop: '1px solid #ddd'
            }}>
              <button 
                onClick={() => handleLeafGoingRecycle('leaf')}
                style={{ 
                  padding: '10px 20px', 
                  fontSize: '16px',
                  cursor: 'pointer',
                  border: '1px solid #4caf50',
                  borderRadius: '8px',
                  background: 'white',
                  marginBottom: '50px',
                }}
              >
                🍃 Leaf ({stats.leafs})
              </button>
              <button 
                onClick={() => handleLeafGoingRecycle('going')}
                style={{ 
                  padding: '10px 20px', 
                  fontSize: '16px',
                  cursor: 'pointer',
                  border: '1px solid #2196f3',
                  borderRadius: '8px',
                  background: 'white',
                  marginBottom: '50px'
                }}
              >
                🚶 Going ({stats.goings})
              </button>
              <button 
                onClick={() => handleLeafGoingRecycle('recycle')}
                style={{ 
                  padding: '10px 20px', 
                  fontSize: '16px',
                  cursor: 'pointer',
                  border: '1px solid #ff9800',
                  borderRadius: '8px',
                  background: 'white',
                  marginBottom: '50px'
                }}
              >
                ♻️ Recycle ({stats.recycles})
              </button>
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default PostView;