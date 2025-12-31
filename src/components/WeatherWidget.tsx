"use client";

import React, { useState, useEffect } from "react";
import { Cloud, CloudRain, CloudSnow, Sun, Wind, CloudLightning, Loader2 } from "lucide-react";

interface WeatherData {
  temp: number;
  location: string;
  icon: string;
  description: string;
}

interface WeatherWidgetProps {
  variant?: "compact" | "full";
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ variant = "compact" }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        // Using Open-Meteo API (free, no API key required)
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&temperature_unit=fahrenheit&timezone=auto`
        );
        const data = await response.json();

        // Get location name using reverse geocoding
        const geoResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
        );
        const geoData = await geoResponse.json();
        const city = geoData.address?.city || geoData.address?.town || geoData.address?.village || "Unknown";
        const state = geoData.address?.state || "";
        const stateAbbr = getStateAbbreviation(state);

        // Map weather code to icon
        const weatherCode = data.current?.weather_code || 0;
        const icon = mapWeatherCodeToIcon(weatherCode);
        const description = mapWeatherCodeToDescription(weatherCode);

        setWeather({
          temp: Math.round(data.current?.temperature_2m || 0),
          location: `${city}, ${stateAbbr}`,
          icon,
          description,
        });
        setLoading(false);
      } catch (err) {
        console.error("Weather fetch error:", err);
        // Fallback to default
        setWeather({
          temp: 68,
          location: "Asheville, NC",
          icon: "cloud",
          description: "Partly Cloudy",
        });
        setLoading(false);
      }
    };

    // Try to get user's location
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        () => {
          // Fallback to Asheville, NC if geolocation denied
          fetchWeather(35.5951, -82.5515);
        },
        { timeout: 5000 }
      );
    } else {
      // Fallback to Asheville, NC
      fetchWeather(35.5951, -82.5515);
    }
  }, []);

  const getStateAbbreviation = (state: string): string => {
    const stateMap: Record<string, string> = {
      "North Carolina": "NC",
      "South Carolina": "SC",
      "Virginia": "VA",
      "Tennessee": "TN",
      "Georgia": "GA",
      "Florida": "FL",
      "New York": "NY",
      "California": "CA",
      "Texas": "TX",
    };
    return stateMap[state] || state.substring(0, 2).toUpperCase();
  };

  const mapWeatherCodeToIcon = (code: number): string => {
    if (code === 0) return "sun";
    if (code <= 3) return "cloud";
    if (code >= 45 && code <= 48) return "cloud";
    if (code >= 51 && code <= 67) return "rain";
    if (code >= 71 && code <= 77) return "snow";
    if (code >= 80 && code <= 82) return "rain";
    if (code >= 85 && code <= 86) return "snow";
    if (code >= 95 && code <= 99) return "thunder";
    return "cloud";
  };

  const mapWeatherCodeToDescription = (code: number): string => {
    if (code === 0) return "Clear";
    if (code <= 3) return "Partly Cloudy";
    if (code >= 45 && code <= 48) return "Foggy";
    if (code >= 51 && code <= 55) return "Drizzle";
    if (code >= 56 && code <= 67) return "Rain";
    if (code >= 71 && code <= 77) return "Snow";
    if (code >= 80 && code <= 82) return "Showers";
    if (code >= 85 && code <= 86) return "Snow Showers";
    if (code >= 95 && code <= 99) return "Thunderstorm";
    return "Cloudy";
  };

  const renderIcon = (size: number = 14) => {
    const iconProps = { size, className: variant === "full" ? "" : "mr-1.5" };
    if (!weather) return <Cloud {...iconProps} />;

    switch (weather.icon) {
      case "rain":
        return <CloudRain {...iconProps} />;
      case "snow":
        return <CloudSnow {...iconProps} />;
      case "wind":
        return <Wind {...iconProps} />;
      case "sun":
        return <Sun {...iconProps} className={`${iconProps.className} text-yellow-400`} />;
      case "thunder":
        return <CloudLightning {...iconProps} />;
      default:
        return <Cloud {...iconProps} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center text-gray-400">
        <Loader2 size={14} className="mr-1.5 animate-spin" />
        <span className="text-xs">Loading...</span>
      </div>
    );
  }

  if (variant === "full") {
    return (
      <div className="relative flex items-center justify-between h-[90px] px-5 text-white rounded-xl shadow-lg min-w-[300px] overflow-hidden">
        {/* Sky gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-400 via-sky-500 to-blue-600" />

        {/* Mountain silhouette */}
        <svg
          className="absolute bottom-0 left-0 right-0 h-[45px] text-slate-700/30"
          viewBox="0 0 300 45"
          preserveAspectRatio="none"
        >
          <path
            fill="currentColor"
            d="M0,45 L0,35 L30,20 L60,30 L90,15 L120,25 L150,10 L180,22 L210,12 L240,28 L270,18 L300,30 L300,45 Z"
          />
        </svg>
        <svg
          className="absolute bottom-0 left-0 right-0 h-[30px] text-slate-800/40"
          viewBox="0 0 300 30"
          preserveAspectRatio="none"
        >
          <path
            fill="currentColor"
            d="M0,30 L0,25 L40,15 L80,22 L120,10 L160,18 L200,8 L240,20 L280,12 L300,20 L300,30 Z"
          />
        </svg>

        {/* Content */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="text-white drop-shadow-lg">{renderIcon(48)}</div>
          <div>
            <div className="text-3xl font-bold leading-none drop-shadow-md">{weather?.temp}°F</div>
            <div className="text-xs text-white/90 mt-0.5 drop-shadow">{weather?.description}</div>
          </div>
        </div>

        {/* Location */}
        <div className="relative z-10 text-right">
          <div className="text-sm font-semibold drop-shadow">{weather?.location}</div>
          <div className="text-[10px] text-white/80">Local Weather</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center text-amber-400 font-bold">
      {renderIcon()}
      <span>
        {weather?.location} {weather?.temp}°F
      </span>
    </div>
  );
};

export default WeatherWidget;
