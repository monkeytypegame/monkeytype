const int redPin = A0;
const int greenPin = A1;
const int bluePin = A2;
void setup() {
  Serial.begin(9600);
}
void loop() {
  Serial.print(analogRead(redPin));
  Serial.print(",");
  Serial.print(analogRead(greenPin));
  Serial.print(",");
  Serial.println(analogRead(bluePin));
}