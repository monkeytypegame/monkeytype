void setup() {
  Serial.begin(9600);
  while (!Serial) {
    ;
  }
  Serial.println("\n\nString Constructors:");
  Serial.println();
}
void loop() {
  String stringOne = "Hello String";
  Serial.println(stringOne);
  stringOne =  String('a');
  Serial.println(stringOne);
  String stringTwo =  String("This is a string");
  Serial.println(stringTwo);
  stringOne =  String(stringTwo + " with more");
  Serial.println(stringOne);
  stringOne =  String(13);
  Serial.println(stringOne);
  stringOne =  String(analogRead(A0), DEC);
  Serial.println(stringOne);
  stringOne =  String(45, HEX);
  Serial.println(stringOne);
  stringOne =  String(255, BIN);
  Serial.println(stringOne);
  stringOne =  String(millis(), DEC);
  Serial.println(stringOne);
  stringOne = String(5.698, 3);
  Serial.println(stringOne);
  stringOne = String(5.698, 2);
  Serial.println(stringOne);
  while (true);
}
