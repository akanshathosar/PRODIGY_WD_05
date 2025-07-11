const API_KEY = "046a40b438d84805cd2f93176b799b43";

const locationElem = document.getElementById("location");
const tempElem = document.getElementById("temperature");
const descElem = document.getElementById("description");
const detailsElem = document.getElementById("weatherDetails");
const sunElem = document.getElementById("weatherSun");
const pastDaysContainer = document.getElementById("pastDaysContainer");

// 🔍 Search by City
document.getElementById("search-btn").addEventListener("click", () => {
  const city = document.getElementById("city-input").value;
  getWeather(city);
});

// 📍 Use My Location
document.getElementById("locateMe").addEventListener("click", () => {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        await fetchWeatherDirectly(lat, lon);
      },
      (error) => {
        console.error("Geolocation error:", error.message);
        alert("Location access denied or unavailable.");
      }
    );
  } else {
    alert("Geolocation is not supported by your browser.");
  }
});

// 🌍 Weather by City Name
async function getWeather(city) {
  try {
    const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`);
    const geoData = await geoRes.json();
    if (!geoData[0]) throw new Error("City not found");
    const { lat, lon, name } = geoData[0];

    locationElem.textContent = name;
    await fetchCurrent(lat, lon);
    fetchHourly(lat, lon);
    fetchWeekly(lat, lon);
    fetchPast(lat, lon);
  } catch (err) {
    locationElem.textContent = "City not found!";
    console.error(err);
  }
}

// 🌐 Weather by Coordinates
async function fetchWeatherDirectly(lat, lon) {
  try {
    const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`);
    const geoData = await geoRes.json();
    const city = geoData[0]?.name || `Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)}`;

    locationElem.textContent = `📍 ${city}`;
    await fetchCurrent(lat, lon);
    fetchHourly(lat, lon);
    fetchWeekly(lat, lon);
    fetchPast(lat, lon);
  } catch (err) {
    console.error("fetchWeatherDirectly error:", err);
    alert("Could not fetch weather from coordinates.");
  }
}

// 📦 Fetch Current Weather
async function fetchCurrent(lat, lon) {
  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
    const data = await res.json();

    const iconMap = {
      "Clear": "clear.svg",
      "Clouds": "cloudy.svg",
      "Rain": "rainy.svg",
      "Snow": "snowy.svg",
      "Thunderstorm": "storm.svg",
      "Drizzle": "drizzle.svg",
      "Mist": "mist.svg",
      "Smoke": "smoke.svg",
      "Haze": "haze.svg",
      "Dust": "dust.svg",
      "Fog": "fog.svg",
      "Sand": "sand.svg",
      "Ash": "ash.svg",
      "Tornado": "tornado.svg"
    };

    const weatherMain = data.weather[0].main;
    document.getElementById("weatherIcon").src = `icons/${iconMap[weatherMain] || "clear.svg"}`;

    const temp = Math.round(data.main.temp);
    tempElem.textContent = `${temp}°`;

    const feelsLike = Math.round(data.main.feels_like);
    const humidity = data.main.humidity;
    const pressure = data.main.pressure;
    const sunriseTime = new Date(data.sys.sunrise * 1000).toLocaleTimeString();
    const sunsetTime = new Date(data.sys.sunset * 1000).toLocaleTimeString();

    const weatherType = data.weather[0].description;
    descElem.innerHTML = `${weatherType}<br><small>High: ${Math.round(data.main.temp_max)}° | Low: ${Math.round(data.main.temp_min)}°</small>`;

    detailsElem.innerHTML = `
      <small>
        💧 <span class="label">Humidity:</span> <strong class="humidity">${humidity}%</strong> |
        🌡️ <span class="label">Feels Like:</span> <strong class="feelslike">${feelsLike}°</strong> |
        🧭 <span class="label">Pressure:</span> <strong class="pressure">${pressure} hPa</strong> |
      </small>`;

    sunElem.innerHTML = `
      <small>
        🌅 <span class="label">Sunrise:</span> <strong class="sunrise">${sunriseTime}</strong> |
        🌇 <span class="label">Sunset:</span> <strong class="sunset">${sunsetTime}</strong>
      </small>`;

    const windSpeed = data.wind.speed;
    const windDeg = data.wind.deg;
    const dir = degToCompass(windDeg);
    document.getElementById("windText").textContent = `💨 Wind: ${windSpeed} km/h from ${dir}`;

    const needle = document.getElementById("needle");
    if (needle) needle.style.transform = `rotate(${windDeg}deg)`;

    // ✅ Custom day/night logic: 6 AM – 6 PM is Day
    const localTimeInSeconds = data.dt + data.timezone;
    const localDate = new Date(localTimeInSeconds * 1000);
    const localHour = localDate.getUTCHours();

    const bgVideo = document.getElementById("backgroundVideo");

    if (localHour >= 6 && localHour < 18) {
      document.body.classList.add("day");
      document.body.classList.remove("night");
      if (bgVideo && !bgVideo.src.includes("day.mp4")) {
        bgVideo.src = "day.mp4";
        bgVideo.load();
        bgVideo.play();
      }
    } else {
      document.body.classList.add("night");
      document.body.classList.remove("day");
      if (bgVideo && !bgVideo.src.includes("night.mp4")) {
        bgVideo.src = "night.mp4";
        bgVideo.load();
        bgVideo.play();
      }
    }
  } catch (err) {
    console.error("Error in fetchCurrent:", err);
  }
}

function degToCompass(deg) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

// 🕒 Hourly Forecast
async function fetchHourly(lat, lon) {
  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
    const data = await res.json();
    const hourlyForecast = document.getElementById('hourlyForecast');
    hourlyForecast.innerHTML = "";

    const now = new Date();
    let count = 0;

    for (let item of data.list) {
      const time = new Date(item.dt * 1000);
      if (time > now && count < 6) {
        const hour = time.getHours();
        const icon = item.weather[0].icon;
        const temp = Math.round(item.main.temp);
        hourlyForecast.innerHTML += `
          <div>
            <p><strong>${hour}:00</strong></p>
            <img src="https://openweathermap.org/img/wn/${icon}.png" width="40">
            <p>${temp}°</p>
          </div>
        `;
        count++;
      }
    }
  } catch (err) {
    console.error("fetchHourly error:", err);
  }
}

// 📆 Weekly Forecast
async function fetchWeekly(lat, lon) {
  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
    const data = await res.json();
    const weeklyForecast = document.getElementById('weeklyForecast');
    weeklyForecast.innerHTML = "";

    const dailyMap = {};

    for (let entry of data.list) {
      const [date, time] = entry.dt_txt.split(" ");
      if (time === "12:00:00" && !dailyMap[date]) {
        dailyMap[date] = entry;
      }
    }

    const today = new Date().toISOString().split("T")[0];
    const days = Object.keys(dailyMap).filter(d => d !== today).slice(0, 5);

    days.forEach(date => {
      const forecast = dailyMap[date];
      const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
      const icon = forecast.weather[0].icon;
      const min = Math.round(forecast.main.temp_min);
      const max = Math.round(forecast.main.temp_max);

      weeklyForecast.innerHTML += `
        <div class="weather-day">
          <p><strong>${dayName}</strong></p>
          <img src="https://openweathermap.org/img/wn/${icon}.png" width="40">
          <p>${min}° / ${max}°</p>
        </div>
      `;
    });
  } catch (err) {
    console.error("fetchWeekly error:", err);
  }
}

// ⏪ Past 3 Days
async function fetchPast(lat, lon) {
  try {
    const container = document.getElementById("pastDaysContainer");
    container.innerHTML = "";

    const today = new Date();
    const days = [];

    for (let i = 1; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const isoDate = date.toISOString().split("T")[0];
      days.push({ dateObj: date, dateStr: isoDate });
    }

    for (let { dateObj, dateStr } of days) {
      const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${dateStr}&end_date=${dateStr}&hourly=temperature_2m,weathercode&timezone=auto`;
      const res = await fetch(url);
      const data = await res.json();

      const temps = data.hourly.temperature_2m;
      const codes = data.hourly.weathercode;

      if (!temps || !codes || temps.length === 0) continue;

      const avgTemp = Math.round(temps.reduce((a, b) => a + b, 0) / temps.length);
      const icon = getWeatherIconFromCode(codes[12] ?? codes[0]);
      const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

      container.innerHTML += `
        <div>
          <p><strong>${weekday}</strong></p>
          <img src="${icon}" width="40" />
          <p>${avgTemp}°</p>
        </div>
      `;
    }
  } catch (err) {
    console.error("fetchPast error:", err);
  }
}

function getWeatherIconFromCode(code) {
  const map = {
    0: "icons/clear.svg",
    1: "icons/clear.svg",
    2: "icons/cloudy.svg",
    3: "icons/cloudy.svg",
    45: "icons/fog.svg",
    48: "icons/fog.svg",
    51: "icons/drizzle.svg",
    53: "icons/drizzle.svg",
    55: "icons/drizzle.svg",
    61: "icons/rainy.svg",
    63: "icons/rainy.svg",
    65: "icons/rainy.svg",
    71: "icons/snowy.svg",
    73: "icons/snowy.svg",
    75: "icons/snowy.svg",
    80: "icons/rainy.svg",
    81: "icons/rainy.svg",
    82: "icons/storm.svg",
    95: "icons/storm.svg"
  };
  return map[code] || "icons/clear.svg";
}
