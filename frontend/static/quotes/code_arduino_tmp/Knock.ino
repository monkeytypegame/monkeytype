const int ledPin = 13;
const int knockSensor = A0;
const int threshold = 100;
int sensorReading = 0;
int ledState = LOW;
void setup() {
  pinMode(ledPin, OUTPUT);
  Serial.begin(9600);
}
void loop() {
  sensorReading = analogRead(knockSensor);
  if (sensorReading >= threshold) {
    ledState = !ledState;
    digitalWrite(ledPin, ledState);
    Serial.println("Knock!");
  }
  delay(100);
}