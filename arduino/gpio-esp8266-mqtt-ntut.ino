                                                                                                                                                                                      #include <ArduinoJson.h>
//#include <ArduinoJson.h>
#include <PubSubClient.h>
#include <ESP8266WiFi.h>

#define WIFI_AP "Josh"
#define WIFI_PASSWORD "2ojaAlra"

#define GPIO0 0
#define GPIO2 2

#define GPIO0_PIN 3
#define GPIO2_PIN 5

// We assume that all GPIOs are LOW
boolean gpioState[] = { false, false };

// The MQTT server used
char clientID[] = "2574d403-ac0b-4f10-a71f-6fef74d6ecb5";
char mqttServer[] = "test.mosquitto.org";
int port = 1883;
// char topic[] = "presence";
char topic[] = "to-esp8266-arduino-1fc5925a";

WiFiClient wifiClient;
PubSubClient client(wifiClient);
int status = WL_IDLE_STATUS;

void setup() {
  Serial.begin(115200);
  
  // Set output mode for all GPIO pins
  pinMode(GPIO0, OUTPUT);
  pinMode(GPIO2, OUTPUT);
  
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

void testJSON() {
  // Allocate the JSON document
  //
  // Inside the brackets, 200 is the capacity of the memory pool in bytes.
  // Don't forget to change this value to match your JSON document.
  // Use arduinojson.org/v6/assistant to compute the capacity.
  StaticJsonDocument<200> doc;

  // StaticJsonDocument<N> allocates memory on the stack, it can be
  // replaced by DynamicJsonDocument which allocates in the heap.
  //
  // DynamicJsonDocument doc(200);

  // JSON input string.
  //
  // Using a char[], as shown here, enables the "zero-copy" mode. This mode uses
  // the minimal amount of memory because the JsonDocument stores pointers to
  // the input buffer.
  // If you use another type of input, ArduinoJson must copy the strings from
  // the input to the JsonDocument, so you need to increase the capacity of the
  // JsonDocument.
  char json[] =
      "{\"sensor\":\"gps\",\"time\":1351824120,\"data\":[48.756080,2.302038]}";

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
  const char* sensor = doc["sensor"];
  long time = doc["time"];
  double latitude = doc["data"][0];
  double longitude = doc["data"][1];

  // Print values.
  Serial.println(sensor);
  Serial.println(time);
  Serial.println(latitude, 6);
  Serial.println(longitude, 6);
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
  const char* responseTopic = doc["responseTopic"];
  Serial.print("method: ");
  Serial.println(String(methodName));
  Serial.print("responseTopic: ");
  Serial.println(String(responseTopic));

  if (strcmp(methodName, "getGPIOStatus") ==0) {
    Serial.print("Command is getGPIOStatus...");
    
    StaticJsonDocument<200> doc;

    doc["sensor"] = "gps";
    doc["time"] = 1351824120;
  
    // Generate the minified JSON.
    //
    char payload[256];
    serializeJson(doc, payload);
    client.publish(responseTopic, payload);
  }
}



// The callback for when a PUBLISH message is received from the server.
void on_message(const char* topic, byte* payload, unsigned int length) {

  Serial.println("On message");

  char json[length + 1];
  strncpy (json, (char*)payload, length);
  json[length] = '\0';

//  Serial.print("Topic: ");
//  Serial.println(topic);
//  Serial.print("Message: ");
//  Serial.println(String(json));
  
  parseJSON(json);
}

//String get_gpio_status() {
//  // Prepare gpios JSON payload string
//  StaticJsonBuffer<200> jsonBuffer;
//  JsonObject& data = jsonBuffer.createObject();
//  data[String(GPIO0_PIN)] = gpioState[0] ? true : false;
//  data[String(GPIO2_PIN)] = gpioState[1] ? true : false;
//  char payload[256];
//  data.printTo(payload, sizeof(payload));
//  String strPayload = String(payload);
//  Serial.print("Get gpio status: ");
//  Serial.println(strPayload);
//
//  
//  client.publish(topic);
//}

void set_gpio_status(int pin, boolean enabled) {
  if (pin == GPIO0_PIN) {
    // Output GPIOs state
    digitalWrite(GPIO0, enabled ? HIGH : LOW);
    // Update GPIOs state
    gpioState[0] = enabled;
  } else if (pin == GPIO2_PIN) {
    // Output GPIOs state
    digitalWrite(GPIO2, enabled ? HIGH : LOW);
    // Update GPIOs state
    gpioState[1] = enabled;
  }
}

void InitWiFi() {
  Serial.println("Connecting to AP ...");
  // attempt to connect to WiFi network

  WiFi.begin(WIFI_AP, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("Connected to AP");
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
      
      Serial.println("Connected to AP");
    }
        
    Serial.print("Connecting to MQTT server ...");
    
    if (client.connect(clientID)) {
      Serial.println( "[DONE]" );
      
      // Subscribing to receive RPC requests
      client.subscribe(topic);
      
      // Sending current GPIO status
      Serial.println("Sending current GPIO status ...");
    } else {
      Serial.print( "[FAILED] [ rc = " );
      Serial.print( client.state() );
      Serial.println( " : retrying in 5 seconds]" );
      
      // Wait 5 seconds before retrying
      delay( 5000 );
    }
  }
}
