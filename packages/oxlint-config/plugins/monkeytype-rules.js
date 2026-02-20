import { defineRule } from "@oxlint/plugins";

const plugin = {
  meta: {
    name: "monkeytype-rules",
  },
  rules: {
    "no-testing-access": defineRule({
      createOnce(context) {
        return {
          MemberExpression(node) {
            if (node.property?.name === "__testing") {
              context.report({
                node,
                message: "__testing should only be accessed in test files.",
              });
            }
          },
        };
      },
    }),
  },
};

export default plugin;
