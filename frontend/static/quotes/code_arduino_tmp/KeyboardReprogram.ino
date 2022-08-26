#include "Keyboard.h"
char ctrlKey = KEY_LEFT_GUI;
void setup() {
  pinMode(2, INPUT_PULLUP);
  Keyboard.begin();
}
void loop() {
  while (digitalRead(2) == HIGH) {
    delay(500);
  }
  delay(1000);
  Keyboard.press(ctrlKey);
  Keyboard.press('n');
  delay(100);
  Keyboard.releaseAll();
  delay(1000);
  Keyboard.press(ctrlKey);
  Keyboard.press('a');
  delay(500);
  Keyboard.releaseAll();
  Keyboard.write(KEY_BACKSPACE);
  delay(500);
  Keyboard.println("void setup() {");
  Keyboard.println("pinMode(13, OUTPUT);");
  Keyboard.println("}");
  Keyboard.println();
  Keyboard.println("void loop() {");
  Keyboard.println("digitalWrite(13, HIGH);");
  Keyboard.print("delay(3000);");
  for (int keystrokes = 0; keystrokes < 6; keystrokes++) {
    delay(500);
    Keyboard.write(KEY_BACKSPACE);
  }
  Keyboard.println("1000);");
  Keyboard.println("digitalWrite(13, LOW);");
  Keyboard.println("delay(1000);");
  Keyboard.println("}");
  Keyboard.press(ctrlKey);
  Keyboard.press('t');
  delay(100);
  Keyboard.releaseAll();
  delay(3000);
  Keyboard.press(ctrlKey);
  Keyboard.press('u');
  delay(100);
  Keyboard.releaseAll();
  while (true);
}
