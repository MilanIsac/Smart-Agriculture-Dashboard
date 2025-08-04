from flask import Flask, jsonify
from flask_cors import CORS
import plotly.graph_objects as go
import logging
from datetime import datetime
from data import run_aws_find

new_data = run_aws_find()
# print(new_data[1])
# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
# CORS(app, resources={r"/graphs": {"origins": "http://127.0.0.1:5500"}})
CORS(app)  # or: CORS(app, resources={r"/*": {"origins": "*"}})



def get_sensor_data():
    try:
        sample_data = {
            "timestamps": new_data[:,5].tolist(),
            "humidity": new_data[:,1].tolist(),
            "temperature": new_data[:,0].tolist(),
            "rain": new_data[:,2].tolist(),
            "soil_moisture": new_data[:,4].tolist(),
            "day_night": new_data[:,4].tolist()
        }
        items = [
            {
                "timestamp": {"S": timestamp},
                "humidity": {"N": str(value)},
                "temperature": {"N": str(value_t)},
                "rain": {"N": str(value_r)},
                "soil_moisture": {"N": str(value_s)}
            }
            for timestamp, value, value_t, value_r, value_s in zip(
                sample_data["timestamps"],
                sample_data["humidity"],
                sample_data["temperature"],
                sample_data["rain"],
                sample_data["soil_moisture"]
            )
        ]
        
        timestamps = [item['timestamp']['S'] for item in items]
        humidity = [float(item['humidity']['N']) for item in items]
        temperature = [float(item['temperature']['N']) for item in items]
        rain = [float(item['rain']['N']) for item in items]
        soil_moisture = [float(item['soil_moisture']['N']) for item in items]
        
        logger.info(f"Retrieved data: {len(timestamps)} timestamps")
        return timestamps, humidity, temperature, rain, soil_moisture
    except Exception as e:
        logger.error(f"Error processing sample data: {e}")
        return [], [], [], [], []

def generate_plotly_config(x_data, y_data, title):
    try:
        if not x_data or not y_data:
            raise ValueError("Empty data provided for graph generation")
        
        # fig = go.Figure(data=go.Scatter(x=x_data, y=y_data, mode='lines+markers', line=dict(width=2,), marker=dict(size=16)))
        
        
        fig = go.Figure(data=go.Scatter(
            x=x_data,
            y=y_data,
            mode='lines+markers',
            line=dict(width=2, color="#00a000"),
            marker=dict(size=8, color="#003000")
        ))

        fig.update_layout(
            # xaxis_title="Timestamp",
            # yaxis_title=title.split()[0],
            font=dict(size=10),
            margin=dict(l=30, r=10, t=10, b=30),
            plot_bgcolor='#efffdf',
            paper_bgcolor='#effddf',
            xaxis=dict(gridcolor='lightgray'),
            yaxis=dict(gridcolor='lightgray')
        )

        
        
        # fig.update_layout(
        #     # title=title,
        #     xaxis_title="Timestamp",
        #     yaxis_title=title.split()[0],
        #     font=dict(size=10),
        #     title_font_size=18,
        #     # width=80,  # Increased width
        #     # height=30,  # Reduced height
        #     margin=dict(l=40, r=10, t=40, b=10),
        #     # padding=dict(l=10, r=10, t=30, b=90),
        #     plot_bgcolor='#efffdf',
        #     paper_bgcolor='#efffdf',
        #     xaxis=dict(gridcolor='lightgray', gridwidth=1),
        #     yaxis=dict(gridcolor='lightgray', gridwidth=1)
        # )
        config = fig.to_json()
        logger.info(f"Generated {title} graph configuration successfully")
        return config
    except Exception as e:
        logger.error(f"Error generating {title} graph configuration: {e}")
        return None

@app.route('/graphs', methods=['GET'])
def get_graphs():
    logger.info("Received request for /graphs")
    timestamps, humidity, temperature, rain, soil_moisture = get_sensor_data()
    
    if not timestamps:
        logger.error("No data available to generate graphs")
        return jsonify({"error": "No data available"}), 400
    
    graphs = [
        generate_plotly_config(timestamps, humidity, "Humidity %"),
        generate_plotly_config(timestamps, temperature, "Temperature °C"),
        generate_plotly_config(timestamps, rain, "Rain mm"),
        generate_plotly_config(timestamps, soil_moisture, "Soil Moisture %")
    ]
    
    graphs = [g for g in graphs if g is not None]
    if not graphs:
        logger.error("Failed to generate any graph configurations")
        return jsonify({"error": "Failed to generate graphs"}), 500
    
    logger.info("Returning graph configurations")
    return jsonify(graphs)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)