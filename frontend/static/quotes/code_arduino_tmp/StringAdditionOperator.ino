String stringOne, stringTwo, stringThree;
void setup() {
  Serial.begin(9600);
  while (!Serial) {
    ;
  }
  stringOne = String("You added ");
  stringTwo = String("this string");
  stringThree = String();
  Serial.println("\n\nAdding Strings together (concatenation):");
  Serial.println();
}
void loop() {
  stringThree =  stringOne + 123;
  Serial.println(stringThree);
  stringThree = stringOne + 123456789;
  Serial.println(stringThree);
  stringThree =  stringOne + 'A';
  Serial.println(stringThree);
  stringThree =  stringOne +  "abc";
  Serial.println(stringThree);
  stringThree = stringOne + stringTwo;
  Serial.println(stringThree);
  int sensorValue = analogRead(A0);
  stringOne = "Sensor value: ";
  stringThree = stringOne  + sensorValue;
  Serial.println(stringThree);
  stringOne = "millis() value: ";
  stringThree = stringOne + millis();
  Serial.println(stringThree);
  while (true);
}
