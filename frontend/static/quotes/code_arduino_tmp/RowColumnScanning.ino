const int row[8] = {
  2, 7, 19, 5, 13, 18, 12, 16
};
const int col[8] = {
  6, 11, 10, 3, 17, 4, 8, 9
};
int pixels[8][8];
int x = 5;
int y = 5;
void setup() {
  for (int thisPin = 0; thisPin < 8; thisPin++) {
    pinMode(col[thisPin], OUTPUT);
    pinMode(row[thisPin], OUTPUT);
    digitalWrite(col[thisPin], HIGH);
  }
  for (int x = 0; x < 8; x++) {
    for (int y = 0; y < 8; y++) {
      pixels[x][y] = HIGH;
    }
  }
}
void loop() {
  readSensors();
  refreshScreen();
}
void readSensors() {
  pixels[x][y] = HIGH;
  x = 7 - map(analogRead(A0), 0, 1023, 0, 7);
  y = map(analogRead(A1), 0, 1023, 0, 7);
  pixels[x][y] = LOW;
}
void refreshScreen() {
  for (int thisRow = 0; thisRow < 8; thisRow++) {
    digitalWrite(row[thisRow], HIGH);
    for (int thisCol = 0; thisCol < 8; thisCol++) {
      int thisPixel = pixels[thisRow][thisCol];
      digitalWrite(col[thisCol], thisPixel);
      if (thisPixel == LOW) {
        digitalWrite(col[thisCol], HIGH);
      }
    }
    digitalWrite(row[thisRow], LOW);
  }
}