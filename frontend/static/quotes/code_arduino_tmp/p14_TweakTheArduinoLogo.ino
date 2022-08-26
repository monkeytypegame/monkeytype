void setup() {
  Serial.begin(9600);
}
void loop() {
  Serial.write(analogRead(A0) / 4);
  delay(1);
}