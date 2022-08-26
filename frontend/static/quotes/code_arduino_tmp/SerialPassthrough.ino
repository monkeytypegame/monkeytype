void setup() {
  Serial.begin(9600);
  Serial1.begin(9600);
}
void loop() {
  if (Serial.available()) {
    Serial1.write(Serial.read());
  }
  if (Serial1.available()) {
    Serial.write(Serial1.read());
  }
}