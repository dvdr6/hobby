<div align="center">
 
```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║    ☀️   S K Y C A S T  —  Weather App   ☀️               ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```
 
<img src="https://img.shields.io/badge/HTML5-Structure-7B2FBE?style=for-the-badge&logo=html5&logoColor=white"/>
<img src="https://img.shields.io/badge/CSS3-615%20lines-9B59B6?style=for-the-badge&logo=css3&logoColor=white"/>
<img src="https://img.shields.io/badge/JavaScript-Vanilla-A569BD?style=for-the-badge&logo=javascript&logoColor=white"/>
<img src="https://img.shields.io/badge/APIs-Open--Meteo%20%26%20Nominatim-6C3483?style=for-the-badge"/>
<img src="https://img.shields.io/badge/Zero-Dependencies-D7BDE2?style=for-the-badge"/>
 
<br/><br/>
 
> *Real-time weather, anywhere on Earth — no API key, no npm, no framework.*
> *Just three files and the open web.*
 
</div>
 
---
 
## 🌌 What is SkyCast?
 
**SkyCast** is a sleek, zero-dependency weather app built entirely with **Vanilla JavaScript**, **HTML5**, and **CSS3**. It pulls live weather data from two completely **free, open, and keyless APIs** — no registration required, no tokens to manage.
 
Type any city in the world. SkyCast finds it, fetches the sky above it, and renders everything beautifully — current conditions, a full stats grid, sunrise/sunset, and a 7-day forecast.
 
---
 
## 🔮 Live Features
 
| Feature | Details |
|---|---|
| 🔍 **City Search** | Powered by Nominatim (OpenStreetMap geocoding) |
| 💡 **Live Autocomplete** | Debounced suggestions dropdown as you type |
| 📍 **Auto-Location** | Detects your GPS position on page load |
| 🌡️ **Current Temperature** | Live from Open-Meteo with °C / °F toggle |
| 🤔 **Feels Like** | Apparent temperature displayed alongside real temp |
| ☀️ **UV Index** | With human-readable labels: Low → Extreme |
| 💧 **Humidity** | Relative humidity percentage |
| 💨 **Wind Speed** | In km/h |
| 👁️ **Visibility** | Converted from metres to km |
| 🔵 **Pressure** | Atmospheric pressure in hPa |
| 🌅 **Sunrise & Sunset** | Formatted in 12-hour AM/PM local time |
| 📆 **7-Day Forecast** | Daily high/low with weather icons and descriptions |
| ⏳ **Skeleton Loader** | Shimmer animation while data loads |
| ❌ **Error Handling** | Friendly messages for bad searches or connection issues |
| 📱 **Fully Responsive** | Custom breakpoints down to 380px screens |
 
---
 
## 🗂️ Project Structure
 
```
weather/
│
├── 📄 index.html       (145 lines)  — Full UI structure & semantic markup
├── 🎨 style.css        (615 lines)  — All design, layout, animation, responsiveness
├── ⚙️  app.js          (349 lines)  — All logic: APIs, state, DOM rendering
│
└── 📁 .github/
    └── workflows/                   — GitHub Actions CI/CD pipeline
```
 
> **Three files. One app. Two APIs. Zero dependencies.**
 
---
 
## 🧠 How It Works — The Full Data Flow
 
```
┌─────────────────────────────────────────────────────────┐
│                      USER TYPES A CITY                  │
└──────────────────────────┬──────────────────────────────┘
                           │  debounce (300ms)
                           ▼
              ┌────────────────────────┐
              │   Nominatim Geocoding  │  geocodeCity()
              │   (OpenStreetMap API)  │  → returns lat/lon + address
              └────────────┬───────────┘
                           │
                           ▼
           ┌───────────────────────────────┐
           │     Open-Meteo Forecast API   │  fetchWeather(lat, lon)
           │  current + daily (7 days)     │  → returns full JSON blob
           └───────────────┬───────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   renderWeather()      │  → populates all DOM elements
              │   renderForecast()     │  → builds 7-day forecast list
              │   updateTemperature()  │  → handles °C / °F live toggle
              └────────────────────────┘
```
 
### Auto-Location Flow
 
On page load, an **IIFE** (immediately invoked async function) fires:
 
```
Browser Geolocation API
        │
        ▼
Nominatim Reverse Geocode  →  city name extracted
        │
        ▼
fetchWeather(lat, lon)  →  renderWeather()
```
 
If geolocation is denied or times out after 5 seconds, the app silently falls through — no error thrown at the user.
 
---
 
## ⚙️ JavaScript Deep Dive (`app.js`)
 
### State Variables
 
```js
let currentTempC = null;      // Current temp stored in Celsius
let currentFeelsC = null;     // Feels like temp in Celsius
let forecastHighsC = [];      // 7-day highs array (Celsius)
let forecastLowsC = [];       // 7-day lows array (Celsius)
let isCelsius = true;         // Active unit toggle state
let debounceTimer = null;     // For autocomplete throttling
```
 
All temperatures are stored in Celsius internally. The `updateTemperatureDisplay()` function converts on the fly using `toF(c)` — no re-fetching needed on unit switch.
 
### WMO Weather Code Map
 
The app uses the **WMO (World Meteorological Organization)** standard numeric codes from Open-Meteo, mapped to human labels and emoji icons:
 
```js
const WMO_CODES = {
  0:  { label: 'Clear Sky',              icon: '☀️' },
  1:  { label: 'Mainly Clear',           icon: '🌤️' },
  2:  { label: 'Partly Cloudy',          icon: '⛅' },
  3:  { label: 'Overcast',              icon: '☁️' },
  45: { label: 'Foggy',                  icon: '🌫️' },
  51: { label: 'Light Drizzle',          icon: '🌦️' },
  61: { label: 'Light Rain',             icon: '🌧️' },
  71: { label: 'Light Snow',             icon: '🌨️' },
  95: { label: 'Thunderstorm',           icon: '⛈️' },
  // ... 20+ codes total
};
```
 
### Key Functions
 
| Function | What it does |
|---|---|
| `geocodeCity(query)` | Calls Nominatim, returns up to 5 place results with lat/lon |
| `fetchWeather(lat, lon)` | Calls Open-Meteo for current + 7-day daily forecast |
| `renderWeather(data, city, country)` | Populates every DOM element with live data |
| `renderForecast(daily)` | Dynamically creates 7 `.forecast-item` DOM elements |
| `updateTemperatureDisplay()` | Converts and re-renders all temps on unit toggle |
| `populateSuggestions(query)` | Debounced autocomplete dropdown builder |
| `search(query)` | Main orchestrator: geocode → weather → render |
| `formatTime(iso)` | Converts ISO datetime to 12-hour `h:mm AM/PM` format |
| `showSkeleton()` / `hideSkeleton()` | Manages the shimmer loading state |
| `showError(msg)` / `hideError()` | Controls the red error banner |
| `toF(c)` | Celsius to Fahrenheit: `(c * 9/5 + 32).toFixed(1)` |
 
### Debounced Autocomplete
 
```js
cityInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => populateSuggestions(val), 300);
});
```
 
The 300ms debounce prevents hammering the Nominatim API on every keystroke — smart and API-friendly.
 
### UV Index Intelligence
 
UV values are automatically interpreted into readable danger labels:
 
```
0–2   →  🟢 Low
3–5   →  🟡 Moderate
6–7   →  🟠 High
8–10  →  🔴 Very High
11+   →  🟣 Extreme
```
 
### Address Fallback Chain
 
When resolving a city name from the Nominatim response, the app cascades through fields gracefully:
 
```js
addr.city || addr.town || addr.village || addr.county || place.display_name.split(',')[0]
```
 
This ensures a result is always shown, even for rural coordinates.
 
---
 
## 🎨 Design Deep Dive (`style.css`)
 
### CSS Custom Properties — The Design Tokens
 
The entire visual identity is defined in `:root` variables, making the theme fully centralized:
 
```css
:root {
  --bg-start:       #0f0c29;                    /* Deep indigo */
  --bg-mid:         #302b63;                    /* Rich purple */
  --bg-end:         #24243e;                    /* Dark violet */
  --card-bg:        rgba(255, 255, 255, 0.07);  /* Glassmorphism base */
  --card-border:    rgba(255, 255, 255, 0.13);  /* Subtle glass edge */
  --text-primary:   #f0f4ff;                    /* Soft white */
  --text-secondary: rgba(240, 244, 255, 0.6);   /* Muted lavender */
  --accent:         #6c63ff;                    /* Electric violet */
  --accent-glow:    rgba(108, 99, 255, 0.4);    /* Purple glow */
  --gold:           #FFD166;                    /* Warm gold accent */
  --radius:         20px;
  --shadow:         0 8px 32px rgba(0, 0, 0, 0.35);
}
```
 
### The Background
 
A fixed three-stop diagonal gradient creates a deep cosmic atmosphere that never scrolls away:
 
```css
background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
background-attachment: fixed;
```
 
### Glassmorphism Cards
 
The weather card and autocomplete dropdown use the full glassmorphism treatment:
 
```css
.weather-card {
  background: rgba(255, 255, 255, 0.07);
  border: 1.5px solid rgba(255, 255, 255, 0.13);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
}
```
 
### Gradient Text
 
The logo name and the giant temperature reading use CSS clipping for a premium gradient-text effect:
 
```css
.logo-text, .temp-main {
  background: linear-gradient(135deg, #ffffff, var(--gold));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```
 
### Search Bar Focus Glow
 
The search bar lights up with a purple halo on focus:
 
```css
.search-bar:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 4px var(--accent-glow);
}
```
 
### Shimmer Skeleton Loader
 
A travelling light effect pulses across placeholder shapes while data loads:
 
```css
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.sk {
  background: linear-gradient(90deg,
    rgba(255,255,255,0.06) 25%,
    rgba(255,255,255,0.12) 50%,
    rgba(255,255,255,0.06) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
```
 
### Weather Card Entry Animation
 
The card fades up smoothly from below every time it appears:
 
```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
.weather-card { animation: fadeInUp 0.4s ease; }
```
 
### Stat Cards — 3-Column Grid
 
Six stat cards are laid out in a `3 × 2` responsive grid. Each one lifts and tints on hover:
 
```css
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.stat-card:hover {
  background: rgba(108, 99, 255, 0.12);
  transform: translateY(-2px);
}
```
 
### Responsive Breakpoints
 
| Breakpoint | Adjustments |
|---|---|
| `≤ 380px` | Smaller logo/icons, reduced font sizes, forecast descriptions hidden |
| `≥ 481px` | Extra top padding on app wrapper |
 
---
 
## 🌐 APIs Used — Completely Free & Keyless
 
### Open-Meteo
`https://api.open-meteo.com/v1/forecast`
 
No API key. No account. The app requests:
 
**Current fields:** `temperature_2m`, `apparent_temperature`, `relative_humidity_2m`, `weather_code`, `wind_speed_10m`, `pressure_msl`, `visibility`, `uv_index`, `is_day`
 
**Daily fields (7 days):** `weather_code`, `temperature_2m_max`, `temperature_2m_min`, `sunrise`, `sunset`
 
`timezone=auto` is passed so all times are local to the searched location automatically.
 
### Nominatim (OpenStreetMap)
- **Forward geocoding:** `nominatim.openstreetmap.org/search` — city name → lat/lon (up to 5 results)
- **Reverse geocoding:** `nominatim.openstreetmap.org/reverse` — lat/lon → city name (for auto-location)
 
Both endpoints are free, keyless, and require only an `Accept-Language: en` header.
 
---
 
## 🚀 Getting Started
 
```bash
# 1. Clone the repo
git clone https://github.com/dvdr6/weather.git
 
# 2. Enter the folder
cd weather
 
# 3. Open in your browser — that's literally it
open index.html
```
 
> No `npm install`. No `.env` file. No API key to paste anywhere.
> Open the HTML file and SkyCast works immediately.
 
---
 
## 📐 Language Breakdown
 
```
JavaScript  ████████████████░░░░░░░░░░░  38.3%  (349 lines)
CSS         ███████████████░░░░░░░░░░░░  36.0%  (615 lines)
HTML        ███████████░░░░░░░░░░░░░░░░  25.7%  (145 lines)
```
 
The near-equal JS/CSS split reflects a deliberate philosophy: **the visual layer is a first-class citizen**, not an afterthought.
 
---
 
## 💜 Design Philosophy
 
> *No API key. No npm. No framework. No build step.*
 
SkyCast is a statement that **the web platform itself is enough**. The browser gives you `fetch`, `geolocation`, the DOM, CSS animations, and `backdrop-filter`. That's all you need to build something real.
 
The deep indigo-to-violet background, the gold gradient temperature, the glassmorphic cards, the shimmer loaders — every pixel crafted in pure CSS, every interaction driven by vanilla JS, with zero external libraries.
 
---
 
## 🤝 Contributing
 
Ideas and pull requests are always welcome.
 
```bash
git checkout -b feature/your-idea
# make your changes
git push origin feature/your-idea
# open a Pull Request on GitHub
```
 
---
 
<div align="center">
 
Made with 💜 by **[@dvdr6](https://github.com/dvdr6)**
 
[![Repo](https://img.shields.io/badge/View%20Repository-dvdr6%2Fweather-7B2FBE?style=for-the-badge&logo=github)](https://github.com/dvdr6/weather)
 
*Powered by [Open-Meteo](https://open-meteo.com) & [Nominatim](https://nominatim.openstreetmap.org)*
 
</div>
