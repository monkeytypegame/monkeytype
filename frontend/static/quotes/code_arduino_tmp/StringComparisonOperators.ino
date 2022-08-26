String stringOne, stringTwo;
void setup() {
  Serial.begin(9600);
  while (!Serial) {
    ;
  }
  stringOne = String("this");
  stringTwo = String("that");
  Serial.println("\n\nComparing Strings:");
  Serial.println();
}
void loop() {
  if (stringOne == "this") {
    Serial.println("StringOne == \"this\"");
  }
  if (stringOne != stringTwo) {
    Serial.println(stringOne + " =! " + stringTwo);
  }
  stringOne = "This";
  stringTwo = "this";
  if (stringOne != stringTwo) {
    Serial.println(stringOne + " =! " + stringTwo);
  }
  if (stringOne.equals(stringTwo)) {
    Serial.println(stringOne + " equals " + stringTwo);
  } else {
    Serial.println(stringOne + " does not equal " + stringTwo);
  }
  if (stringOne.equalsIgnoreCase(stringTwo)) {
    Serial.println(stringOne + " equals (ignoring case) " + stringTwo);
  } else {
    Serial.println(stringOne + " does not equal (ignoring case) " + stringTwo);
  }
  stringOne = "1";
  int numberOne = 1;
  if (stringOne.toInt() == numberOne) {
    Serial.println(stringOne + " = " + numberOne);
  }
  stringOne = "2";
  stringTwo = "1";
  if (stringOne >= stringTwo) {
    Serial.println(stringOne + " >= " + stringTwo);
  }
  stringOne = String("Brown");
  if (stringOne < "Charles") {
    Serial.println(stringOne + " < Charles");
  }
  if (stringOne > "Adams") {
    Serial.println(stringOne + " > Adams");
  }
  if (stringOne <= "Browne") {
    Serial.println(stringOne + " <= Browne");
  }
  if (stringOne >= "Brow") {
    Serial.println(stringOne + " >= Brow");
  }
  stringOne = "Cucumber";
  stringTwo = "Cucuracha";
  if (stringOne.compareTo(stringTwo) < 0) {
    Serial.println(stringOne + " comes before " + stringTwo);
  } else {
    Serial.println(stringOne + " comes after " + stringTwo);
  }
  delay(10000);
  while (true) {
    stringOne = "Sensor: ";
    stringTwo = "Sensor: ";
    stringOne += analogRead(A0);
    stringTwo += analogRead(A5);
    if (stringOne.compareTo(stringTwo) < 0) {
      Serial.println(stringOne + " comes before " + stringTwo);
    } else {
      Serial.println(stringOne + " comes after " + stringTwo);
    }
  }
}