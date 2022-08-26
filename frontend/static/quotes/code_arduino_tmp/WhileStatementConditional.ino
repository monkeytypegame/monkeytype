const int sensorPin = A0;
const int ledPin = 9;
const int indicatorLedPin = 13;
const int buttonPin = 2;
int sensorMin = 1023;
int sensorMax = 0;
int sensorValue = 0;
void setup() {
  pinMode(indicatorLedPin, OUTPUT);
  pinMode(ledPin, OUTPUT);
  pinMode(buttonPin, INPUT);
}
void loop() {
  while (digitalRead(buttonPin) == HIGH) {
    calibrate();
  }
  digitalWrite(indicatorLedPin, LOW);
  sensorValue = analogRead(sensorPin);
  sensorValue = map(sensorValue, sensorMin, sensorMax, 0, 255);
  sensorValue = constrain(sensorValue, 0, 255);
  analogWrite(ledPin, sensorValue);
}
void calibrate() {
  digitalWrite(indicatorLedPin, HIGH);
  sensorValue = analogRead(sensorPin);
  if (sensorValue > sensorMax) {
    sensorMax = sensorValue;
  }
  if (sensorValue < sensorMin) {
    sensorMin = sensorValue;
  }
}