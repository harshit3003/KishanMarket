import React, { useState, useEffect } from 'react';
import axios from 'axios';

const WeatherDashboard = ({ locationKey }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  // Default coordinates (Delhi) as fallback
  const defaultLat = 28.6139;
  const defaultLon = 77.2090;

  useEffect(() => {
    const fetchWeather = async (lat, lon) => {
      try {
        // Open-Meteo API for real-time weather and forecast (No API Key Required!)
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
        const response = await axios.get(url);
        
        setWeather({
          current: response.data.current_weather,
          daily: response.data.daily
        });
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch weather data", err);
        setLoading(false);
      }
    };

    // Try to get user's saved location first
    const userStr = localStorage.getItem('currentUser');
    let initLoc = null;
    if (userStr) {
      const parsedUser = JSON.parse(userStr);
      if (parsedUser.location) initLoc = parsedUser.location;
    }

    if (locationKey) {
      fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationKey)}&count=1`)
        .then(res => res.json())
        .then(geoData => {
          if (geoData.results && geoData.results.length > 0) {
            fetchWeather(geoData.results[0].latitude, geoData.results[0].longitude);
          } else {
            fallbackGeo();
          }
        })
        .catch(() => fallbackGeo());
    } else if (initLoc) {
      fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(initLoc)}&count=1`)
        .then(res => res.json())
        .then(geoData => {
          if (geoData.results && geoData.results.length > 0) {
            fetchWeather(geoData.results[0].latitude, geoData.results[0].longitude);
          } else {
            fallbackGeo();
          }
        })
        .catch(() => fallbackGeo());
    } else {
      fallbackGeo();
    }

    function fallbackGeo() {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            fetchWeather(position.coords.latitude, position.coords.longitude);
          },
          (error) => {
            console.log("Geolocation denied or failed, using default location");
            fetchWeather(defaultLat, defaultLon);
          }
        );
      } else {
        fetchWeather(defaultLat, defaultLon);
      }
    }
  }, [locationKey]);

  if (loading) {
    return (
      <div className="glass-card-premium p-4 h-100 text-center d-flex align-items-center justify-content-center" style={{ transformStyle: 'preserve-3d' }}>
        <div className="spinner-border text-success" role="status"></div>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="glass-card-premium p-4 h-100" style={{ transformStyle: 'preserve-3d', background: 'linear-gradient(135deg, #e0f2fe, #bae6fd)' }}>
      <h5 className="section-title text-primary" style={{ transform: 'translateZ(30px)', borderColor: '#0ea5e9', color: '#0369a1' }}>
        <i className="fas fa-cloud-sun me-2"></i> Live Weather & Forecast
      </h5>
      
      <div className="text-center mt-4" style={{ transform: 'translateZ(25px)' }}>
        <h1 className="fw-bold m-0" style={{ fontSize: '3rem', color: '#0c4a6e' }}>{weather.current.temperature}°C</h1>
        <p className="fw-bold mt-1" style={{ color: '#0369a1' }}>Wind: {weather.current.windspeed} km/h</p>
      </div>

      <div className="mt-4 border-top pt-3" style={{ borderColor: '#7dd3fc', transform: 'translateZ(20px)' }}>
        <h6 className="fw-bold mb-3" style={{ color: '#0284c7' }}>5-Day Farm Forecast</h6>
        <div className="d-flex justify-content-between">
          {weather.daily.time.slice(1, 6).map((day, idx) => {
            const date = new Date(day).toLocaleDateString('en-US', { weekday: 'short' });
            const rain = weather.daily.precipitation_sum[idx + 1];
            return (
              <div key={idx} className="text-center p-2 rounded" style={{ background: 'rgba(255,255,255,0.4)' }}>
                <small className="d-block fw-bold" style={{ color: '#0369a1' }}>{date}</small>
                <div className="my-2 text-primary">
                  {rain > 5 ? <i className="fas fa-cloud-showers-heavy"></i> : rain > 0 ? <i className="fas fa-cloud-rain"></i> : <i className="fas fa-sun text-warning"></i>}
                </div>
                <small className="d-block fw-bold text-dark">{Math.round(weather.daily.temperature_2m_max[idx + 1])}°</small>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeatherDashboard;
