let state = {};
let schema = {};

const buildLabel = (elementType, text, hintText) => {
  const labelElement = document.createElement("label");
  labelElement.innerHTML = text;
  labelElement.style.fontWeight = elementType === "group" ? "bold" : "lighter";

  if (hintText) {
    const hintElement = document.createElement("span");
    hintElement.classList.add("tooltip");
    hintElement.innerHTML = " ⓘ";

    const hintTextElement = document.createElement("span");
    hintTextElement.classList.add("tooltip-text");
    hintTextElement.innerHTML = hintText;

    hintElement.appendChild(hintTextElement);

    labelElement.appendChild(hintElement);
  }

  return labelElement;
};

const buildNumberInput = (schema, parentState, key) => {
  const input = document.createElement("input");
  input.classList.add("base-input");
  input.type = "number";
  input.value = parentState[key];

  const min = schema.min || 0;
  input.min = min;

  input.addEventListener("change", () => {
    const normalizedValue = parseFloat(input.value, 10);
    parentState[key] = Math.max(normalizedValue, min);
  });

  return input;
};

const buildBooleanInput = (parentState, key) => {
  const input = document.createElement("input");
  input.classList.add("base-input");
  input.type = "checkbox";
  input.checked = parentState[key] || false;

  input.addEventListener("change", () => {
    parentState[key] = input.checked;
  });

  return input;
};

const buildStringInput = (parentState, key) => {
  const input = document.createElement("input");
  input.classList.add("base-input");
  input.type = "text";
  input.value = parentState[key] || "";

  input.addEventListener("change", () => {
    parentState[key] = input.value;
  });

  return input;
};

const defaultValueForType = (type) => {
  switch (type) {
    case "number":
      return 0;
    case "boolean":
      return false;
    case "string":
      return "";
    case "array":
      return [];
    case "object":
      return {};
  }

  return null;
};

const arrayFormElementDecorator = (childElement, parentState, index) => {
  const decoratedElement = document.createElement("div");
  decoratedElement.classList.add("array-form-element-decorator");

  const removeButton = document.createElement("button");
  removeButton.innerHTML = "X";
  removeButton.classList.add("array-input", "array-input-delete", "button");
  removeButton.addEventListener("click", () => {
    parentState.splice(index, 1);
    rerender();
  });

  decoratedElement.appendChild(childElement);
  decoratedElement.appendChild(removeButton);

  return decoratedElement;
};

const buildArrayInput = (schema, parentState) => {
  const itemType = schema.items.type;
  const inputControlsDiv = document.createElement("div");
  inputControlsDiv.classList.add("array-input-controls");

  const addButton = document.createElement("button");
  addButton.innerHTML = "Add One";
  addButton.classList.add("array-input", "button");
  addButton.addEventListener("click", () => {
    parentState.push(defaultValueForType(itemType));
    rerender();
  });

  const removeButton = document.createElement("button");
  removeButton.innerHTML = "Delete All";
  removeButton.classList.add("array-input", "array-input-delete", "button");
  removeButton.addEventListener("click", () => {
    parentState.splice(0, parentState.length);
    rerender();
  });

  inputControlsDiv.appendChild(addButton);
  inputControlsDiv.appendChild(removeButton);

  return inputControlsDiv;
};

const buildUnknownInput = () => {
  const disclaimer = document.createElement("div");
  disclaimer.innerHTML = `<i class="unknown-input">This configuration is not yet supported</i>`;

  return disclaimer;
};

const render = (state, schema) => {
  const build = (
    schema,
    state,
    parentState,
    currentKey = "",
    path = "configuration"
  ) => {
    const parent = document.createElement("div");
    parent.classList.add("form-element");

    const { type, label, hint, fields, items } = schema;

    if (label) {
      parent.appendChild(buildLabel(type, label, hint));
    }

    parent.id = path;

    if (type === "object") {
      const entries = Object.entries(fields);
      entries.forEach(([key, value]) => {
        if (!state[key]) {
          state[key] = defaultValueForType(value.type);
        }

        const childElement = build(
          value,
          state[key],
          state,
          key,
          `${path}.${key}`
        );
        parent.appendChild(childElement);
      });
    } else if (type === "array") {
      const arrayInputControls = buildArrayInput(schema, state);
      parent.appendChild(arrayInputControls);

      if (state && state.length > 0) {
        state.forEach((element, index) => {
          const childElement = build(
            items,
            element,
            state,
            index,
            `${path}[${index}]`
          );

          const decoratedChildElement = arrayFormElementDecorator(
            childElement,
            state,
            index
          );
          parent.appendChild(decoratedChildElement);
        });
      }
    } else if (type === "number") {
      parent.appendChild(buildNumberInput(schema, parentState, currentKey));
      parent.classList.add("input-label");
    } else if (type === "string") {
      parent.appendChild(buildStringInput(parentState, currentKey));
      parent.classList.add("input-label");
    } else if (type === "boolean") {
      parent.appendChild(buildBooleanInput(parentState, currentKey));
      parent.classList.add("input-label");
    } else {
      parent.appendChild(buildUnknownInput());
    }

    return parent;
  };

  return build(schema, state, state);
};

function rerender() {
  const root = document.querySelector("#root");
  root.innerHTML = "";
  root?.append(render(state, schema));
}

window.onload = async () => {
  const [schemaResponse, dataResponse] = await Promise.all([
    fetch("/configuration/schema"),
    fetch("/configuration"),
  ]);

  const [schemaResponseJson, dataResponseJson] = await Promise.all([
    schemaResponse.json(),
    dataResponse.json(),
  ]);

  if (schemaResponse.status !== 200 || dataResponse.status !== 200) {
    const root = document.querySelector("#root");
    let html = "";
    if (schemaResponse.status !== 200) {
      html += `<i class="unknown-input">Error fetching configuration schema: ${schemaResponseJson.message}</i>`;
    }
    if (dataResponse.status !== 200) {
      html += `<i class="unknown-input">Error fetching configuration data: ${dataResponseJson.message}</i>`;
    }
    root.innerHTML = html;
    return;
  }

  const { data: formSchema } = schemaResponseJson;
  const { data: initialData } = dataResponseJson;

  state = initialData;
  schema = formSchema;

  rerender();

  const saveButton = document.querySelector("#save");

  saveButton?.addEventListener("click", async () => {
    if (saveButton.disabled) {
      return;
    }

    saveButton.innerHTML = "Saving...";
    saveButton.disabled = true;
    const response = await fetch("/configuration", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        configuration: state,
      }),
    });
    if (response.status === 200) {
      saveButton.innerHTML = "Saved!";
      saveButton.classList.add("good");
    } else {
      saveButton.innerHTML = "Failed!";
      saveButton.classList.add("bad");
    }
    setTimeout(() => {
      saveButton.innerHTML = "Save Changes";
      saveButton.classList.remove("good");
      saveButton.classList.remove("bad");
      saveButton.disabled = false;
    }, 3000);
  });
};
