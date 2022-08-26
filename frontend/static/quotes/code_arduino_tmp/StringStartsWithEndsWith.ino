void setup() {
  Serial.begin(9600);
  while (!Serial) {
    ;
  }
  Serial.println("\n\nString startsWith() and endsWith():");
  Serial.println();
}
void loop() {
  String stringOne = "HTTP/1.1 200 OK";
  Serial.println(stringOne);
  if (stringOne.startsWith("HTTP/1.1")) {
    Serial.println("Server's using http version 1.1");
  }
  stringOne = "HTTP/1.1 200 OK";
  if (stringOne.startsWith("200 OK", 9)) {
    Serial.println("Got an OK from the server");
  }
  String sensorReading = "sensor = ";
  sensorReading += analogRead(A0);
  Serial.print(sensorReading);
  if (sensorReading.endsWith("0")) {
    Serial.println(". This reading is divisible by ten");
  } else {
    Serial.println(". This reading is not divisible by ten");
  }
  while (true);
}
