import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Map, { NavigationControl, Marker } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import "./Map.css";
import { useAuth } from "../context/AuthContext";

const LocationMap = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const mapKey = import.meta.env.VITE_MAPTILER_TOKEN;

  // Default to Vienna, Austria
  const [longitude, setLongitude] = useState(16.3725);
  const [latitude, setLatitude] = useState(48.2084);
  const [loading, setLoading] = useState(true);
  
  // Store the selected location data (address + coordinates)
  const [selectedLocationData, setSelectedLocationData] = useState(null);

  const getLocation = async (lnglat) => {
    const { lng, lat } = lnglat;

    try {
      const response = await fetch(
        `https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${mapKey}&limit=1`
      );

      const data = await response.json();
      const closestPlace = data.features?.[0]?.place_name || "Unknown location";

      const confirmed = window.confirm(
        `Closest location: ${closestPlace}\n\nLongitude: ${lng.toFixed(6)}\nLatitude: ${lat.toFixed(6)}\n\nDo you want to select this location?`
      );

      if (confirmed) {
        // Store both address and coordinates
        setSelectedLocationData({
          address: closestPlace,
          latitude: lat,
          longitude: lng
        });
        setLatitude(lat);
        setLongitude(lng);
        console.log("Location selected:", { closestPlace, lat, lng });
      } else {
        console.log("User canceled selection");
      }
    } catch (err) {
      console.error("Reverse geocoding error:", err);
      alert(`Error: Could not determine location at this point.`);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Get user's location once when component mounts
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          setLatitude(lat);
          setLongitude(lon);
          setLoading(false);
          
          console.log("User location - Latitude:", lat, "Longitude:", lon);
        },
        (error) => {
          console.error("Geolocation error:", error.message);
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      console.log("Geolocation is not supported by this browser.");
      setLoading(false);
    }
  }, [user, navigate]);

  const handleDone = () => {
    if (selectedLocationData) {
      // Navigate back to AddPost with the selected location
      navigate("/addpost", { 
        state: { selectedLocation: selectedLocationData } 
      });
    } else {
      alert("Please select a location on the map first");
    }
  };

  if (loading) {
    return (
      <div className="add-page-content">
        <h1>Select Location</h1>
        <p>Loading map...</p>
      </div>
    );
  }

  return (
    <div className="add-page-content">
      <p className="select-title">Select Location</p>
      <p style={{marginBottom: '10px', color: '#666'}}>
        Click anywhere on the map to select a location
      </p>

      <div className="map-container">
        <Map
          mapLib={maplibregl}
          initialViewState={{
            longitude: longitude,
            latitude: latitude,
            zoom: 12
          }}
          className="map"
          mapStyle={`https://api.maptiler.com/maps/dataviz-v4/style.json?key=${mapKey}`}
          onClick={(e) => {
            const { lngLat } = e;
            getLocation(lngLat);
          }}
        >
          <NavigationControl position="top-right" />

          {selectedLocationData && (
            <Marker
              longitude={selectedLocationData.longitude}
              latitude={selectedLocationData.latitude}
              color="red"
            />
          )}

          
        </Map>

        {selectedLocationData && (
          <div style={{marginTop: '10px', padding: '10px', background: '#f0f0f0', borderRadius: '4px'}}>
            <strong>Selected:</strong> {selectedLocationData.address}
          </div>
        )}

        <button
          onClick={handleDone}
          className="done-button"
        >
          Done
        </button>

      </div>
    </div>
  );
};

export default LocationMap;