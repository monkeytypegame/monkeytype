const int optoPin = 2;
void setup() {
  pinMode(optoPin, OUTPUT);
}
void loop() {
  digitalWrite(optoPin, HIGH);
  delay(15);
  digitalWrite(optoPin, LOW);
  delay(21000);
}