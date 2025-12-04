import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "/src/lib/supabaseClient";
import Select from 'react-select'
import "./AddPost.css";
import { useAuth } from "../context/AuthContext";

//import a UUID generator, install 'uuid' if you haven't: npm install uuid
import { v4 as uuidv4 } from 'uuid'; // Assuming 'uuid' package is installed

const AddPost = () => {
    const { user} = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState();
    const [title, setTitle] = useState("");
    
    // imagePath will store the path in the bucket (e.g., 'user_id/uuid')
    const [imagePath, setImagePath] = useState(null); 

    // imagePreview will store the full public URL for display
    const [imagePreview, setImagePreview] = useState(null); 
    const [location, setLocation] = useState("");
    const [caption, setCaption] = useState("");
    const [scale, setScale] = useState(null);

    const scaleOptions = [
        { value:"small", label:'Small' },
        { value:"medium", label:'Medium'},
        { value:"large", label: 'Large'},
    ]

    //upload image
    const uploadImage = async (e) => {

        //getting the file
        const file = e.target.files[0];

        //if file or user doesnt exist 
        if (!file || !user) return;

        //unique path for the file
        const filePath = `${user.id}/${uuidv4()}-${file.name}`;
        setLoading(true);

        //uploading the file path and file into supabase images bucket
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('post-images')
            .upload(filePath, file);
        
        setLoading(false);

        if (uploadError) {
            console.error("Upload Error:", uploadError);
            setErr("Image upload failed.");
            return;
        }

        //getting the public URL for the newly uploaded file
        const { data: { publicUrl } } = supabase
            .storage
            .from('post-images')
            .getPublicUrl(uploadData.path); 
        
        //save the file path and the public URL to state
        setImagePath(uploadData.path);
        setImagePreview(publicUrl);
        setErr(""); //clear any previous errors
    }

    // --- Media/Post Handler (Keep this for now, but it was not right for instant preview) ---
    // Removed the problematic getMedia, as you only need the publicUrl after upload.
    // The previous getMedia was trying to list files, not get public URLs for a specific file.

    // --- Handle Post Upload (Uncommented and uses imagePath) ---
    const handleUpload = async (event) => {
        event.preventDefault();

        if (!title || !caption || !location || !imagePath || !scale) {
            setErr("Please fill in all fields and upload an image.");
            return;
        }

        setLoading(true);
        setErr("");

        // Get the final public URL again, in case the upload function only saved the path
        // It's safer to use the stored imagePreview if it exists, but getting it again
        // from the path ensures the most current URL.
        const { data: { publicUrl: finalImageUrl } } = supabase.storage
            .from("post-images")
            .getPublicUrl(imagePath);

        //insert into post with REAL image URL
        const { error } = await supabase
            .from("posts")
            .insert({
                profile_id: user.id,
                title,
                caption,
                location,
                scale,
                image_url: finalImageUrl,
            });

        setLoading(false);

        if (error) {
            setErr("Failed to create post: " + error.message);
        } else {
            alert("Post Created!");
            navigate("/homepage");
        }
    };
 
    useEffect(() => {
        if (!user) {
            navigate("/login");
        }

    }, [user]); //run only on component mount

    return (
        <div>
            <div className="add-page-content">
                <h>Add Post</h>
                <p className="err-msg">{err}</p>
                <form onSubmit={handleUpload}>
                    <div>
                        <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)}/>
                        <input type="text" placeholder="Caption" value={caption} onChange={(e) => setCaption(e.target.value)}/>
                        <input type="text" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)}/>
                        <div>
                            {/* <input type="text" placeholder="Scale" value={scale} onChange={(e) => setScale(e.target.value)}/> */}
                            <Select 
                                options={scaleOptions}
                                onChange = {(selected) => {
                                    setScale(selected.value)
                                }}
                            />
                        </div>
                    </div>
                    
                    
                    {/* 1. File Input */}
                    <input type="file" onChange={uploadImage} disabled={loading}/>
                    
                    {/* 2. Image Preview (NEW) */}
                    {imagePreview && (
                        <div className="image-preview-container" style={{marginTop: '15px'}}>
                            <h4>Image Preview:</h4>
                            
                            <img 
                                src={imagePreview} 
                                alt="Post Preview" 
                                style={{maxWidth: '300px', maxHeight: '300px', border: '1px solid #ccc', display: 'block'}}
                            />
                        </div>
                    )}

                    <br/>
                    <br/>
                    
                    <button type="submit" disabled={loading}>
                        {loading ? "Loading..." : "Create Post"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddPost;