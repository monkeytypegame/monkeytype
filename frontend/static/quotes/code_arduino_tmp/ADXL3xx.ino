const int groundpin = 18;
const int powerpin = 19;
const int xpin = A3;
const int ypin = A2;
const int zpin = A1;
void setup() {
  Serial.begin(9600);
  pinMode(groundpin, OUTPUT);
  pinMode(powerpin, OUTPUT);
  digitalWrite(groundpin, LOW);
  digitalWrite(powerpin, HIGH);
}
void loop() {
  Serial.print(analogRead(xpin));
  Serial.print("\t");
  Serial.print(analogRead(ypin));
  Serial.print("\t");
  Serial.print(analogRead(zpin));
  Serial.println();
  delay(100);
}
