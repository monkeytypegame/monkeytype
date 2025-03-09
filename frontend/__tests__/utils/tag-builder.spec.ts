import { buildTag } from "../../src/ts/utils/tag-builder";

describe("simple-modals", () => {
  describe("buildTag", () => {
    it("builds with mandatory", () => {
      expect(buildTag({ tagname: "input" })).toBe("<input />");
    });
    it("builds with classes", () => {
      expect(buildTag({ tagname: "input", classes: ["hidden", "bold"] })).toBe(
        '<input class="hidden bold" />'
      );
    });
    it("builds with attributes", () => {
      expect(
        buildTag({
          tagname: "input",
          attributes: {
            id: "4711",
            oninput: "console.log()",
            required: true,
            checked: true,
            missing: undefined,
          },
        })
      ).toBe('<input checked id="4711" oninput="console.log()" required />');
    });

    it("builds with innerHtml", () => {
      expect(
        buildTag({ tagname: "textarea", innerHTML: "<h1>Hello</h1>" })
      ).toBe("<textarea><h1>Hello</h1></textarea>");
    });
    it("builds with everything", () => {
      expect(
        buildTag({
          tagname: "textarea",
          classes: ["hidden", "bold"],
          attributes: {
            id: "4711",
            oninput: "console.log()",
            readonly: true,
            required: true,
          },
          innerHTML: "<h1>Hello</h1>",
        })
      ).toBe(
        '<textarea class="hidden bold" id="4711" oninput="console.log()" readonly required><h1>Hello</h1></textarea>'
      );
    });
  });
});
