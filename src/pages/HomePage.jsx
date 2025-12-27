import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "/src/lib/supabaseClient";
import "./HomePage.css"
import Card from 'react-bootstrap/Card';
import Select from 'react-select'
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

//comments on each post

//FOR EACH POST: add active/complete. User should be able to make a post 
//  complete after creating the post. On their profile, each post has a
//  sign/icon showing if its complete or active

//postview: fix reaction, be able to view/add comments

//profile: be able to visit other's profiles

//map: when selecting location from map and come back, all info is gone and have to retype it

//map initial location isnt working, always going to vienna: fix

//homepage: initial filter by location if user's locaiton is on,
//  if user's location is off, allow user to manually input city/state/address etc...

//add post: add a day/time of event; add option for TBD 

//map: add a main map where you can see ALL active posts 

const HomePage = () => {
  const {user, loading } = useAuth();
  const [err, setErr] = useState("");
  const [profileId, setProfileId] = useState(null);
  const [allPosts, setAllPosts] = useState([]);
  const [posts, setPosts] = useState([]);
  
  // Store user reactions by post ID: { postId: { leafs: 1, goings: 0, recycles: 1 } }
  const [userReactions, setUserReactions] = useState({});
  
  const [filterValue, setFilterValue] = useState("recent")
  const [searchValue, setSearchValue] = useState("")
  const [searchByValue, setSearchByValue] = useState("title")

  const filters = [
    { value: 'recent', label: 'Most recent' },
    { value: 'latest', label: 'Latest' },
    { value: 'mostLeafs', label: 'Most leafs' },
    { value: 'leastLeafs', label: 'Least leafs' },
    { value: 'mostGoing', label: 'Most Going' },
    { value: 'leastGoing', label: 'Least Going' },
  ]

  const navigate = useNavigate();

  // Fetch all posts with their stats
  const fetchPosts = async () => {
    const {data, error} = await supabase
      .from("posts")
      .select(`
        *,
        post_stats (
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
    setAllPosts(data);
    setPosts(data);
  }

  const fetchProfileId = async () => {
    if (!user) return;

    const {data, error} = await supabase
      .from("profiles")
      .select('*')
      .eq('id', user.id) 
      .single();
    
    if (error) {
      console.log("Error fetching profile id:", error);
      return;
    } 
    setProfileId(data.id);
  }

  // Fetch user's reactions for all posts -> change it to posts that are currently displayed
  // because will display only 20 posts at a time and display more as user scrolls
  const fetchUserReactions = async () => {
    if (!profileId) return;
    
    const { data, error } = await supabase
      .from("user_post_reactions")
      .select("*")
      .eq("profile_id", profileId);
    
    if (error) {
      console.log("Error fetching user reactions:", error);
      return;
    }
    
    // Convert array to object keyed by post_id
    const reactionsMap = {};
    data.forEach(reaction => {
      reactionsMap[reaction.post_id] = {
        leafs: reaction.leafs || 0,
        goings: reaction.goings || 0,
        recycles: reaction.recycles || 0
      };
    });
    
    setUserReactions(reactionsMap);
  };

  const filterPosts = (props) => {
    let sorted = [...posts];
    
    if (props === "recent") {
      sorted = sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (props === "latest") {
      sorted = sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (props === "mostLeafs") {
      sorted = sorted.sort((a, b) => {
        const aLeafs = a.post_stats?.[0]?.leafs || 0;
        const bLeafs = b.post_stats?.[0]?.leafs || 0;
        return bLeafs - aLeafs;
      });
    } else if (props === "leastLeafs") {
      sorted = sorted.sort((a, b) => {
        const aLeafs = a.post_stats?.[0]?.leafs || 0;
        const bLeafs = b.post_stats?.[0]?.leafs || 0;
        return aLeafs - bLeafs;
      });
    } else if (props === "mostGoing") {
      sorted = sorted.sort((a, b) => {
        const aGoings = a.post_stats?.[0]?.goings || 0;
        const bGoings = b.post_stats?.[0]?.goings || 0;
        return bGoings - aGoings;
      });
    } else if (props === "leastGoing") {
      sorted = sorted.sort((a, b) => {
        const aGoings = a.post_stats?.[0]?.goings || 0;
        const bGoings = b.post_stats?.[0]?.goings || 0;
        return aGoings - bGoings;
      });
    }
    
    setPosts(sorted); 
  }

  // Optimized reaction handler with optimistic updates
  const handleLeafGoingRecycle = async (postId, type) => {
    if (!profileId) return;

    const post = posts.find(p => p.id === postId);
    if (!post || !post.post_stats || post.post_stats.length === 0) return;

    const stats = post.post_stats[0];
    
    // Get current user reaction from local state (faster than DB query)
    const currentReactions = userReactions[postId] || { leafs: 0, goings: 0, recycles: 0 };
    
    // Determine if toggling on or off
    const currentValue = currentReactions[type];
    const newValue = currentValue === 1 ? 0 : 1;
    const statChange = newValue === 1 ? 1 : -1;
    
    // OPTIMISTICALLY UPDATE UI IMMEDIATELY
    const updatedReactions = {
      ...currentReactions,
      [type]: newValue
    };
    
    // Update local state immediately for instant UI feedback
    setUserReactions(prev => ({
      ...prev,
      [postId]: updatedReactions
    }));
    
    // Update posts state immediately
    setPosts(prevPosts => 
      prevPosts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            post_stats: [{
              ...stats,
              [type]: stats[type] + statChange
            }]
          };
        }
        return p;
      })
    );

    // Update allPosts as well to maintain consistency
    setAllPosts(prevPosts => 
      prevPosts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            post_stats: [{
              ...stats,
              [type]: stats[type] + statChange
            }]
          };
        }
        return p;
      })
    );

    // THEN UPDATE DATABASE IN BACKGROUND
    let updateStatsData = { [type]: stats[type] + statChange };

    const { error: statsError } = await supabase
      .from('post_stats')
      .update(updateStatsData)
      .eq('id', stats.id);

    if (statsError) {
      console.log("Error updating post_stats:", statsError);
      // Revert optimistic update on error
      setUserReactions(prev => ({
        ...prev,
        [postId]: currentReactions
      }));
      fetchPosts();
      return;
    }

    // Update user_post_reactions
    const { error: reactionError } = await supabase
      .from('user_post_reactions')
      .upsert(
        {
          profile_id: profileId,
          post_id: postId,
          leafs: updatedReactions.leafs,
          goings: updatedReactions.goings,
          recycles: updatedReactions.recycles
        },
        {
          onConflict: 'profile_id,post_id'
        }
      );

    if (reactionError) {
      console.log("Error updating user reactions:", reactionError);
      // Revert optimistic update on error
      setUserReactions(prev => ({
        ...prev,
        [postId]: currentReactions
      }));
      fetchPosts();
    }
  }

  const handleSearch = (e) => {
    setSearchValue(e);

    if (e.trim() === "") {
      setPosts(allPosts);
      return;
    }

    let filteredPosts = [];
    const lower = e.toLowerCase();

    if (searchByValue === "title") {
      filteredPosts = allPosts.filter(post => 
        post.title.toLowerCase().includes(lower)
      );
    } else if (searchByValue === "location") {
      filteredPosts = allPosts.filter(post => 
        post.location.toLowerCase().includes(lower)
      );
    }
    setPosts(filteredPosts);
  }

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
    if (!loading && user) {
      fetchPosts();
      fetchProfileId();
    }
  }, [loading, user]);

  // Fetch user reactions after profileId is set
  useEffect(() => {
    if (profileId) {
      fetchUserReactions();
    }
  }, [profileId]);

  if (loading) {
    return <h2 style={{display:'flex', justifyContent:'center', textAlign:'center'}}>Loading...</h2>;
  }

  return (
    <div className="outer">
      <div className="page-content">
        <div className="filter-container">
          <div>
            Search By
            <input
              type="radio"
              id="title"
              value="title"
              checked={searchByValue === "title"}
              onChange={(e) => setSearchByValue(e.target.value)}
            />
            <label htmlFor="title" style={{marginRight: "5px"}}>Title</label>

            <input
              type="radio"
              id="location"
              value="location"
              checked={searchByValue === "location"}
              onChange={(e) => setSearchByValue(e.target.value)}
            />
            <label htmlFor="location" style={{marginRight: "10px"}}>Location</label>

            <input type="text" 
              className='search-feed' 
              placeholder='Search Posts...'
              onChange={(e) => handleSearch(e.target.value)}
              value={searchValue}
            />
          </div>

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
          
        <div className="content-area">
          {posts.length === 0 ? (
            <div>
              {searchValue ? (
                <p className="empty-post">No posts found for "{searchValue}"</p>
              ) : (
                <p style={{display:'flex', justifyContent:'center', textAlign:'center'}}>No posts yet...</p>
              )}
            </div>
          ) : (
            <div className="post-list">
              {posts.map((post) => {
                const stats = post.post_stats?.[0] || { leafs: 0, goings: 0, recycles: 0 };
                const userReacted = userReactions[post.id] || { leafs: 0, goings: 0, recycles: 0 };
                
                return (
                  <Card key={post.id} className="homepage-card">
                    <Link to={`/postview/${post.id}`} className="card-link">
                      <Card.Body>
                        <Card.Title><strong>{post.title}</strong></Card.Title>
                        <p><em>{post.location}</em></p>

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
                      <button 
                        onClick={() => handleLeafGoingRecycle(post.id, 'leafs')}
                      >
                        {stats.leafs}🍃
                      </button>
                      <button 
                        onClick={() => handleLeafGoingRecycle(post.id, 'goings')}
                      >
                        {stats.goings}🚶
                      </button>
                      <button 
                        onClick={() => handleLeafGoingRecycle(post.id, 'recycles')}
                      >
                        {stats.recycles}♻️
                      </button>
                    </div>
                  </Card>
                );             
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;