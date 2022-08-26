void setup() {
  Serial.begin(9600);
  while (!Serial) {
    ;
  }
  Serial.println("\n\nString indexOf() and lastIndexOf()  functions:");
  Serial.println();
}
void loop() {
  String stringOne = "<HTML><HEAD><BODY>";
  int firstClosingBracket = stringOne.indexOf('>');
  Serial.println("The index of > in the string " + stringOne + " is " + firstClosingBracket);
  stringOne = "<HTML><HEAD><BODY>";
  int secondOpeningBracket = firstClosingBracket + 1;
  int secondClosingBracket = stringOne.indexOf('>', secondOpeningBracket);
  Serial.println("The index of  the second > in the string " + stringOne + " is " + secondClosingBracket);
  stringOne = "<HTML><HEAD><BODY>";
  int bodyTag = stringOne.indexOf("<BODY>");
  Serial.println("The index of the body tag in the string " + stringOne + " is " + bodyTag);
  stringOne = "<UL><LI>item<LI>item<LI>item</UL>";
  int firstListItem = stringOne.indexOf("<LI>");
  int secondListItem = stringOne.indexOf("<LI>", firstListItem + 1);
  Serial.println("The index of the second list tag in the string " + stringOne + " is " + secondListItem);
  int lastOpeningBracket = stringOne.lastIndexOf('<');
  Serial.println("The index of the last < in the string " + stringOne + " is " + lastOpeningBracket);
  int lastListItem  = stringOne.lastIndexOf("<LI>");
  Serial.println("The index of the last list tag in the string " + stringOne + " is " + lastListItem);
  stringOne = "<p>Lorem ipsum dolor sit amet</p><p>Ipsem</p><p>Quod</p>";
  int lastParagraph = stringOne.lastIndexOf("<p");
  int secondLastGraf = stringOne.lastIndexOf("<p", lastParagraph - 1);
  Serial.println("The index of the second to last paragraph tag " + stringOne + " is " + secondLastGraf);
  while (true);
}
