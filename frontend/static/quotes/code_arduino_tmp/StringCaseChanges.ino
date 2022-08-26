void setup() {
  Serial.begin(9600);
  while (!Serial) {
    ;
  }
  Serial.println("\n\nString case changes:");
  Serial.println();
}
void loop() {
  String stringOne = "<html><head><body>";
  Serial.println(stringOne);
  stringOne.toUpperCase();
  Serial.println(stringOne);
  String stringTwo = "</BODY></HTML>";
  Serial.println(stringTwo);
  stringTwo.toLowerCase();
  Serial.println(stringTwo);
  while (true);
}
