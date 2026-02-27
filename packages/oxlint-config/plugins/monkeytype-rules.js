import { defineRule } from "@oxlint/plugins";

/**
 * Walk a function body looking for a ReturnStatement whose argument is
 * JSXElement or JSXFragment. Only traverses control flow nodes — does NOT
 * recurse into call arguments or JSX attribute values, preventing false
 * positives on functions that pass JSX as a prop/argument. Stops at nested
 * function boundaries so inner helpers returning JSX don't count.
 */
function containsJSXReturn(node) {
  if (!node || typeof node !== "object" || !node.type) return false;

  // Stop at nested function boundaries
  if (
    node.type === "FunctionDeclaration" ||
    node.type === "FunctionExpression" ||
    node.type === "ArrowFunctionExpression"
  ) {
    return false;
  }

  // Arrow with concise body: const Foo = () => <div />
  if (node.type === "JSXElement" || node.type === "JSXFragment") return true;

  // return <...>
  if (node.type === "ReturnStatement") {
    return (
      node.argument?.type === "JSXElement" ||
      node.argument?.type === "JSXFragment"
    );
  }

  // Only recurse through control flow / block nodes, not into expressions
  const CONTROL_FLOW_KEYS = {
    BlockStatement: ["body"],
    Program: ["body"],
    IfStatement: ["consequent", "alternate"],
    SwitchStatement: ["cases"],
    SwitchCase: ["consequent"],
    TryStatement: ["block", "handler", "finalizer"],
    CatchClause: ["body"],
    WhileStatement: ["body"],
    DoWhileStatement: ["body"],
    ForStatement: ["body"],
    ForInStatement: ["body"],
    ForOfStatement: ["body"],
    LabeledStatement: ["body"],
  };

  const keys = CONTROL_FLOW_KEYS[node.type];
  if (!keys) return false;

  for (const key of keys) {
    const child = node[key];
    if (!child) continue;
    if (Array.isArray(child)) {
      for (const item of child) {
        if (containsJSXReturn(item)) return true;
      }
    } else if (containsJSXReturn(child)) {
      return true;
    }
  }
  return false;
}

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
        hasSuggestions: true,
      },
      createOnce(context) {
        const getComponentAncestor = (node) => {
          let current = node.parent;
          while (current) {
            // function Foo() { return <...> }
            if (
              current.type === "FunctionDeclaration" &&
              containsJSXReturn(current.body)
            ) {
              return current.id?.name ?? "component";
            }
            // const Foo = () => { return <...> } or const Foo = function() { return <...> }
            if (
              (current.type === "ArrowFunctionExpression" ||
                current.type === "FunctionExpression") &&
              containsJSXReturn(current.body ?? current) &&
              current.parent?.type === "VariableDeclarator"
            ) {
              return current.parent.id?.name ?? "component";
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
                message: `\`${fnName}\` should be a const arrow function`,
                suggest: [
                  {
                    desc: `Convert to const arrow function (note: removes hoisting)`,
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
                  },
                ],
              });
            }
          },
        };
      },
    }),
    "one-component-per-file": defineRule({
      createOnce(context) {
        let exportedComponents;

        return {
          before() {
            exportedComponents = [];
          },
          ExportNamedDeclaration(node) {
            // export function Foo() { return <...> }
            if (
              node.declaration?.type === "FunctionDeclaration" &&
              node.declaration.id?.name &&
              containsJSXReturn(node.declaration.body)
            ) {
              exportedComponents.push({
                name: node.declaration.id.name,
                node,
              });
              return;
            }
            // export const Foo = () => <...> or export const Foo = function() { return <...> }
            if (node.declaration?.type === "VariableDeclaration") {
              for (const decl of node.declaration.declarations) {
                if (
                  decl.id?.name &&
                  (decl.init?.type === "ArrowFunctionExpression" ||
                    decl.init?.type === "FunctionExpression") &&
                  containsJSXReturn(decl.init.body ?? decl.init)
                ) {
                  exportedComponents.push({ name: decl.id.name, node });
                }
              }
            }
          },
          "Program:exit"() {
            if (exportedComponents.length > 1) {
              for (const { name, node } of exportedComponents.slice(1)) {
                context.report({
                  node,
                  message: `Only one exported component per file. Move \`${name}\` to its own file.`,
                });
              }
            }
          },
        };
      },
    }),
    "component-pascal-case": defineRule({
      createOnce(context) {
        const isPascalCase = (name) => /^[A-Z][a-zA-Z0-9]*$/.test(name);

        return {
          FunctionDeclaration(node) {
            const isTopLevel =
              node.parent?.type === "Program" ||
              node.parent?.type === "ExportNamedDeclaration";
            if (!isTopLevel || !node.id) return;
            const name = node.id.name;
            if (!isPascalCase(name) && containsJSXReturn(node.body)) {
              context.report({
                node: node.id,
                message: `Component \`${name}\` should be PascalCase.`,
              });
            }
          },
          VariableDeclarator(node) {
            const isTopLevel =
              node.parent?.parent?.type === "Program" ||
              node.parent?.parent?.type === "ExportNamedDeclaration";
            if (
              !isTopLevel ||
              node.id?.type !== "Identifier" ||
              (node.init?.type !== "ArrowFunctionExpression" &&
                node.init?.type !== "FunctionExpression")
            ) {
              return;
            }
            const name = node.id.name;
            if (!isPascalCase(name) && containsJSXReturn(node.init)) {
              context.report({
                node: node.id,
                message: `Component \`${name}\` should be PascalCase.`,
              });
            }
          },
        };
      },
    }),
  },
};

export default plugin;
