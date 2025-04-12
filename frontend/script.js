const apiKey = "9391f01f4329c46e74168bcf40180187";
const city = "Ahmedabad";

document.addEventListener("DOMContentLoaded", () => {
    const motorSwitch = document.querySelector(".motor-switch");

    motorSwitch.addEventListener("click", () => {
        const isOn = motorSwitch.textContent === "ON";

        if (isOn) {
            motorSwitch.textContent = "OFF";
            motorSwitch.style.backgroundColor = "red";
        } else {
            motorSwitch.textContent = "ON";
            motorSwitch.style.backgroundColor = "green";
        }
    });
});

function updateDateTime() {
    const date = new Date();

    const currDay = date.toLocaleDateString("en-US", { weekday: "long" });
    const currTime = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const currDate = date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

    document.querySelector(".date").textContent = currDate;
    document.querySelector(".day").textContent = currDay;
    document.querySelector(".time").textContent = currTime;
}
updateDateTime();
setInterval(updateDateTime, 1000);

// function get_weather_data(){
//     fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`)
//     .then(response => response.json())
//     .then(data => {
//         const weather = data.weather[0].description;
//         const temperature = data.main.temp;
//         const wind_speed = data.wind.speed;

//         document.querySelector(".weather-type").textContent = `Weather: ${weather}`;
//         document.querySelector(".temp").textContent = `Temperature: ${temperature}°C`;
//         document.querySelector(".wind").textContent = `Wind Speed: ${wind_speed} m/s`;
//     })
//     .catch(error => {
//         console.error("Error fetching weather data:", error);
//     });
// }

// setInterval(get_weather_data, 60000);
// get_weather_data();

function loadPlotly() {
    return new Promise((resolve, reject) => {
        if (window.Plotly) {
            resolve();
        } else {
            const script = document.createElement("script");
            script.src = "https://cdn.plot.ly/plotly-latest.min.js";
            script.onload = resolve;
            script.onerror = () => reject(new Error("Failed to load Plotly from CDN"));
            document.head.appendChild(script);
        }
    });
}

document.getElementById("btn-update-info").addEventListener("click", () => {
    loadPlotly()
        .then(() => {
            return fetch("http://127.0.0.1:8000/graphs", {
                mode: 'cors'
            });
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
            }
            return response.text().then(text => {
                console.log("Raw response:", text.substring(0, 500) + (text.length > 500 ? "..." : ""));
                try {
                    return JSON.parse(text);
                } catch (e) {
                    throw new Error(`Invalid JSON: ${e.message} - Received: ${text.substring(0, 100)}...`);
                }
            });
        })
        .then(data => {
            console.log("JSON received:", JSON.stringify(data, null, 2).substring(0, 500) + (JSON.stringify(data).length > 500 ? "..." : ""));
            const graphDisplay = document.getElementById("graph-display");
            graphDisplay.innerHTML = ""; // Clear previous content
            if (Array.isArray(data) && data.length > 0) {
                if (window.Plotly) {
                    data.forEach((config, index) => {
                        const div = document.createElement("div");
                        div.className = "plotly-graph-div";
                        graphDisplay.appendChild(div);
                        try {
                            const parsedConfig = JSON.parse(config);
                            // Update layout to match CSS dimensions
                            const containerWidth = div.clientWidth;
                            parsedConfig.layout.width = containerWidth;
                            parsedConfig.layout.height = 180;
                            parsedConfig.layout,margin = {
                                t: 40,
                                b: 40,
                                l: 40,
                                r: 40
                            }
                            Plotly.newPlot(div, parsedConfig.data, parsedConfig.layout);
                            console.log(`Plotly graph rendered for index ${index}`);
                        } catch (e) {
                            console.error(`Error parsing config for index ${index}:`, e);
                            div.innerHTML = `<p>Error rendering graph: ${e.message}</p>`;
                        }
                    });
                } else {
                    console.warn("Plotly still not loaded after dynamic load");
                    graphDisplay.innerHTML = `<h1>Plotly failed to load dynamically. Check network or CDN.</h1>`;
                }
            } else if (data.error) {
                graphDisplay.innerHTML = `<h1>${data.error}</h1>`;
            } else {
                graphDisplay.innerHTML = `<h1>Invalid data format</h1>`;
            }
        })
        .catch(error => {
            console.error("Fetch or load error:", error);
            fetch("http://127.0.0.1:8000/graphs")
                .then(resp => resp.text())
                .then(text => console.log("Debug raw response:", text.substring(0, 500) + (text.length > 500 ? "..." : "")))
                .catch(debugErr => console.error("Debug fetch error:", debugErr));
            document.getElementById("graph-display").innerHTML = `<h1>Error loading graphs: ${error.message}</h1>`;
        });
});