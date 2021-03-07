#include <ArduinoJson.h>
#include <PubSubClient.h>
#include <ESP8266WiFi.h>

#define WIFI_AP "Josh.Chang"
#define WIFI_PASSWORD "2ojaAlra"

//#define WIFI_AP "CPH1707"
//#define WIFI_PASSWORD "12345678"

//#define WIFI_AP "NTUT-Free"
//#define WIFI_PASSWORD NULL

#define GPIO0 0
#define GPIO2 2

#define GPIO0_PIN 3
#define GPIO2_PIN 5

// TODO: init GPIO to low
// We assume that GPIO is low
boolean gpioState = false;

// The MQTT server used
char clientID[] = "2574d403-ac0b-4f10-a71f-6fef74d6ecb5";
char mqttServer[] = "test.mosquitto.org";
int port = 1883;
// char topic[] = "presence";
char topic[] = "to-esp8266-arduino-2wk5925b";

WiFiClient wifiClient;
PubSubClient client(wifiClient);
int status = WL_IDLE_STATUS;

void setup() {
  Serial.begin(115200);
  
  // Set output mode for all GPIO pins
  pinMode(GPIO0, OUTPUT);
  pinMode(GPIO2, OUTPUT);
  digitalWrite(GPIO0, LOW);
  
  delay(10);
  
  InitWiFi();
  client.setServer(mqttServer, port);
  client.setCallback(on_message); 
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }

  client.loop();
}

void parseJSON(const char* json) {
  // Allocate the JSON document
  StaticJsonDocument<200> doc;

  // Deserialize the JSON document
  DeserializationError error = deserializeJson(doc, json);

  // Test if parsing succeeds.
  if (error) {
    Serial.print(F("deserializeJson() failed: "));
    Serial.println(error.f_str());
    return;
  }

  // Fetch values.
  //
  // Most of the time, you can rely on the implicit casts.
  // In other case, you can do doc["time"].as<long>();
  const char* methodName = doc["method"];
  Serial.print("method: ");
  Serial.println(String(methodName));

  if (strcmp(methodName, "getGPIOStatus") == 0) {
    const char* responseTopic = doc["responseTopic"];
    Serial.print("Command is getGPIOStatus...");

    Serial.print("responseTopic: ");
    Serial.println(String(responseTopic));
    
    StaticJsonDocument<200> doc;

    doc["gpio"] = 0;
    doc["status"] = gpioState;
  
    // Generate the minified JSON.
    //
    char payload[256];
    serializeJson(doc, payload);
    client.publish(responseTopic, payload);
  } else if (strcmp(methodName, "setGPIOStatus") == 0) {
    Serial.print("Command is setGPIOStatus...");

    int gpio = doc["gpio"];
    boolean status = doc["status"];

    Serial.print("gpio: ");
    Serial.println(gpio);
    Serial.print("status: ");
    Serial.println(status);

    // if (gpioState != status) {
      gpioState = status;
      digitalWrite(GPIO0, status ? HIGH : LOW);
    // }
  }
}

// The callback for when a PUBLISH message is received from the server.
void on_message(const char* topic, byte* payload, unsigned int length) {
  char json[length + 1];
  strncpy (json, (char*)payload, length);
  json[length] = '\0';
  
  parseJSON(json);
}

void InitWiFi() {
  Serial.println(F("Connecting to AP ..."));
  // attempt to connect to WiFi network

  WiFi.begin(WIFI_AP, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println(F("Connected to AP"));
}

void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    status = WiFi.status();
    if ( status != WL_CONNECTED) {
      WiFi.begin(WIFI_AP, WIFI_PASSWORD);
      while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
      }
      
      Serial.println(F("Connected to AP"));
    }
        
    Serial.print("Connecting to MQTT server ...");
    
    if (client.connect(clientID)) {
      Serial.println(F("[DONE]"));
      
      // Subscribing to receive RPC requests
      client.subscribe(topic);
      
      // Sending current GPIO status
      Serial.println(F("Sending current GPIO status ..."));
    } else {
      Serial.print("[FAILED] [ rc = ");
      Serial.print(client.state());
      Serial.println(F(" : retrying in 5 seconds]"));
      
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}
