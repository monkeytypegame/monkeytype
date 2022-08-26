void setup() {
  Serial.begin(9600);
  while (!Serial) {
    ;
  }
  Serial.println("\n\nString replace:\n");
  Serial.println();
}
void loop() {
  String stringOne = "<html><head><body>";
  Serial.println(stringOne);
  String stringTwo = stringOne;
  stringTwo.replace("<", "</");
  Serial.println("Original string: " + stringOne);
  Serial.println("Modified string: " + stringTwo);
  String normalString = "bookkeeper";
  Serial.println("normal: " + normalString);
  String leetString = normalString;
  leetString.replace('o', '0');
  leetString.replace('e', '3');
  Serial.println("l33tspeak: " + leetString);
  while (true);
}