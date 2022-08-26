void setup() {
  Serial.begin(9600);
  while (!Serial) {
    ;
  }
  Serial.println("\n\nString  substring():");
  Serial.println();
}
void loop() {
  String stringOne = "Content-Type: text/html";
  Serial.println(stringOne);
  if (stringOne.substring(19) == "html") {
    Serial.println("It's an html file");
  }
  if (stringOne.substring(14, 18) == "text") {
    Serial.println("It's a text-based file");
  }
  while (true);
}