// Import React hooks and CSS
import React, { useEffect, useRef, useState } from "react"
import './Weather.css'

// Import all weather icons
import search_icon from '../assets/search.png'
import clear_icon from '../assets/clear.png'
import cloud_icon from '../assets/cloud.png'
import drizzle_icon from '../assets/drizzle.png'
import rain_icon from '../assets/rain.png'
import snow_icon from '../assets/snow.png'
import wind_icon from '../assets/wind.png'
import humidity_icon from '../assets/humidity.png'


const Weather = () => {
    
    // ====================================
    // 1. STATE VARIABLES (Data Storage)
    // ====================================
    
    // Reference to input field (to get the typed city name)
    const inputRef = useRef();
    
    // Store current weather data (temperature, humidity, etc.)
    const [weatherData, setWeatherData] = useState(false);
    
    // Store search history from database
    const [history, setHistory] = useState([]);
    
    // Control whether to show or hide history section
    const [showHistory, setShowHistory] = useState(false);

    
    // ====================================
    // 2. FETCH HISTORY FROM DATABASE
    // ====================================
    const fetchHistory = async () => {
        try {
            console.log('🔄 Loading history from database...');
            
            // Send GET request to PHP file
            const response = await fetch('http://localhost/get_weather_history.php', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            // Convert response to JSON format
            const result = await response.json();
            console.log('📊 History received:', result);
            
            // If request successful, update history state
            if (result.success) {
                setHistory(result.data); // Store history in state
                console.log('✅ Loaded', result.count, 'records successfully');
            } else {
                console.error('❌ Failed to load history:', result.message);
            }
        } catch (error) {
            console.error('❌ Error connecting to database:', error);
        }
    };

    
    // ====================================
    // 3. SAVE WEATHER DATA TO DATABASE
    // ====================================
    const saveToDatabase = async (weatherInfo) => {
        try {
            console.log('💾 Saving data to database:', weatherInfo);
            
            // Send POST request with weather data
            const response = await fetch('http://localhost/save_weather.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    humidity: weatherInfo.humidity.toString(),
                    location: weatherInfo.location,
                    temperature: weatherInfo.temperature.toString(),
                    windSpeed: weatherInfo.windSpeed.toString()
                })
            });

            // Get response from PHP
            const result = await response.json();
            console.log('💾 Database response:', result);
            
            // If save successful, refresh the history list
            if (result.success) {
                console.log('✅ Data saved successfully!');
                await fetchHistory(); // Reload history to show new entry
            } else {
                console.error('❌ Save failed:', result.message);
            }
        } catch (error) {
            console.error('❌ Database error:', error);
        }
    };

    
    // ====================================
    // 4. SEARCH WEATHER BY CITY NAME
    // ====================================
    const search = async (city, saveToDb = true) => {
        
        // Check if user entered a city name
        if (city === "") {
            alert("Please enter a city name!");
            return;
        }

        try {
            // Build API URL with city name and API key
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${import.meta.env.VITE_APP_ID}`;

            // Map API weather codes to our icon images
            const allIcons = {
                "01d": clear_icon,    // Clear day
                "01n": clear_icon,    // Clear night
                "02d": cloud_icon,    // Few clouds day
                "02n": cloud_icon,    // Few clouds night
                "03d": cloud_icon,    // Scattered clouds day
                "03n": cloud_icon,    // Scattered clouds night
                "04d": drizzle_icon,  // Broken clouds day
                "04n": drizzle_icon,  // Broken clouds night
                "09d": rain_icon,     // Shower rain day
                "09n": rain_icon,     // Shower rain night
                "10d": rain_icon,     // Rain day
                "10n": rain_icon,     // Rain night
                "13d": snow_icon,     // Snow day
                "13n": snow_icon,     // Snow night
            }

            // Call Weather API
            const response = await fetch(url);
            
            // Convert response to JavaScript object
            const data = await response.json();

            // If API returned an error (city not found, etc.)
            if (!response.ok) {
                alert(data.message);
                return;
            }

            console.log('🌤️ Weather data received:', data);
            
            // Get the correct icon based on weather code
            const icon = allIcons[data.weather[0].icon] || clear_icon;
            
            // Organize the weather information
            const weatherInfo = {
                humidity: data.main.humidity,              // Humidity percentage
                windSpeed: data.wind.speed,                // Wind speed in km/h
                temperature: Math.floor(data.main.temp),   // Temperature (rounded)
                location: data.name,                       // City name
                icon: icon                                 // Weather icon
            };

            // Update weather display with new data
            setWeatherData(weatherInfo);
            
            // Save to database only if saveToDb is true
            // (We pass false for initial London display)
            if (saveToDb) {
                await saveToDatabase(weatherInfo);
            }

        } catch (error) {
            setWeatherData(false);
            console.error("❌ Error fetching weather data:", error);
        }
    }

    
    // ====================================
    // 5. RUN ONCE WHEN PAGE LOADS
    // ====================================
    useEffect(() => {
        // Display London weather on startup (but don't save it)
        search("London", false);
        
        // Load search history from database
        fetchHistory();
    }, []) // Empty array means: run only once when component mounts

    
    // ====================================
    // 6. FORMAT DATE AND TIME
    // ====================================
    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        // Format: "Dec 12, 2024, 03:45 PM"
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    
    // ====================================
    // 7. RENDER UI (DISPLAY ON SCREEN)
    // ====================================
    return (
        <div className="weather">
            
            {/* ========== SEARCH BAR ========== */}
            <div className="search-bar">
                {/* Input field for typing city name */}
                <input 
                    ref={inputRef} 
                    type="text" 
                    placeholder="Search"
                />
                
                {/* Search button (magnifying glass icon) */}
                <img 
                    src={search_icon} 
                    alt="Search" 
                    onClick={() => search(inputRef.current.value)}
                />
            </div>

            
            {/* ========== CURRENT WEATHER DISPLAY ========== */}
            {/* Only show if weatherData exists */}
            {weatherData ? (
                <>
                    {/* Weather icon (sun, cloud, rain, etc.) */}
                    <img src={weatherData.icon} alt="Weather icon" className="weather-icon"/>
                    
                    {/* Temperature in Celsius */}
                    <p className="temperature">{weatherData.temperature}°c</p>
                    
                    {/* City name */}
                    <p className="location">{weatherData.location}</p>
                    
                    {/* Humidity and Wind Speed */}
                    <div className="weather-data">
                        {/* Humidity column */}
                        <div className="col">
                            <img src={humidity_icon} alt="Humidity" />
                            <div>
                                <p>{weatherData.humidity} %</p>
                                <span>Humidity</span>
                            </div>
                        </div>
                        
                        {/* Wind Speed column */}
                        <div className="col">
                            <img src={wind_icon} alt="Wind" />
                            <div>
                                <p>{weatherData.windSpeed} Km/h</p>
                                <span>Wind Speed</span>
                            </div>
                        </div>
                    </div>
                </>
            ) : null}

            
            {/* ========== HISTORY TOGGLE BUTTON ========== */}
            <button 
                className="history-toggle-btn"
                onClick={() => {
                    console.log('🔘 History button clicked!');
                    setShowHistory(!showHistory); // Toggle between true/false
                }}
            >
                {/* Button text changes based on showHistory state */}
                {showHistory ? '❌ Hide History' : '📜 Show History'}
            </button>

            
            {/* ========== SEARCH HISTORY SECTION ========== */}
            {/* Only show if showHistory is true */}
            {showHistory && (
                <div className="history-box">
                    <h3>🕐 Search History</h3>
                    
                    {/* Check if history has any records */}
                    {history.length > 0 ? (
                        <div className="history-list">
                            {/* Loop through each history record */}
                            {history.map((item) => (
                                <div key={item.id} className="history-card">
                                    
                                    {/* City name */}
                                    <p className="city-name">📍 {item.location}</p>
                                    
                                    {/* Date and time */}
                                    <p className="date-time">{formatDateTime(item.time_search)}</p>
                                    
                                    {/* Weather details in one line */}
                                    <p className="weather-info">
                                        🌡️ {item.temperature}°C | 💧 {item.humidity}% | 💨 {item.windSpeed} Km/h
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        // Show this message if no history available
                        <p className="no-history">No search history available yet 📭</p>
                    )}
                </div>
            )}
        </div>
    )
}

export default Weather;