const int lowestPin = 2;
const int highestPin = 13;
void setup() {
  for (int thisPin = lowestPin; thisPin <= highestPin; thisPin++) {
    pinMode(thisPin, OUTPUT);
  }
}
void loop() {
  for (int thisPin = lowestPin; thisPin <= highestPin; thisPin++) {
    for (int brightness = 0; brightness < 255; brightness++) {
      analogWrite(thisPin, brightness);
      delay(2);
    }
    for (int brightness = 255; brightness >= 0; brightness--) {
      analogWrite(thisPin, brightness);
      delay(2);
    }
    delay(100);
  }
}