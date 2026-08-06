// Custom rounded-rectangle geometry to mimic iOS pill buttons.
AFRAME.registerComponent("pill-button", {
  schema: {
    width: { type: "number", default: 1.6 },
    height: { type: "number", default: 0.42 },
    radius: { type: "number", default: 0.21 },
    depth: { type: "number", default: 0.012 }
  },
  init() {
    this.createGeometry();
  },
  update(oldData) {
    if (
      oldData.width !== this.data.width ||
      oldData.height !== this.data.height ||
      oldData.radius !== this.data.radius ||
      oldData.depth !== this.data.depth
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
    const depth = Math.max(this.data.depth, 0.001);

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

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: false
    });
    geometry.translate(0, 0, -depth / 2);
    geometry.computeVertexNormals();

    let mesh = this.el.getObject3D("mesh");
    if (!mesh) {
      mesh = new THREE.Mesh(geometry);
      this.el.setObject3D("mesh", mesh);
    } else {
      mesh.geometry.dispose();
      mesh.geometry = geometry;
    }

    if (mesh) {
      mesh.castShadow = false;
      mesh.receiveShadow = false;
    }
  }
});

const COLORS = {
  present: "#F70E56",
  future: "#07CC68",
  background: "#091017",
  text: "#ffffff"
};

const BUTTON_DEPTH = 0.012;
const BUTTON_SHADOW_OFFSET = 0.012;
const BUTTON_SHADOW_OPACITY = 0.32;
const BUTTON_TEXT_Z_OFFSET = 0.015;

const BUTTON_DIMENSIONS = {
  scenario: { width: 1.46, height: 0.42, radius: 0.21 },
  timeframe: { width: 1.0, height: 0.38, radius: 0.19 },
  home: { width: 0.36, height: 0.36, radius: 0.18 }
};

function pillSpec({ width, height, radius, depth }) {
  const targetDepth = depth != null ? depth : BUTTON_DEPTH;
  return `width: ${width}; height: ${height}; radius: ${radius}; depth: ${targetDepth}`;
}

function findChildByClass(el, className) {
  return Array.from(el.children).find((child) =>
    child.classList && child.classList.contains(className)
  );
}

function ensureButtonShadow(button, dims) {
  const shadowDims = {
    width: dims.width,
    height: dims.height,
    radius: dims.radius,
    depth: 0.003
  };
  let shadow = findChildByClass(button, "button-shadow");
  if (!shadow) {
    shadow = document.createElement("a-entity");
    shadow.classList.add("button-shadow");
    button.insertBefore(shadow, button.firstChild);
  }

  shadow.setAttribute("pill-button", pillSpec(shadowDims));
  shadow.setAttribute(
    "material",
    `shader: flat; color: #000; transparent: true; opacity: ${BUTTON_SHADOW_OPACITY}; side: back; depthWrite: false; depthTest: false`
  );
  shadow.setAttribute("position", `0 0 ${BUTTON_SHADOW_OFFSET}`);
  shadow.setAttribute("scale", "1.04 1.04 1");
  shadow.classList.remove("clickable");
  shadow.setAttribute("render-order", "1");
}

function setShadowVisual(button, state) {
  const shadow = findChildByClass(button, "button-shadow");
  if (!shadow) return;

  let opacity = BUTTON_SHADOW_OPACITY;
  let scale = 1.04;

  switch (state) {
    case "active":
      opacity = 0.45;
      scale = 1.08;
      break;
    case "hover":
      opacity = 0.38;
      scale = 1.06;
      break;
    case "inactive":
      opacity = 0.24;
      scale = 1.02;
      break;
    case "disabled":
      opacity = 0.15;
      scale = 1.0;
      break;
    default:
      break;
  }

  shadow.setAttribute(
    "material",
    `shader: flat; color: #000; transparent: true; opacity: ${opacity}; side: back; depthWrite: false; depthTest: false`
  );
  shadow.setAttribute("scale", `${scale} ${scale} 1`);
}

const scenarios = [
  {
    id: "mexico-city",
    label: "Mexico City center",
    present: {
      asset: "#asset-mexico-present",
      description:
        "A narrow colonial intersection in Mexico City’s Centro Histórico is dominated by asphalt, faded crosswalks, scattered bollards, minimal greenery, and occasional delivery vans.\n\nThe space shifted from car-oriented, asphalt-heavy streets to a pedestrian- and cyclist-first environment with integrated greenery, flexible curb use, and inclusive mobility infrastructure."
    },
    future: {
      asset: "#asset-mexico-future",
      description:
        "The same intersection becomes a superblock shared-space with cobblestone paving, shaded cycle tracks lined by trees, modular vendor and cargo kiosks, wider sidewalks, and car-free priority for people.\n\nThe space shifted from car-oriented, asphalt-heavy streets to a pedestrian- and cyclist-first environment with integrated greenery, flexible curb use, and inclusive mobility infrastructure."
    }
  },
  {
    id: "chicago",
    label: "Chicago Garfield Park",
    present: {
      asset: "#asset-chicago-present",
      description:
        "A Lake Street viaduct in downtown Chicago is framed by elevated train tracks, multi-lane car traffic, narrow sidewalks, and sparse greenery.\n\nCars and delivery trucks dominate every level of the corridor, making the space noisy, dark, and difficult to navigate on foot or by bike."
    },
    future: {
      asset: "#asset-chicago-future",
      description:
        "The same corridor is converted into a people-first transit promenade with wider sidewalks, continuous protected bike lanes, bright lighting, and lush planters beneath the elevated tracks.\n\nFlexible curb uses support shared shuttles, micromobility docks, and street-level retail that animate the space throughout the day."
    }
  },
  {
    id: "london",
    label: "London South Bank",
    present: {
      asset: "#asset-london-present",
      description:
        "A parking-lined junction with painted bike symbols, minimal greenery, and kerb conflicts that swell at night."
    },
    future: {
      asset: "#asset-london-future",
      description:
        "A green, calm Paul × Willow with rain-garden corners, tree canopy, raised continuous crossings, protected cycle flow, and organised loading/PHV bays."
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

if (homeButton) {
  homeButton.removeAttribute("geometry");
  homeButton.setAttribute("pill-button", pillSpec(BUTTON_DIMENSIONS.home));
  ensureButtonShadow(homeButton, BUTTON_DIMENSIONS.home);
  const homeLabel = homeButton.querySelector("a-text");
  if (homeLabel) {
    homeLabel.setAttribute("position", `0 0 ${BUTTON_TEXT_Z_OFFSET}`);
    homeLabel.setAttribute("scale", "1.5 1.5 1");
  }
}

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
  const state = options.state || "default";
  const emissive = mixColor(color, COLORS.text, 0.12);
  button.setAttribute(
    "material",
    `shader: standard; color: ${color}; metalness: 0; roughness: 0.55; emissive: ${emissive}; emissiveIntensity: 0.22; transparent: true; opacity: ${opacity}; side: double`
  );
  button.setAttribute("scale", `${scale} ${scale} 1`);
  button.dataset.buttonState = state;
  setShadowVisual(button, state);
}

function styleScenarioButton(button, state) {
  const baseColor = mixColor(COLORS.future, COLORS.background, 0.25);
  let color = baseColor;
  let opacity = 0.96;
  let scale = 1;

  if (state === "hover") {
    color = mixColor(COLORS.future, COLORS.text, 0.16);
    opacity = 1;
    scale = 1.05;
  }

  applyPillStyle(button, color, { opacity, scale, state });

  const label = button.querySelector("a-text");
  if (label) {
    label.setAttribute("color", COLORS.text);
    label.setAttribute("opacity", 1);
  }
}

function setTimeframeVisual(button, timeframe, state) {
  const baseColor = timeframe === "present" ? COLORS.present : COLORS.future;
  let color = mixColor(baseColor, COLORS.background, 0.25);
  let opacity = 0.97;
  let scale = 1;

  switch (state) {
    case "active":
      color = baseColor;
      opacity = 1;
      scale = 1.06;
      break;
    case "hover":
      color = mixColor(baseColor, COLORS.text, 0.18);
      opacity = 1;
      scale = 1.04;
      break;
    case "inactive":
      color = mixColor(baseColor, COLORS.background, 0.5);
      opacity = 0.88;
      break;
    case "disabled":
      color = mixColor(baseColor, COLORS.background, 0.78);
      opacity = 0.42;
      break;
    default:
      break;
  }

  applyPillStyle(button, color, { opacity, scale, state });

  const label = button.querySelector("a-text");
  if (label) {
    const labelOpacity = state === "disabled" ? 0.55 : 1;
    label.setAttribute("color", COLORS.text);
    label.setAttribute("opacity", labelOpacity);
  }
}

function styleHomeButton(state) {
  let color = mixColor(COLORS.future, COLORS.background, 0.15);
  let opacity = 0.97;
  let scale = 1;

  if (state === "hover") {
    color = mixColor(COLORS.future, COLORS.text, 0.18);
    opacity = 1;
    scale = 1.06;
  }

  applyPillStyle(homeButton, color, { opacity, scale, state });

  const label = homeButton.querySelector("a-text");
  if (label) {
    const labelOpacity = state === "hover" ? 1 : 0.92;
    const labelColor = mixColor(COLORS.background, COLORS.future, 0.25);
    label.setAttribute("color", labelColor);
    label.setAttribute("opacity", labelOpacity);
    const labelScale = state === "hover" ? "1.6 1.6 1" : "1.5 1.5 1";
    label.setAttribute("scale", labelScale);
  }
}

function buildHomeMenu() {
  clearChildren(scenarioButtonContainer);
  scenarioButtons.clear();

  const spacing = scenarios.length > 2 ? 0.48 : 0.58;
  const startOffset = 0;
  const startY = ((scenarios.length - 1) * spacing) / 2;

  scenarios.forEach((scenario, index) => {
    const button = document.createElement("a-entity");
    button.setAttribute("class", "scenario-button clickable");
    button.setAttribute("pill-button", pillSpec(BUTTON_DIMENSIONS.scenario));
    button.setAttribute(
      "position",
      `0 ${startOffset + startY - index * spacing} 0`
    );
    button.setAttribute("render-order", "2");
    button.dataset.scenarioId = scenario.id;
    ensureButtonShadow(button, BUTTON_DIMENSIONS.scenario);

    const label = document.createElement("a-text");
    label.setAttribute("value", scenario.label);
    label.setAttribute("align", "center");
    label.setAttribute("width", "1.3");
    label.setAttribute("shader", "msdf");
    label.setAttribute(
      "font",
      "https://cdn.aframe.io/fonts/Roboto-msdf.json"
    );
    label.setAttribute("position", `0 0 ${BUTTON_TEXT_Z_OFFSET}`);
    label.setAttribute("baseline", "center");
    label.setAttribute("wrap-count", "22");
    label.setAttribute("scale", "1.4 1.4 1");
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
    { timeframe: "present", label: "Present", position: "-0.55 0 0" },
    { timeframe: "future", label: "Future", position: "0.55 0 0" }
  ];

  entries.forEach((entry) => {
    const button = document.createElement("a-entity");
    button.setAttribute("class", "timeframe-button clickable");
    button.setAttribute("pill-button", pillSpec(BUTTON_DIMENSIONS.timeframe));
    button.setAttribute("position", entry.position);
    button.setAttribute("render-order", "2");
    button.dataset.timeframe = entry.timeframe;
    ensureButtonShadow(button, BUTTON_DIMENSIONS.timeframe);

    const label = document.createElement("a-text");
    label.setAttribute("value", entry.label);
    label.setAttribute("align", "center");
    label.setAttribute("width", "0.72");
    label.setAttribute("shader", "msdf");
    label.setAttribute(
      "font",
      "https://cdn.aframe.io/fonts/Roboto-msdf.json"
    );
    label.setAttribute("position", `0 0 ${BUTTON_TEXT_Z_OFFSET}`);
    label.setAttribute("baseline", "center");
    label.setAttribute("wrap-count", "14");
    label.setAttribute("scale", "1.55 1.55 1");
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
  infoText.setAttribute("value", "");

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

const assetsContainer = document.querySelector("a-assets");
const adminOverlay = document.getElementById("adminOverlay");
const openAdminButton = document.getElementById("openAdmin");
const closeAdminButton = document.getElementById("closeAdmin");
const cityNameInput = document.getElementById("cityName");
const cityDistrictInput = document.getElementById("cityDistrict");
const cityYearInput = document.getElementById("cityYear");
const cityLabelInput = document.getElementById("cityLabel");
const pastImageInput = document.getElementById("pastImageInput");
const futureImageInput = document.getElementById("futureImageInput");
const pastPreview = document.getElementById("pastPreview");
const futurePreview = document.getElementById("futurePreview");
const pastMeta = document.getElementById("pastMeta");
const futureMeta = document.getElementById("futureMeta");
const sceneInventoryInput = document.getElementById("sceneInventory");
const sceneFrictionsInput = document.getElementById("sceneFrictions");
const sceneEquityInput = document.getElementById("sceneEquity");
const sceneAssetsInput = document.getElementById("sceneAssets");
const refOtherInput = document.getElementById("refOther");
const interventionOtherInput = document.getElementById("interventionOther");
const futurePrioritiesInput = document.getElementById("futurePriorities");
const futureMobilityMixInput = document.getElementById("futureMobilityMix");
const futurePublicRealmInput = document.getElementById("futurePublicRealm");
const futureClimateInput = document.getElementById("futureClimate");
const generatePromptButton = document.getElementById("generatePrompt");
const copyPromptButton = document.getElementById("copyPrompt");
const promptOutput = document.getElementById("promptOutput");
const promptStatus = document.getElementById("promptStatus");
const presentDescriptionInput = document.getElementById("presentDescription");
const futureDescriptionInput = document.getElementById("futureDescription");
const addScenarioButton = document.getElementById("addScenarioButton");
const adminStatus = document.getElementById("adminStatus");

const adminState = {
  presentAssetId: null,
  futureAssetId: null,
  presentDataUrl: null,
  futureDataUrl: null
};

let cityLabelTouched = false;

function setStatus(el, message, status) {
  if (!el) return;
  el.textContent = message;
  if (status) {
    el.dataset.status = status;
  } else {
    el.removeAttribute("data-status");
  }
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function createScenarioId(base) {
  const slug = slugify(base || "custom-city");
  let candidate = slug || "custom-city";
  let counter = 1;
  while (scenarios.some((scenario) => scenario.id === candidate)) {
    counter += 1;
    candidate = `${slug}-${counter}`;
  }
  return candidate;
}

function ensureAsset(id, dataUrl) {
  if (!assetsContainer) return null;
  let img = document.getElementById(id);
  if (!img) {
    img = document.createElement("img");
    img.setAttribute("id", id);
    assetsContainer.appendChild(img);
  }
  img.setAttribute("src", dataUrl);
  return `#${id}`;
}

function updateAspectRatioMeta(metaEl, width, height) {
  if (!metaEl || !width || !height) return;
  const ratio = width / height;
  const ratioLabel = ratio.toFixed(2);
  const ratioOk = Math.abs(ratio - 2) <= 0.05;
  const status = ratioOk ? "ok" : "warn";
  const hint = ratioOk ? "✓ 2:1 equirectangular" : "Consider a 2:1 image";
  setStatus(
    metaEl,
    `${width} × ${height} (${ratioLabel}:1) • ${hint}`,
    status
  );
}

function loadImageFile({
  file,
  previewEl,
  metaEl,
  stateKey,
  assetPrefix
}) {
  if (!file) return;
  const reader = new FileReader();
  const objectUrl = URL.createObjectURL(file);
  const probe = new Image();

  probe.onload = () => {
    updateAspectRatioMeta(metaEl, probe.width, probe.height);
    URL.revokeObjectURL(objectUrl);
  };
  probe.src = objectUrl;

  reader.onload = () => {
    const dataUrl = reader.result;
    if (typeof dataUrl !== "string") return;
    if (previewEl) {
      previewEl.src = dataUrl;
    }
    const assetId = `${assetPrefix}-${Date.now()}`;
    const assetRef = ensureAsset(assetId, dataUrl);
    adminState[stateKey] = dataUrl;
    adminState[`${stateKey.replace("DataUrl", "AssetId")}`] = assetId;
    updateAddScenarioButton();
    if (!assetRef) return;
  };

  reader.readAsDataURL(file);
}

function getCheckedValues(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`))
    .map((input) => input.value)
    .filter(Boolean);
}

function getValue(input) {
  if (!input) return "";
  return input.value.trim();
}

function buildPrompt() {
  const city = getValue(cityNameInput);
  const district = getValue(cityDistrictInput);
  const year = getValue(cityYearInput);
  const inventory = getValue(sceneInventoryInput);
  const frictions = getValue(sceneFrictionsInput);
  const equity = getValue(sceneEquityInput);
  const assets = getValue(sceneAssetsInput);
  const references = [
    ...getCheckedValues("reference"),
    getValue(refOtherInput)
  ].filter(Boolean);
  const interventions = [
    ...getCheckedValues("intervention"),
    getValue(interventionOtherInput)
  ].filter(Boolean);
  const priorities = getValue(futurePrioritiesInput);
  const mobilityMix = getValue(futureMobilityMixInput);
  const publicRealm = getValue(futurePublicRealmInput);
  const climate = getValue(futureClimateInput);

  const lines = [
    "Edit the provided 2:1 equirectangular 360° photo to depict a preferable future for urban mobility.",
    "Keep the exact camera position, horizon level, and overall perspective."
  ];

  if (city || district || year) {
    const locationLine = [
      city ? `City: ${city}` : null,
      district ? `District: ${district}` : null,
      year ? `Past snapshot year: ${year}` : null
    ]
      .filter(Boolean)
      .join(" | ");
    lines.push(locationLine);
  }

  if (inventory) {
    lines.push(`Current scene inventory: ${inventory}`);
  }
  if (frictions) {
    lines.push(`Mobility pain points: ${frictions}`);
  }
  if (equity) {
    lines.push(`Equity + access gaps: ${equity}`);
  }
  if (assets) {
    lines.push(`Assets to preserve: ${assets}`);
  }
  if (interventions.length) {
    lines.push(
      `Future interventions to add or amplify: ${interventions.join("; ")}.`
    );
  }
  if (priorities) {
    lines.push(`Priority outcomes: ${priorities}.`);
  }
  if (mobilityMix) {
    lines.push(`Mobility mix to show: ${mobilityMix}.`);
  }
  if (publicRealm) {
    lines.push(`Public realm mood: ${publicRealm}.`);
  }
  if (climate) {
    lines.push(`Climate + nature goals: ${climate}.`);
  }
  if (references.length) {
    lines.push(
      `Reference initiatives and design cues: ${references.join("; ")}.`
    );
  }

  lines.push(
    "Rendering constraints: photorealistic, consistent lighting with the original, preserve building massing and skyline, realistic scale for people/vehicles, seamless 360° stitching, no warped poles, no text overlays or watermarks."
  );

  return lines.join("\n\n");
}

function buildPresentDescription() {
  const city = getValue(cityNameInput);
  const district = getValue(cityDistrictInput);
  const inventory = getValue(sceneInventoryInput);
  const frictions = getValue(sceneFrictionsInput);
  const equity = getValue(sceneEquityInput);
  const assets = getValue(sceneAssetsInput);
  const parts = [];

  if (city || district) {
    parts.push(
      `${district ? district + ", " : ""}${city || "This area"} shows the current mobility conditions.`
    );
  }
  if (inventory) {
    parts.push(inventory);
  }
  if (frictions) {
    parts.push(frictions);
  }
  if (equity) {
    parts.push(equity);
  }
  if (assets) {
    parts.push(assets);
  }

  return parts.filter(Boolean).join("\n\n");
}

function buildFutureDescription() {
  const priorities = getValue(futurePrioritiesInput);
  const mobilityMix = getValue(futureMobilityMixInput);
  const publicRealm = getValue(futurePublicRealmInput);
  const climate = getValue(futureClimateInput);
  const interventions = [
    ...getCheckedValues("intervention"),
    getValue(interventionOtherInput)
  ].filter(Boolean);
  const references = [
    ...getCheckedValues("reference"),
    getValue(refOtherInput)
  ].filter(Boolean);
  const parts = [];

  if (interventions.length) {
    parts.push(`Future interventions: ${interventions.join(", ")}.`);
  }
  if (priorities) {
    parts.push(priorities);
  }
  if (mobilityMix) {
    parts.push(mobilityMix);
  }
  if (publicRealm) {
    parts.push(publicRealm);
  }
  if (climate) {
    parts.push(climate);
  }
  if (references.length) {
    parts.push(`Inspired by: ${references.join(", ")}.`);
  }

  return parts.filter(Boolean).join("\n\n");
}

function updateAddScenarioButton() {
  if (!addScenarioButton) return;
  const ready =
    getValue(cityLabelInput) &&
    adminState.presentAssetId &&
    adminState.futureAssetId;
  addScenarioButton.disabled = !ready;
}

function openAdmin() {
  if (!adminOverlay) return;
  adminOverlay.classList.add("is-visible");
  adminOverlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("admin-open");
}

function closeAdmin() {
  if (!adminOverlay) return;
  adminOverlay.classList.remove("is-visible");
  adminOverlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("admin-open");
}

async function copyToClipboard(text) {
  if (!text) return false;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const success = document.execCommand("copy");
  document.body.removeChild(textarea);
  return success;
}

function addScenarioFromAdmin() {
  const label = getValue(cityLabelInput);
  if (!label) {
    setStatus(adminStatus, "Add a menu label before saving.", "warn");
    return;
  }
  if (!adminState.presentAssetId || !adminState.futureAssetId) {
    setStatus(
      adminStatus,
      "Upload both the past and future images before saving.",
      "warn"
    );
    return;
  }

  const scenarioId = createScenarioId(label);
  const presentDescription =
    getValue(presentDescriptionInput) || buildPresentDescription();
  const futureDescription =
    getValue(futureDescriptionInput) || buildFutureDescription();

  scenarios.push({
    id: scenarioId,
    label,
    present: {
      asset: `#${adminState.presentAssetId}`,
      description: presentDescription
    },
    future: {
      asset: `#${adminState.futureAssetId}`,
      description: futureDescription
    }
  });

  buildHomeMenu();
  exitToHome();
  setStatus(adminStatus, "City added to the experience.", "ok");
  closeAdmin();
}

function initAdminStudio() {
  if (openAdminButton) {
    openAdminButton.addEventListener("click", openAdmin);
  }
  if (closeAdminButton) {
    closeAdminButton.addEventListener("click", closeAdmin);
  }
  if (adminOverlay) {
    adminOverlay.addEventListener("click", (event) => {
      if (event.target === adminOverlay) {
        closeAdmin();
      }
    });
  }
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && adminOverlay?.classList.contains("is-visible")) {
      closeAdmin();
    }
  });

  if (cityNameInput && cityLabelInput) {
    cityNameInput.addEventListener("input", () => {
      if (cityLabelTouched) return;
      cityLabelInput.value = getValue(cityNameInput);
    });
    cityLabelInput.addEventListener("input", () => {
      cityLabelTouched = true;
    });
  }

  if (pastImageInput) {
    pastImageInput.addEventListener("change", (event) => {
      const file = event.target.files?.[0];
      loadImageFile({
        file,
        previewEl: pastPreview,
        metaEl: pastMeta,
        stateKey: "presentDataUrl",
        assetPrefix: "asset-custom-present"
      });
    });
  }

  if (futureImageInput) {
    futureImageInput.addEventListener("change", (event) => {
      const file = event.target.files?.[0];
      loadImageFile({
        file,
        previewEl: futurePreview,
        metaEl: futureMeta,
        stateKey: "futureDataUrl",
        assetPrefix: "asset-custom-future"
      });
    });
  }

  if (generatePromptButton) {
    generatePromptButton.addEventListener("click", () => {
      const prompt = buildPrompt();
      if (promptOutput) {
        promptOutput.value = prompt;
      }
      setStatus(promptStatus, "Prompt generated.", "ok");
    });
  }

  if (copyPromptButton) {
    copyPromptButton.addEventListener("click", async () => {
      const prompt = promptOutput ? promptOutput.value.trim() : "";
      if (!prompt) {
        setStatus(promptStatus, "Generate a prompt first.", "warn");
        return;
      }
      try {
        const success = await copyToClipboard(prompt);
        setStatus(
          promptStatus,
          success ? "Prompt copied to clipboard." : "Copy failed.",
          success ? "ok" : "warn"
        );
      } catch (error) {
        setStatus(promptStatus, "Copy failed.", "warn");
      }
    });
  }

  if (addScenarioButton) {
    addScenarioButton.addEventListener("click", addScenarioFromAdmin);
  }

  updateAddScenarioButton();
}

buildHomeMenu();
buildTimeframeControls();
styleHomeButton("default");
exitToHome();
initAdminStudio();
