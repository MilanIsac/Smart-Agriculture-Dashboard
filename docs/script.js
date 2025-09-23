const API_KEY = "8ba4c1fd40d3e08906cbe2e8fb570cd9";
const CITY = "Mumbai"; 

function updateTimeDate() {
    const now = new Date();
    const options = { weekday: 'long' };
    const dayName = now.toLocaleDateString('en-US', options);
    const dateStr = now.toLocaleDateString('en-GB'); // format: DD/MM/YYYY
    // const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const timeStr = now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' });

    // document.getElementById("date").innerHTML = `${dayName}`;
    // document.querySelectorAll("#date")[1].innerHTML = dateStr;
    document.getElementById("time").innerHTML = timeStr;

    document.getElementById("day").innerHTML = `${dayName}`;
    document.getElementById("full-date").innerHTML = dateStr;
    // document.getElementById("weather-condition").innerHTML = `🌤️ ${condition}, ${temp}°C`;
    // document.getElementById("wind-speed").innerHTML = `🌬️ Wind: ${windSpeed} m/s`;
    // document.getElementById("city").innerHTML = `${CITY}`;
}

document.addEventListener("DOMContentLoaded", () => {
    const motorButton = document.getElementById("motor-btn");

    motorButton.addEventListener("click", () => {
        const isOn = motorButton.textContent.trim() === "ON";
        if (isOn) {
            motorButton.textContent = "OFF";
            motorButton.style.backgroundColor = "red";
        } else {
            motorButton.textContent = "ON";
            motorButton.style.backgroundColor = "green";
        }
    });
});


function fetchWeather() {
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${API_KEY}&units=metric`)
        .then(response => response.json())
        .then(data => {
            const temp = data.main.temp;
            const windSpeed = data.wind.speed;
            const condition = data.weather[0].description;
            const location = data.name;

document.getElementById("weather-condition").innerHTML = `🌤️ ${condition}, ${temp}°C`;
document.getElementById("wind-speed").innerHTML = `🌬️ Wind: ${windSpeed} m/s`;


            // document.getElementById("weather").innerHTML = `🌤️ ${condition}, ${temp}°C`;
            // document.querySelectorAll("#weather")[1].innerHTML = `🌬️ Wind: ${windSpeed} m/s`;
        })
        .catch(error => {
            console.error("Weather fetch error:", error);
        });
}

function refreshDashboard() {
    updateTimeDate();
    fetchWeather();
}

function renderGraphs() {
    fetch('http://127.0.0.1:8000/graphs')
        .then(res => res.json())
        .then(graphs => {
            const ids = ["humidity-graph", "temperature-graph", "rain-graph", "soil-graph"];
            graphs.forEach((graphJSON, i) => {
                const parsed = JSON.parse(graphJSON);
                Plotly.newPlot(ids[i], parsed.data, parsed.layout, {responsive: true});
            });
        })
        .catch(err => console.error("Graph load error:", err));
}

document.getElementById("refresh-btn").addEventListener("click", () => {
    refreshDashboard();  // update weather/time
    renderGraphs();      // re-fetch graphs from Flask
});

// Auto-refresh every 10 minutes
setInterval(refreshDashboard, 600000);

// Initial call on page load
refreshDashboard();

// Initial call on page load
// refreshDashboard();
renderGraphs();  // ✅ Add this
