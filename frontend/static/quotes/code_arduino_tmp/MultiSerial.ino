void setup() {
  Serial.begin(9600);
  Serial1.begin(9600);
}
void loop() {
  if (Serial1.available()) {
    int inByte = Serial1.read();
    Serial.write(inByte);
  }
  if (Serial.available()) {
    int inByte = Serial.read();
    Serial1.write(inByte);
  }
}