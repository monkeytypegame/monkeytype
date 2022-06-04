const changes = {};

const applyChanges = (path, value) => {
  const subPaths = path.slice(1).split(".");
  let current = changes;

  subPaths.forEach((path, i) => {
    if (i === subPaths.length - 1) {
      current[path] = value;
    } else {
      current[path] = current[path] || {};
      current = current[path];
    }
  });
};

const buildLabel = (elementType, text) => {
  const labelElement = document.createElement("label");
  labelElement.innerHTML = text;
  labelElement.style.fontWeight = elementType === "group" ? "bold" : "lighter";

  return labelElement;
};

const buildNumberInput = (schema, data, path) => {
  const input = document.createElement("input");
  input.classList.add("base-input");
  input.type = "number";
  input.value = data;
  input.min = schema.min || 0;
  input.addEventListener("change", () => {
    const normalizedValue = parseFloat(input.value, 10);
    applyChanges(path, normalizedValue);
  });

  return input;
};

const buildBooleanInput = (data, path) => {
  const input = document.createElement("input");
  input.classList.add("base-input");
  input.type = "checkbox";
  input.checked = data;
  input.addEventListener("change", () => {
    applyChanges(path, input.checked);
  });

  return input;
};

const buildUnknownInput = () => {
  const disclaimer = document.createElement("div");
  disclaimer.innerHTML = "<i>This configuration is not yet supported</i>";

  return disclaimer;
};

const generateForm = (formSchema, initialData) => {
  const buildForm = (schema, data, path = "") => {
    const parent = document.createElement("div");
    parent.classList.add("form-element");

    const { type, label, elements } = schema;

    if (label) {
      parent.appendChild(buildLabel(type, label));
    }

    switch (type) {
      case "boolean":
        parent.appendChild(buildBooleanInput(data, path));
        break;
      case "number":
        parent.appendChild(buildNumberInput(schema, data, path));
        break;
      case "group":
        const entries = Object.entries(elements);
        entries.forEach(([key, value]) => {
          const childElement = buildForm(value, data[key], `${path}.${key}`);
          parent.appendChild(childElement);
        });
        break;
      default:
        parent.appendChild(buildUnknownInput());
    }

    return parent;
  };

  return buildForm(formSchema, initialData);
};

window.onload = async () => {
  const root = document.querySelector("#root");
  const saveButton = document.querySelector("#save");

  const schemaResponse = await fetch("/configuration/schema");
  const dataResponse = await fetch("/configuration");

  const schemaResponseJson = await schemaResponse.json();
  const dataResponseJson = await dataResponse.json();

  const { data: formSchema } = schemaResponseJson;
  const { data: initialData } = dataResponseJson;

  const formElement = generateForm(formSchema, initialData);
  root?.appendChild(formElement);

  saveButton?.addEventListener("click", async () => {
    await fetch("/configuration", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        configuration: changes,
      }),
    });
  });
};
