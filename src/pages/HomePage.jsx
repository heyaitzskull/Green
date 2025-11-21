import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "/src/lib/supabaseClient";
import "./HomePage.css"
import Nav from 'react-bootstrap/Nav';
import Card from 'react-bootstrap/Card';
import leafLogo from "../assets/leaf-logo.png"
import Select from 'react-select'
import { Link } from "react-router-dom";

const HomePage = () => {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [userLeaf, setUserLeaf] = useState(false)
  const [userGoing, setUserGoing] = useState(false)
  const [userRecycle, setUserRecycle] = useState(false)
  const [filterValue, setFilterValue] = useState("recent")
  const filters = [
    { value: 'recent', label: 'Most recent' },
    { value: 'latest', label: 'Latest' },
    { value: 'mostLeafs', label: 'Most leafs' },
    { value: 'leastLeafs', label: 'Least leafs' },
    { value: 'mostGoing', label: 'Most Going' },
    { value: 'leastGoing', label: 'Least Going' },
  ]

  const navigate = useNavigate();

  //getting the user's profile
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

  //fetching ALL posts with their stats using JOIN
  const fetchPosts = async () => {
    const {data, error} = await supabase
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
      .order('created_at', { ascending: false });
    
    if (error) {
      console.log("Error fetching posts:", error);
      return;
    }
    setPosts(data);
    console.log(data);
  }

  const handleLogout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);
    if (error) return setErr(error.message);
    navigate("/login");
  };

  const filterPosts = (props) => {
    let sorted = [...posts];
    
    if (props === "recent") {
      sorted = sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); //most recent first

    } else if (props === "latest") {
      sorted = sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); //oldest first

    } else if (props === "mostLeafs") {

      sorted = sorted.sort((a, b) => {
        const aLeafs = a.lgr_stats?.[0]?.leafs || 0;
        const bLeafs = b.lgr_stats?.[0]?.leafs || 0;
        return bLeafs - aLeafs; //most leafs first
      });

    } else if (props === "leastLeafs") {
      sorted = sorted.sort((a, b) => {
        const aLeafs = a.lgr_stats?.[0]?.leafs || 0;
        const bLeafs = b.lgr_stats?.[0]?.leafs || 0;
        return aLeafs - bLeafs; //least leafs first
      });
      
    } else if (props === "mostGoing") {
      sorted = sorted.sort((a, b) => {
        const aGoings = a.lgr_stats?.[0]?.goings || 0;
        const bGoings = b.lgr_stats?.[0]?.goings || 0;
        return bGoings - aGoings; //most goings first
      });
      
    } else if (props === "leastGoing") {
      sorted = sorted.sort((a, b) => {
        const aGoings = a.lgr_stats?.[0]?.goings || 0;
        const bGoings = b.lgr_stats?.[0]?.goings || 0;
        return aGoings - bGoings; //least goings first
      });
    }
    
    setPosts(sorted); 
  }

  //updating the counts of leaf, going, and recycle if the user "likes" or "unlikes" it
  const handleLeafGoingRecycle = async (postId, type) => {
    //find the stats for this post
    const post = posts.find(p => p.id === postId);
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
      
    } 
    if (type === 'going') {
      if (userGoing) {
        updateData = { goings: stats.goings - 1 };
        setUserGoing(!userGoing)
      } else {
        updateData = { goings: stats.goings + 1 };
        setUserGoing(!userGoing)
      }
    } 

    if (type === 'recycle') {
      if (userRecycle) {
        updateData = { recycles: stats.recycles - 1 };
        setUserRecycle(!userRecycle)
      } else {
        updateData = { recycles: stats.recycles + 1 };
        setUserRecycle(!userRecycle)
      }
    }

    //update the stats in database
    const { error } = await supabase
      .from('lgr_stats')
      .update(updateData)
      .eq('id', stats.id);

    if (error) {
      console.log("Error updating stats:", error);
      return;
    }

    // Refresh posts to show updated stats
    fetchPosts();
  }


  useEffect(() => {
    fetchUser();
    fetchPosts();
  }, []);

  if (!user) {
    return <h2 style={{display:'flex', justifyContent:'center', textAlign:'center'}}>Loading...</h2>;
  }

  return (
    <div className="outer">

      <div className="page-content">
        {posts.length === 0 ? (
          <p>No posts yet...</p>
        ) : (
        
        <div style={{display:"flex", flexDirection:"column"}}>

            <div className="filter-container">
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "10px" }}>
                  <p style={{ margin: 0 }}>Filter by:</p>
                  <Select
                    className="select"
                    options={filters}
                    placeholder="Filter by"
                    onChange={(selected) => {
                      setFilterValue(selected.value);
                      filterPosts(selected.value);
                    }}
                    value={filters.find(f => f.value === filterValue)}
                  />
                </div>
            </div>

          <div style={{display:"flex", flexDirection:"row", flexWrap: "wrap", alignItems: "center", justifyContent:"center"}}>

            {posts.map((post) => {
              const stats = post.lgr_stats?.[0] || { leafs: 0, goings: 0, recycles: 0 };
              
              return (
                
                <Card key={post.id} className="homepage-card">
                  
                  <Link to={`/postview/${post.id}`} className="card-link">

                    <Card.Body>
                      <Card.Title><strong>{post.title}</strong></Card.Title>
                      
                      <p><em>{post.location}</em></p>
                      {/* <p><strong>Scale:</strong> {post.scale}</p> */}

                      {post.image_url && (
                        <img
                          src={post.image_url}
                          alt="Post"
                          style={{ width: "200px", height:"200px", borderRadius: "8px", marginTop: "10px", objectFit: "cover"}}
                        />
                      )}

                      <p>{new Date(post.created_at).toLocaleString()}</p>

                    </Card.Body>
                  </Link>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <button onClick={() => handleLeafGoingRecycle(post.id, 'leaf')}>
                        {stats.leafs}🍃
                      </button>
                      <button onClick={() => handleLeafGoingRecycle(post.id, 'going')}>
                        {stats.goings}🚶
                      </button>
                      {/* <button>
                        💬C(0)
                      </button> */}
                      <button onClick={() => handleLeafGoingRecycle(post.id, 'recycle')}>
                        {stats.recycles}♻️
                      </button>
                    </div>
                  
                </Card>
                
              );             
            })}
            
          </div>
        </div>
          )}
        
      </div>
    </div>
  );
};

export default HomePage;