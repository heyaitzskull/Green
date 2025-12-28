import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "/src/lib/supabaseClient";
import Card from 'react-bootstrap/Card';
import { useAuth } from "../context/AuthContext";
import "./PostView.css";

const PostView = () => {
  const {user, loading} = useAuth();
  const [err, setErr] = useState("");
  const [post, setPost] = useState(null);
  const [author, setAuthor] = useState(null);
  const [profileId, setProfileId] = useState(null);
  const [username, setUsername] = useState(null);
  const [userReactions, setUserReactions] = useState({});
  const [comments, setComments] = useState([])
  const [inputComment, setInputComment] = useState("");
  
  const { postId } = useParams();
  const navigate = useNavigate();

  const fetchPost = async () => {
    const { data, error } = await supabase
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
    setUsername(data.username)
  }

  const fetchUserReaction = async () => {
    if (!profileId) return;
    
    const { data, error } = await supabase
      .from("user_post_reactions")
      .select("*")
      .eq("profile_id", profileId)
      .eq("post_id", postId)
      .maybeSingle();
    
    if (error) {
      console.log("Error fetching user reaction:", error);
      return;
    }
    
    if (data) {
      setUserReactions({
        [postId]: {
          leafs: data.leafs || 0,
          goings: data.goings || 0,
          recycles: data.recycles || 0
        }
      });
    }
  };

  const handleLeafGoingRecycle = async (type) => {
    if (!profileId || !post || !post.post_stats || post.post_stats.length === 0) return;

    const stats = post.post_stats[0];
    const currentReactions = userReactions[postId] || { leafs: 0, goings: 0, recycles: 0 };
    const currentValue = currentReactions[type];
    const newValue = currentValue === 1 ? 0 : 1;
    const statChange = newValue === 1 ? 1 : -1;
    
    const updatedReactions = {
      ...currentReactions,
      [type]: newValue
    };
    
    setUserReactions(prev => ({
      ...prev,
      [postId]: updatedReactions
    }));
    
    setPost(prevPost => ({
      ...prevPost,
      post_stats: [{
        ...stats,
        [type]: stats[type] + statChange
      }]
    }));

    let updateStatsData = { [type]: stats[type] + statChange };

    const { error: statsError } = await supabase
      .from('post_stats')
      .update(updateStatsData)
      .eq('id', stats.id);

    if (statsError) {
      console.log("Error updating post_stats:", statsError);
      setUserReactions(prev => ({
        ...prev,
        [postId]: currentReactions
      }));
      fetchPost();
      return;
    }

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
      setUserReactions(prev => ({
        ...prev,
        [postId]: currentReactions
      }));
      fetchPost();
    }
  }

  const fetchPostComments = async () => {
    const {data, error} = await supabase
      .from("post_comments")
      .select('*')
      .eq("post_id", postId)
      .order('created_at', { ascending: false });

    if (error) {
      console.log("Error fetching comments", error)
      return;
    }

    setComments(data || [])
  }

  const handleUploadComment = async (e) => {
    if (!e.trim()) return;
    
    const {error} = await supabase.from("post_comments").insert({
        content: e,
        post_id: postId,
        profile_id: profileId,
        username: username
      }
    )
    
    if(error) {
      console.log("Error uploading comment ", error)
    } else {
      setInputComment("");
      fetchPostComments();
    }
  }

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }

    if (!loading && user) {
      fetchPost();
      fetchProfileId();
    }
  }, [postId, user, loading]);

  useEffect(() => {
    if (profileId) {
      fetchUserReaction();
      fetchPostComments();
    }
  }, [profileId]);

  if (!user || !post) {
    return <h2 style={{display:'flex', justifyContent:'center', textAlign:'center'}}>Loading...</h2>;
  }

  const stats = post.post_stats?.[0] || { leafs: 0, goings: 0, recycles: 0 };
  const userReacted = userReactions[postId] || { leafs: 0, goings: 0, recycles: 0 };

  return (
    <div className="profile-outer">
      <div className="profile-page-content">
        <Card>
          <Card.Body className="postview-card-body">
            
            {/* Left side - Image and Post Info (65%) */}
            <div className="image-and-info-container">
              {post.image_url && (
                <img
                  src={post.image_url}
                  alt="Post"
                  className="post-img"
                />
              )}

              {/* Buttons below image */}
              <div className="buttons-container">
                <button 
                  onClick={() => handleLeafGoingRecycle('leafs')}
                  className={userReacted.leafs ? 'reaction-btn active-leaf' : 'reaction-btn'}
                >
                  🍃 Leaf ({stats.leafs})
                </button>
                <button 
                  onClick={() => handleLeafGoingRecycle('goings')}
                  className={userReacted.goings ? 'reaction-btn active-going' : 'reaction-btn'}
                >
                  🚶 Going ({stats.goings})
                </button>
                <button 
                  onClick={() => handleLeafGoingRecycle('recycles')}
                  className={userReacted.recycles ? 'reaction-btn active-recycle' : 'reaction-btn'}
                >
                  ♻️ Recycle ({stats.recycles})
                </button>
              </div>

              {/* Post info below buttons */}
              <div className="post-info-container">
                {author && (
                  <p style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>
                    <strong>@{author.username}</strong> • {new Date(post.created_at).toLocaleString()}
                  </p>
                )}

                <h3 className="post-title">{post.title}</h3>

                <div className="post-location">
                  <p><strong>Location:</strong> {post.location}</p>
                  <p><strong>Scale:</strong> {post.scale}</p>
                </div>

                <div className='post-caption'>
                  <p><strong>Caption:</strong></p>
                  <p>{post.caption}</p>
                </div>
              </div>
            </div>

            {/* Right side - Comments (35%) */}
            <div className="comments-container-main">
              <h4 style={{ marginBottom: '15px' }}>Comments</h4>
              
              <div className="comments-list">
                {comments.length === 0 ? (
                  <p style={{ color: '#999', fontStyle: 'italic' }}>No comments yet...</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="comment-item">
                      <p className="comment-header">
                        <strong>@{c.username}</strong> • <span className="comment-time">{new Date(c.created_at).toLocaleString()}</span>
                      </p>
                      <p className="comment-content">{c.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Comment input at bottom */}
              <div className="comment-input-container">
                <input
                  placeholder="Add a comment"
                  value={inputComment}
                  onChange={(e) => setInputComment(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleUploadComment(inputComment);
                    }
                  }}
                  className="comment-input"
                />
                
                <button 
                  onClick={() => handleUploadComment(inputComment)}
                  className="comment-btn"
                >
                  Comment
                </button>
              </div>
            </div>
              
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default PostView;