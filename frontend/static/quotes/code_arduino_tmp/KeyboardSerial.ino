#include "Keyboard.h"
void setup() {
  Serial.begin(9600);
  Keyboard.begin();
}
void loop() {
  if (Serial.available() > 0) {
    char inChar = Serial.read();
    Keyboard.write(inChar + 1);
  }
}
