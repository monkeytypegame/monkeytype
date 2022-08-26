#include "pitches.h"
const int threshold = 10;
int notes[] = {
  NOTE_A4, NOTE_B4, NOTE_C3
};
void setup() {
}
void loop() {
  for (int thisSensor = 0; thisSensor < 3; thisSensor++) {
    int sensorReading = analogRead(thisSensor);
    if (sensorReading > threshold) {
      tone(8, notes[thisSensor], 20);
    }
  }
}
