void setup() {
  Serial.begin(9600);
  while (!Serial) {
    ;
  }
  Serial.println("\n\nString charAt() and setCharAt():");
}
void loop() {
  String reportString = "SensorReading: 456";
  Serial.println(reportString);
  char mostSignificantDigit = reportString.charAt(15);
  String message = "Most significant digit of the sensor reading is: ";
  Serial.println(message + mostSignificantDigit);
  Serial.println();
  reportString.setCharAt(13, '=');
  Serial.println(reportString);
  while (true);
}