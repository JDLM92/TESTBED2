// Custom rounded-rectangle geometry to mimic iOS pill buttons.
AFRAME.registerComponent("pill-button", {
  schema: {
    width: { type: "number", default: 1.6 },
    height: { type: "number", default: 0.42 },
    radius: { type: "number", default: 0.21 }
  },
  init() {
    this.createGeometry();
  },
  update(oldData) {
    if (
      oldData.width !== this.data.width ||
      oldData.height !== this.data.height ||
      oldData.radius !== this.data.radius
    ) {
      this.createGeometry();
    }
  },
  remove() {
    const mesh = this.el.getObject3D("mesh");
    if (mesh && mesh.geometry) {
      mesh.geometry.dispose();
    }
    this.el.removeObject3D("mesh");
  },
  createGeometry() {
    const width = Math.max(this.data.width, this.data.radius * 2 + 0.001);
    const height = Math.max(this.data.height, this.data.radius * 2 + 0.001);
    const radius = Math.min(this.data.radius, Math.min(width, height) / 2);

    const hw = width / 2;
    const hh = height / 2;
    const r = radius;

    const shape = new THREE.Shape();
    shape.moveTo(hw - r, hh);
    shape.absarc(hw - r, hh - r, r, 0, Math.PI / 2, false);
    shape.absarc(-hw + r, hh - r, r, Math.PI / 2, Math.PI, false);
    shape.absarc(-hw + r, -hh + r, r, Math.PI, Math.PI * 1.5, false);
    shape.absarc(hw - r, -hh + r, r, Math.PI * 1.5, Math.PI * 2, false);
    shape.closePath();

    const geometry = new THREE.ShapeGeometry(shape, 24);
    geometry.computeVertexNormals();

    let mesh = this.el.getObject3D("mesh");
    if (!mesh) {
      mesh = new THREE.Mesh(geometry);
      this.el.setObject3D("mesh", mesh);
    } else {
      mesh.geometry.dispose();
      mesh.geometry = geometry;
    }
  }
});

const COLORS = {
  present: "#F70E56",
  future: "#07CC68",
  background: "#091017",
  text: "#ffffff"
};

const scenarios = [
  {
    id: "mexico-city",
    label: "Mexico City Scenario",
    present: {
      asset: "#asset-mexico-present",
      description: "Mexico City's historic downtown captured in the present."
    },
    future: {
      asset: "#asset-mexico-future",
      description: "A speculative nightscape imagining Mexico City's future skyline."
    }
  }
];

const photoSphere = document.getElementById("photoSphere");
const infoText = document.getElementById("infoText");
const homeMenu = document.getElementById("homeMenu");
const scenarioControls = document.getElementById("scenarioControls");
const scenarioButtonContainer = document.getElementById("scenarioButtonContainer");
const timeframeToggle = document.getElementById("timeframeToggle");
const homeButton = document.getElementById("homeButton");

const timeframeButtons = new Map();
const scenarioButtons = new Map();

let activeScenario = null;
let activeTimeframe = "present";

function clearChildren(el) {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

function hexToRgb(hex) {
  const sanitized = hex.replace("#", "");
  const value = parseInt(sanitized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255
  };
}

function rgbToHex(r, g, b) {
  const toHex = (component) => component.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function mixColor(colorA, colorB, ratio) {
  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);
  const clampedRatio = Math.max(0, Math.min(1, ratio));
  const r = Math.round(a.r + (b.r - a.r) * clampedRatio);
  const g = Math.round(a.g + (b.g - a.g) * clampedRatio);
  const blue = Math.round(a.b + (b.b - a.b) * clampedRatio);
  return rgbToHex(r, g, blue);
}

function applyPillStyle(button, color, options = {}) {
  const opacity = options.opacity != null ? options.opacity : 0.96;
  const scale = options.scale != null ? options.scale : 1;
  button.setAttribute(
    "material",
    `shader: flat; color: ${color}; transparent: true; opacity: ${opacity}`
  );
  button.setAttribute("scale", `${scale} ${scale} 1`);
}

function styleScenarioButton(button, state) {
  const baseColor = COLORS.future;
  let color = baseColor;
  let opacity = 0.9;
  let scale = 1;

  if (state === "hover") {
    color = mixColor(baseColor, COLORS.text, 0.18);
    opacity = 1;
    scale = 1.04;
  }

  applyPillStyle(button, color, { opacity, scale });

  const label = button.querySelector("a-text");
  if (label) {
    label.setAttribute("color", COLORS.text);
    label.setAttribute("opacity", 1);
  }
}

function setTimeframeVisual(button, timeframe, state) {
  const baseColor = timeframe === "present" ? COLORS.present : COLORS.future;
  let color = baseColor;
  let opacity = 1;
  let scale = 1;

  switch (state) {
    case "active":
      color = baseColor;
      opacity = 1;
      scale = 1.08;
      break;
    case "hover":
      color = mixColor(baseColor, COLORS.text, 0.2);
      opacity = 1;
      scale = 1.04;
      break;
    case "inactive":
      color = mixColor(baseColor, COLORS.text, 0.08);
      opacity = 0.7;
      break;
    case "disabled":
      color = mixColor(baseColor, COLORS.background, 0.6);
      opacity = 0.35;
      break;
    default:
      break;
  }

  applyPillStyle(button, color, { opacity, scale });

  const label = button.querySelector("a-text");
  if (label) {
    const labelOpacity = state === "disabled" ? 0.55 : 1;
    label.setAttribute("color", COLORS.text);
    label.setAttribute("opacity", labelOpacity);
  }
}

function styleHomeButton(state) {
  let color = COLORS.background;
  let opacity = 0.85;

  if (state === "hover") {
    color = mixColor(COLORS.background, COLORS.text, 0.18);
    opacity = 1;
  }

  homeButton.setAttribute(
    "material",
    `shader: flat; color: ${color}; opacity: ${opacity}`
  );

  const label = homeButton.querySelector("a-text");
  if (label) {
    const labelOpacity = state === "hover" ? 1 : 0.85;
    label.setAttribute("color", COLORS.text);
    label.setAttribute("opacity", labelOpacity);
  }
}

function buildHomeMenu() {
  clearChildren(scenarioButtonContainer);
  scenarioButtons.clear();

  const spacing = 0.6;
  const startY = ((scenarios.length - 1) * spacing) / 2;

  scenarios.forEach((scenario, index) => {
    const button = document.createElement("a-entity");
    button.setAttribute("class", "scenario-button clickable");
    button.setAttribute("pill-button", "width: 1.6; height: 0.46; radius: 0.23");
    button.setAttribute("position", `0 ${startY - index * spacing} 0`);
    button.setAttribute("render-order", "2");
    button.dataset.scenarioId = scenario.id;

    const label = document.createElement("a-text");
    label.setAttribute("value", scenario.label);
    label.setAttribute("align", "center");
    label.setAttribute("width", "1.4");
    label.setAttribute("shader", "msdf");
    label.setAttribute(
      "font",
      "https://cdn.aframe.io/fonts/Roboto-msdf.json"
    );
    label.setAttribute("position", "0 0 0.01");
    button.appendChild(label);

    styleScenarioButton(button, "default");

    button.addEventListener("mouseenter", () => {
      styleScenarioButton(button, "hover");
    });

    button.addEventListener("mouseleave", () => {
      styleScenarioButton(button, "default");
    });

    button.addEventListener("click", () => {
      enterScenario(scenario);
    });

    scenarioButtonContainer.appendChild(button);
    scenarioButtons.set(scenario.id, button);
  });
}

function buildTimeframeControls() {
  clearChildren(timeframeToggle);
  timeframeButtons.clear();

  const entries = [
    { timeframe: "present", label: "Present", position: "-0.5 0 0" },
    { timeframe: "future", label: "Future", position: "0.5 0 0" }
  ];

  entries.forEach((entry) => {
    const button = document.createElement("a-entity");
    button.setAttribute("class", "timeframe-button clickable");
    button.setAttribute("pill-button", "width: 0.86; height: 0.34; radius: 0.17");
    button.setAttribute("position", entry.position);
    button.setAttribute("render-order", "2");
    button.dataset.timeframe = entry.timeframe;

    const label = document.createElement("a-text");
    label.setAttribute("value", entry.label);
    label.setAttribute("align", "center");
    label.setAttribute("width", "0.75");
    label.setAttribute("shader", "msdf");
    label.setAttribute(
      "font",
      "https://cdn.aframe.io/fonts/Roboto-msdf.json"
    );
    label.setAttribute("position", "0 0 0.01");
    button.appendChild(label);

    button.addEventListener("mouseenter", () => {
      if (!activeScenario) return;
      setTimeframeVisual(
        button,
        entry.timeframe,
        activeTimeframe === entry.timeframe ? "active" : "hover"
      );
    });

    button.addEventListener("mouseleave", () => {
      updateTimeframeButtons();
    });

    button.addEventListener("click", () => {
      if (!activeScenario) return;
      setActiveTimeframe(entry.timeframe);
    });

    timeframeToggle.appendChild(button);
    timeframeButtons.set(entry.timeframe, button);
  });

  updateTimeframeButtons();
}

function updateTimeframeButtons() {
  timeframeButtons.forEach((button, timeframe) => {
    if (!activeScenario) {
      setTimeframeVisual(button, timeframe, "disabled");
      return;
    }

    const state = timeframe === activeTimeframe ? "active" : "inactive";
    setTimeframeVisual(button, timeframe, state);
  });
}

function setActiveTimeframe(timeframe) {
  if (!activeScenario || activeTimeframe === timeframe) return;
  activeTimeframe = timeframe;
  updateTimeframeButtons();
  applyScenarioFrame();
}

function applyScenarioFrame() {
  if (!activeScenario) return;
  const frame = activeScenario[activeTimeframe];
  if (!frame) return;

  photoSphere.setAttribute("src", frame.asset);
  photoSphere.setAttribute("visible", true);
  infoText.setAttribute("value", frame.description);
}

function enterScenario(scenario) {
  activeScenario = scenario;
  activeTimeframe = "present";

  homeMenu.setAttribute("visible", false);
  scenarioControls.setAttribute("visible", true);
  styleHomeButton("default");

  updateTimeframeButtons();
  applyScenarioFrame();
}

function exitToHome() {
  activeScenario = null;
  activeTimeframe = "present";

  photoSphere.setAttribute("visible", false);
  infoText.setAttribute("value", "Select a scenario to explore future mobility.");

  homeMenu.setAttribute("visible", true);
  scenarioControls.setAttribute("visible", false);

  scenarioButtons.forEach((button) => {
    styleScenarioButton(button, "default");
  });

  updateTimeframeButtons();
}

homeButton.addEventListener("click", () => {
  exitToHome();
});

homeButton.addEventListener("mouseenter", () => {
  if (!activeScenario) return;
  styleHomeButton("hover");
});

homeButton.addEventListener("mouseleave", () => {
  styleHomeButton("default");
});

buildHomeMenu();
buildTimeframeControls();
styleHomeButton("default");
exitToHome();
