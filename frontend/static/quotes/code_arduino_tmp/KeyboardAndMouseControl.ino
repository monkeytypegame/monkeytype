#include "Keyboard.h"
#include "Mouse.h"
const int upButton = 2;
const int downButton = 3;
const int leftButton = 4;
const int rightButton = 5;
const int mouseButton = 6;
void setup() {
  pinMode(upButton, INPUT);
  pinMode(downButton, INPUT);
  pinMode(leftButton, INPUT);
  pinMode(rightButton, INPUT);
  pinMode(mouseButton, INPUT);
  Serial.begin(9600);
  Mouse.begin();
  Keyboard.begin();
}
void loop() {
  if (Serial.available() > 0) {
    char inChar = Serial.read();
    switch (inChar) {
      case 'u':
        Mouse.move(0, -40);
        break;
      case 'd':
        Mouse.move(0, 40);
        break;
      case 'l':
        Mouse.move(-40, 0);
        break;
      case 'r':
        Mouse.move(40, 0);
        break;
      case 'm':
        Mouse.click(MOUSE_LEFT);
        break;
    }
  }
  if (digitalRead(upButton) == HIGH) {
    Keyboard.write('u');
  }
  if (digitalRead(downButton) == HIGH) {
    Keyboard.write('d');
  }
  if (digitalRead(leftButton) == HIGH) {
    Keyboard.write('l');
  }
  if (digitalRead(rightButton) == HIGH) {
    Keyboard.write('r');
  }
  if (digitalRead(mouseButton) == HIGH) {
    Keyboard.write('m');
  }
}