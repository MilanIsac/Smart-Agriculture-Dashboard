#include "secrets.h"
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "WiFi.h"
#include "DHT.h"



#include <time.h>

#define DHTPIN 14     // Digital pin connected to the DHT sensor
#define DHTTYPE DHT11   // DHT 11
 
#define AWS_IOT_PUBLISH_TOPIC   "esp32/pub"
#define AWS_IOT_SUBSCRIBE_TOPIC "esp32/sub"

float  h = 37;
float  t = 27.5;
float dn = 1;
float rp = 0;
float mp = 33;

DHT dht(DHTPIN, DHTTYPE);
 
WiFiClientSecure net = WiFiClientSecure();
PubSubClient client(net);
 
void connectAWS()
{
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
 
  Serial.println("Connecting to Wi-Fi");
 
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    
    Serial.print(".");
  }
 
  // Configure WiFiClientSecure to use the AWS IoT device credentials
  net.setCACert(AWS_CERT_CA);
  net.setCertificate(AWS_CERT_CRT);
  net.setPrivateKey(AWS_CERT_PRIVATE);
 
  // Connect to the MQTT broker on the AWS endpoint we defined earlier
  client.setServer(AWS_IOT_ENDPOINT, 8883);
 
  // Create a message handler
  client.setCallback(messageHandler);
 
  Serial.println("Connecting to AWS IOT");
 
  while (!client.connect(THINGNAME))
  {
    Serial.print(".");
    delay(100);
  }
 
  if (!client.connected())
  {
    Serial.println("AWS IoT Timeout!");
    return;
  }
 
  // Subscribe to a topic
  client.subscribe(AWS_IOT_SUBSCRIBE_TOPIC);
 
  Serial.println("AWS IoT Connected!");
}
 
// void publishMessage()
// {
//   StaticJsonDocument<1500> doc;
//   doc["humidity"] = h;
//   doc["temperature"] = t;
//   doc["rain percentage"] = rp;
//   doc["moisture precentage"] = mp;
//   doc["daynight"] = dn;

//   char jsonBuffer[2048];
//   serializeJson(doc, jsonBuffer); // print to client
 
//   client.publish(AWS_IOT_PUBLISH_TOPIC, jsonBuffer);
// }

String createJSONPayload(float t, float h, float rp, float mp, float dn) {
  StaticJsonDocument<1024> doc;
  doc["device_id"] = "ESP32_DHT11";  // Make sure this matches your thing name or device identifier
  doc["timestamp"] = getTimestamp(); // ISO 8601 UTC timestamp
  doc["temperature"] = t;
  doc["humidity"] = h;
  doc["rain_percentage"] = rp;
  doc["moisture_percentage"] = mp;
  doc["daynight"] = dn;

  String output;
  serializeJson(doc, output);
  return output;
}

String getTimestamp() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    return "N/A"; // fallback
  }
  char timeStringBuff[50];
  strftime(timeStringBuff, sizeof(timeStringBuff), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  return String(timeStringBuff);
}

// Publish message
void publishMessage(float t, float h, float rp, float mp, float dn) {
  String payload = createJSONPayload(t, h, rp, mp, dn);
  Serial.println("Publishing payload: ");
  // Serial.println(payload);
  client.publish(AWS_IOT_PUBLISH_TOPIC, payload.c_str());
    Serial.println("payload published. ");

}
 
void messageHandler(char* topic, byte* payload, unsigned int length)
{
  Serial.print("incoming: ");
  Serial.println(topic);
 
  StaticJsonDocument<200> doc;
  deserializeJson(doc, payload);
  const char* message = doc["message"];
  Serial.println(message);
}
 
void setup()
{
  Serial.begin(115200);
  connectAWS();
  dht.begin();
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");

}
 
void loop()
{
  // h = dht.readHumidity();
  // t = dht.readTemperature();
  if(!client.connected())
  {
    Serial.println("AWS client disconnected . ");
    connectAWS();
  }
    
  h==100? h = 0 : h++;
  t== 55? t = -10 : t++;
  rp == 70 ? rp = 15 : rp++;
  mp == 90 ? mp = 50 : mp++; 
  dn == 1 ? dn = 0 : dn = 1;
  
  if (isnan(h) || isnan(t) )  // Check if any reads failed and exit early (to try again).
  {
    Serial.println(F("Failed to read from DHT sensor!"));
    return;
  }
 
  Serial.print(F("Humidity: "));
  Serial.print(h);
  Serial.print(F("%  Temperature: "));
  Serial.print(t);
  Serial.print(F("°C   rain: "));
  Serial.print(rp);
  Serial.print(F("%  : "));
  Serial.print(mp);
  Serial.print(F("%  day night: "));
  dn == 1 ? Serial.print("day") : Serial.print("night");
  
  Serial.println();
 
  // publishMessage();
  publishMessage(t, h, rp, mp, dn);

  client.loop();
  delay(100);
}