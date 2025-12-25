import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "/src/lib/supabaseClient";
import Select from 'react-select'
import "./AddPost.css";
import { useAuth } from "../context/AuthContext";
import debounce from "lodash.debounce";
import { v4 as uuidv4 } from 'uuid';

const AddPost = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const locationFromRouter = useLocation();
    const selectedLocation = locationFromRouter.state?.selectedLocation;

    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState();
    const [title, setTitle] = useState("");
    const [locations, setLocations] = useState([]); //fixed: was setAllLocations
    const [imagePath, setImagePath] = useState(null); 
    const [imagePreview, setImagePreview] = useState(null); 
    
    //Location data, stores address string AND coordinates
    const [postLocation, setPostLocation] = useState(""); // The address string for DB
    const [locationCoords, setLocationCoords] = useState(null); // {lat, lng}
    
    const [locationQuery, setLocationQuery] = useState("");
    const [caption, setCaption] = useState("");
    const [scale, setScale] = useState(null);

    const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

    const scaleOptions = [
        { value:"small", label:'Small' },
        { value:"medium", label:'Medium'},
        { value:"large", label: 'Large'},
    ]

    //get locations from search bar
    const getLocations = async (query) => {
        if (!query || query.trim().length < 3) {
            setLocations([]);
            return;
        }

        try {
            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=5&types=address,place,postcode`
            );

            if (!response.ok) {
                console.error("Mapbox API error:", response.status);
                setLocations([]);
                return;
            }

            const data = await response.json();
            console.log("Mapbox results:", data.features);

            const formattedLocations = data.features.map(feature => ({
                place_id: feature.id,
                display_name: feature.place_name,
                coordinates: feature.center // [longitude, latitude]
            }));

            setLocations(formattedLocations);
        } catch (err) {
            console.error("Exception fetching locations:", err);
            setLocations([]);
        }
    };

    const debouncedFetch = useCallback(
        debounce((value) => {
            getLocations(value);
        }, 300),
        []
    );

    const uploadImage = async (e) => {
        const file = e.target.files[0];
        if (!file || !user) return;

        const filePath = `${user.id}/${uuidv4()}-${file.name}`;
        setLoading(true);

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

        const { data: { publicUrl } } = supabase
            .storage
            .from('post-images')
            .getPublicUrl(uploadData.path); 
        
        setImagePath(uploadData.path);
        setImagePreview(publicUrl);
        setErr("");
    }

    const handleUpload = async (event) => {
        event.preventDefault();

        if (!title || !caption || !postLocation || !imagePath || !scale) {
            setErr("Please fill in all fields and upload an image.");
            return;
        }

        setLoading(true);
        setErr("");

        const { data: { publicUrl: finalImageUrl } } = supabase.storage
            .from("post-images")
            .getPublicUrl(imagePath);

        // Prepare the post data
        const postData = {
            profile_id: user.id,
            title,
            caption,
            location: postLocation, // The address string
            scale,
            image_url: finalImageUrl,
            latitude: locationCoords.latitude,
            longitude: locationCoords.longitude,
            
        };

        const { data:post, error:postError } = await supabase
            .from("posts")
            .insert(postData)
            .select()
            .single();

        if (postError) {
            setErr("Failed to create post: " + error.message);
        }

        const { error: statsError } = await supabase
            .from("post_stats")
            .insert({
            post_id: post.id,
            profile_id: user.id,
            goings: 0,
            leafs: 0,
            recycles: 0,
        });

        setLoading(false);

        if (statsError) {
            console.error("post_stats insert error:", statsError);
            setErr(statsError.message);
            return;
        }

        alert("Post Created!");
        navigate("/homepage");
    };
 
    useEffect(() => {
        if (!user) {
            navigate("/login");
        }
    }, [user]);

    useEffect(() => {
        return () => {
            debouncedFetch.cancel();
        };
    }, [debouncedFetch]);

    //handle location received from map
    useEffect(() => {
        if (selectedLocation) {
            console.log("Location received from map:", selectedLocation);
            
            //set the address for display and DB
            setPostLocation(selectedLocation.address);
            setLocationQuery(selectedLocation.address);
            
            //store coordinates=
            setLocationCoords({
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude
            });
            
            //clear the search dropdown
            setLocations([]);
        }
    }, [selectedLocation]);

    return (
        <div>
            <div className="add-page-content">
                <h1>Add Post</h1>
                <p className="err-msg">{err}</p>
                <form onSubmit={handleUpload}>
                    <div>
                        <input 
                            type="text" 
                            placeholder="Title" 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)}
                        />
                        <input 
                            type="text" 
                            placeholder="Caption" 
                            value={caption} 
                            onChange={(e) => setCaption(e.target.value)}
                        />
                        
                        <br/>
                        <br/>

                        <div className="location-wrapper">
                            <input
                                type="text"
                                placeholder="Search address..."
                                value={locationQuery}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setLocationQuery(value);
                                    setPostLocation(value); // Update the actual location value
                                    debouncedFetch(value);
                                }}
                            />

                            {locations.length > 0 && (
                                <ul className="location-dropdown">
                                    {locations.map((place) => (
                                        <li
                                            key={place.place_id}
                                            onClick={() => {
                                                setPostLocation(place.display_name);
                                                setLocationQuery(place.display_name);
                                                setLocationCoords({
                                                    longitude: place.coordinates[0],
                                                    latitude: place.coordinates[1]
                                                });
                                                setLocations([]);
                                            }}
                                        >
                                            {place.display_name}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <button 
                                type="button"
                                onClick={() => navigate("/addpost/map")}
                                style={{marginTop: '10px'}}
                            >
                                📍 Choose from Map
                            </button>
                        </div>

                        {locationCoords && (
                            <div style={{marginTop: '5px', fontSize: '12px', color: '#666'}}>
                                📌 Coordinates: {locationCoords.latitude.toFixed(6)}, {locationCoords.longitude.toFixed(6)}
                            </div>
                        )}
                        
                        <br/>
                        <br/>
                        
                        <div>
                            <Select 
                                options={scaleOptions}
                                placeholder="Select scale..."
                                onChange={(selected) => {
                                    setScale(selected.value)
                                }}
                            />
                        </div>
                    </div>
                    
                    <input 
                        type="file" 
                        onChange={uploadImage} 
                        disabled={loading}
                    />
                    
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