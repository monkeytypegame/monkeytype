String stringOne, stringTwo;
void setup() {
  Serial.begin(9600);
  while (!Serial) {
    ;
  }
  stringOne = String("Sensor ");
  stringTwo = String("value");
  Serial.println("\n\nAppending to a String:");
  Serial.println();
}
void loop() {
  Serial.println(stringOne);
  stringOne += stringTwo;
  Serial.println(stringOne);
  stringOne += " for input ";
  Serial.println(stringOne);
  stringOne += 'A';
  Serial.println(stringOne);
  stringOne += 0;
  Serial.println(stringOne);
  stringOne += ": ";
  Serial.println(stringOne);
  stringOne += analogRead(A0);
  Serial.println(stringOne);
  Serial.println("\n\nchanging the Strings' values");
  stringOne = "A long integer: ";
  stringTwo = "The millis(): ";
  stringOne += 123456789;
  Serial.println(stringOne);
  stringTwo.concat(millis());
  Serial.println(stringTwo);
  while (true);
}
