#define OSX 0
#define WINDOWS 1
#define UBUNTU 2
#include "Keyboard.h"
int platform = OSX;
void setup() {
  pinMode(2, INPUT_PULLUP);
  Keyboard.begin();
}
void loop() {
  while (digitalRead(2) == HIGH) {
    delay(500);
  }
  delay(1000);
  switch (platform) {
    case OSX:
      Keyboard.press(KEY_LEFT_GUI);
      Keyboard.press(KEY_LEFT_SHIFT);
      Keyboard.press('Q');
      delay(100);
      Keyboard.releaseAll();
      Keyboard.write(KEY_RETURN);
      break;
    case WINDOWS:
      Keyboard.press(KEY_LEFT_CTRL);
      Keyboard.press(KEY_LEFT_ALT);
      Keyboard.press(KEY_DELETE);
      delay(100);
      Keyboard.releaseAll();
      delay(2000);
      Keyboard.press(KEY_LEFT_ALT);
      Keyboard.press('l');
      Keyboard.releaseAll();
      break;
    case UBUNTU:
      Keyboard.press(KEY_LEFT_CTRL);
      Keyboard.press(KEY_LEFT_ALT);
      Keyboard.press(KEY_DELETE);
      delay(1000);
      Keyboard.releaseAll();
      Keyboard.write(KEY_RETURN);
      break;
  }
  while (true);
}