String txtMsg = "";
unsigned int lastStringLength = txtMsg.length();
void setup() {
  Serial.begin(9600);
  while (!Serial) {
    ;
  }
  Serial.println("\n\nString  length():");
  Serial.println();
}
void loop() {
  while (Serial.available() > 0) {
    char inChar = Serial.read();
    txtMsg += inChar;
  }
  if (txtMsg.length() != lastStringLength) {
    Serial.println(txtMsg);
    Serial.println(txtMsg.length());
    if (txtMsg.length() < 140) {
      Serial.println("That's a perfectly acceptable text message");
    } else {
      Serial.println("That's too long for a text message.");
    }
    lastStringLength = txtMsg.length();
  }
}
