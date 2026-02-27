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
    "prefer-arrow-in-component": defineRule({
      meta: {
        fixable: "code",
      },
      createOnce(context) {
        const isPascalCase = (name) => /^[A-Z][a-zA-Z0-9]*$/.test(name);

        const getComponentAncestor = (node) => {
          let current = node.parent;
          while (current) {
            // function ComponentName() { ... }
            if (
              current.type === "FunctionDeclaration" &&
              current.id?.name &&
              isPascalCase(current.id.name)
            ) {
              return current.id.name;
            }
            // const ComponentName = () => { ... } or const ComponentName = function() { ... }
            if (
              (current.type === "ArrowFunctionExpression" ||
                current.type === "FunctionExpression") &&
              current.parent?.type === "VariableDeclarator" &&
              current.parent.id?.name &&
              isPascalCase(current.parent.id.name)
            ) {
              return current.parent.id.name;
            }
            current = current.parent;
          }
          return null;
        };

        return {
          FunctionDeclaration(node) {
            const componentName = getComponentAncestor(node);
            if (componentName && node.id) {
              const fnName = node.id.name;
              context.report({
                node,
                message: `Use \`const ${fnName} = ...\` arrow function instead of function declaration inside a SolidJS component.`,
                fix(fixer) {
                  const fullText = context.sourceCode.getText(node);
                  const nodeStart = node.range?.[0] ?? node.start;
                  const afterName =
                    (node.id.range?.[1] ?? node.id.end) - nodeStart;
                  const bodyStart =
                    (node.body.range?.[0] ?? node.body.start) - nodeStart;

                  const paramsAndReturn = fullText
                    .slice(afterName, bodyStart)
                    .trimEnd();
                  const body = fullText.slice(bodyStart);
                  const asyncPrefix = node.async ? "async " : "";

                  return fixer.replaceText(
                    node,
                    `const ${fnName} = ${asyncPrefix}${paramsAndReturn} => ${body}`,
                  );
                },
              });
            }
          },
        };
      },
    }),
  },
};

export default plugin;
