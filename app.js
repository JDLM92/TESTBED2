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
  home: { width: 0.72, height: 0.38, radius: 0.19 }
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
    location: "Centro Histórico · Mexico City",
    summary:
      "A historic intersection where traffic gives way to shade, movement, and street life.",
    themes: ["Shared streets", "Active mobility", "Urban greening"],
    thumbnail: "assets/thumbnails/mexico-city.jpg",
    present: {
      asset: "assets/mexico-city/present/Mexico City Present.png",
      description:
        "A narrow colonial intersection is dominated by asphalt, faded crossings, scattered bollards, minimal greenery, and occasional delivery vans.\n\nWalking, cycling, shade, and everyday street life compete with through-traffic and hard surfaces."
    },
    futures: [
      {
        id: "people-first-superblock",
        label: "People-first superblock",
        horizon: "Possible 2040",
        asset: "assets/mexico-city/future/Mexico City Future.jpg",
        description:
          "Through-traffic gives way to a shared street with cobblestone paving, shaded cycle movement, wider sidewalks, and space for deliveries, vendors, and lingering.\n\nThe visual keeps the historic fabric intact while giving people—not parked or passing vehicles—the clearest priority."
      }
    ],
    lens: {
      sceneType: "Historic city intersection",
      currentRead:
        "A compact historic junction with active edges and high walking potential, but little shade or protected space for people moving through it.",
      direction:
        "Rebalance access around a people-first superblock: keep essential deliveries, slow through-traffic, and turn the public realm into shade, movement, and street life.",
      rationale: {
        recommendation:
          "Recommended because this compact historic junction has high walking potential, constrained historic fabric, and delivery requirements. Managed shared access addresses all three conditions.",
        tradeoff:
          "A fully pedestrianized alternative is not shown because essential deliveries and the street's everyday working life still need managed access."
      },
      references: [
        {
          type: "Local condition",
          location: "Centro Histórico · Mexico City",
          label: "Shared-street access",
          detail:
            "The verified pilot view shows active street edges and delivery pressure alongside high walking potential.",
          provenance: "Verified pilot panorama · precomputed scene reading"
        },
        {
          type: "Transferable precedent",
          location: "South Bank · London",
          label: "Cooling + crossings",
          detail:
            "Pair safer movement with planted edges and a more comfortable walking environment.",
          provenance:
            "Prototype reference record · source, date, outcomes, and ranking details connect with the live repository"
        }
      ],
      analysisSteps: [
        "Checking the 360° source view",
        "Reading movement, shade, and street edges",
        "Matching comparable mobility situations",
        "Preparing a place-specific direction"
      ],
      generationSteps: [
        "Building the visual brief",
        "Creating candidate scene changes",
        "Checking historic fabric and camera continuity",
        "Verifying people-first mobility is visible"
      ],
      qualityChecks: [
        "Camera position and street geometry retained",
        "Historic façades and local street activity preserved",
        "People, trees, and mobility changes remain plausible"
      ]
    }
  },
  {
    id: "chicago",
    label: "Chicago Garfield Park",
    location: "Garfield Park · Chicago",
    summary:
      "A corridor beneath the L becomes a brighter, safer route for everyday journeys.",
    themes: ["Transit priority", "Public realm", "Micromobility"],
    thumbnail: "assets/thumbnails/chicago.jpg",
    present: {
      asset: "assets/chicago/present/Chicago Garfield Park Today.png",
      description:
        "A Lake Street viaduct in downtown Chicago is framed by elevated train tracks, multi-lane car traffic, narrow sidewalks, and sparse greenery.\n\nCars and delivery trucks dominate every level of the corridor, making the space noisy, dark, and difficult to navigate on foot or by bike."
    },
    futures: [
      {
        id: "transit-promenade",
        label: "Transit promenade",
        horizon: "Possible 2040",
        asset: "assets/chicago/future/Chicago Future.jpg",
        description:
          "The same corridor is converted into a people-first transit promenade with wider sidewalks, continuous protected bike lanes, bright lighting, and lush planters beneath the elevated tracks.\n\nFlexible curb uses support shared shuttles, micromobility docks, and street-level retail that animate the space throughout the day."
      }
    ],
    lens: {
      sceneType: "Elevated transit corridor",
      currentRead:
        "An active transit street where elevated infrastructure, vehicle lanes, and narrow sidewalks make everyday walking and cycling feel secondary.",
      direction:
        "Turn the corridor into a transit promenade: let rail remain the backbone while better lighting, protected cycling, planted edges, and managed kerbs support life beneath it.",
      rationale: {
        recommendation:
          "Recommended because the corridor already carries high transit activity, while vehicle lanes, low light, and narrow sidewalks make transfers and short trips feel secondary.",
        tradeoff:
          "Full vehicle removal is not shown because service, emergency access, and managed kerb activity still need a legible route beneath the elevated structure."
      },
      references: [
        {
          type: "Transferable precedent",
          location: "Centro Histórico · Mexico City",
          label: "Active street life",
          detail:
            "Make necessary access and daily activity work together instead of giving the corridor entirely to passing traffic.",
          provenance:
            "Prototype reference record · source, date, outcomes, and ranking details connect with the live repository"
        },
        {
          type: "Transferable precedent",
          location: "South Bank · London",
          label: "Safe local movement",
          detail:
            "Use continuous crossings and calmer kerb conditions to make short journeys more comfortable.",
          provenance:
            "Prototype reference record · source, date, outcomes, and ranking details connect with the live repository"
        }
      ],
      analysisSteps: [
        "Checking the 360° source view",
        "Reading transit, vehicle, and walking conditions",
        "Finding corridor and public-realm precedents",
        "Preparing a transit-led direction"
      ],
      generationSteps: [
        "Building the visual brief",
        "Creating candidate scene changes",
        "Checking elevated structure and street continuity",
        "Verifying transit, walking, and cycling remain legible"
      ],
      qualityChecks: [
        "Elevated infrastructure and camera geometry retained",
        "Street scale, buildings, and human activity preserved",
        "New movement layers read clearly without visual artifacts"
      ]
    }
  },
  {
    id: "london",
    label: "London South Bank",
    location: "South Bank · London",
    summary:
      "A car-led junction becomes a calmer, greener street for people moving through it.",
    themes: ["Climate resilience", "Safe crossings", "Cycle network"],
    thumbnail: "assets/thumbnails/london.jpg",
    present: {
      asset: "assets/london/present/London Present.png",
      description:
        "A parking-lined junction with painted bike symbols, minimal greenery, and kerb conflicts that swell at night."
    },
    futures: [
      {
        id: "green-neighborhood-street",
        label: "Green neighborhood street",
        horizon: "Possible 2040",
        asset: "assets/london/future/London Future.png",
        description:
          "A calmer South Bank junction with rain-garden corners, tree canopy, raised continuous crossings, protected cycle flow, and organised loading bays.\n\nThe future gives walking and cycling a continuous, legible route while helping the street hold more shade and rainwater."
      }
    ],
    lens: {
      sceneType: "Neighbourhood junction",
      currentRead:
        "A junction where parked cars, turning traffic, and thin green cover make walking and cycling feel like afterthoughts.",
      direction:
        "Create a green neighbourhood street with slower turning movements, continuous crossings, protected cycle flow, and planted rain-garden corners.",
      rationale: {
        recommendation:
          "Recommended because turning traffic, parking, and thin green cover interrupt short walking and cycling journeys at a compact local junction.",
        tradeoff:
          "A full street closure is not shown because local access and loading still need to work while crossings and cycle movement become continuous."
      },
      references: [
        {
          type: "Transferable precedent",
          location: "Centro Histórico · Mexico City",
          label: "Shared space + shade",
          detail:
            "Use public-realm materials and trees to make a street feel more useful and comfortable at walking speed.",
          provenance:
            "Prototype reference record · source, date, outcomes, and ranking details connect with the live repository"
        },
        {
          type: "Transferable precedent",
          location: "Garfield Park · Chicago",
          label: "Networked movement",
          detail:
            "Make cycling and walking continuous rather than isolated markings between vehicle lanes.",
          provenance:
            "Prototype reference record · source, date, outcomes, and ranking details connect with the live repository"
        }
      ],
      analysisSteps: [
        "Checking the 360° source view",
        "Reading crossings, parking, and green cover",
        "Matching calm-street and resilience precedents",
        "Preparing a climate-ready direction"
      ],
      generationSteps: [
        "Building the visual brief",
        "Creating candidate scene changes",
        "Checking buildings, kerbs, and camera continuity",
        "Verifying crossings, shade, and cycle flow are visible"
      ],
      qualityChecks: [
        "Street geometry and building context retained",
        "Greenery reads as mature and plausible for the horizon",
        "Crossings, cycle movement, and kerb changes remain clear"
      ]
    }
  }
];

const photoSphere = document.getElementById("photoSphere");
const futureSphere = document.getElementById("futureSphere");
const infoText = document.getElementById("infoText");
const homeMenu = document.getElementById("homeMenu");
const scenarioControls = document.getElementById("scenarioControls");
const scenarioButtonContainer = document.getElementById("scenarioButtonContainer");
const scenarioCatalog = document.getElementById("scenarioCatalog");
const scenarioCardGrid = document.getElementById("scenarioCardGrid");
const immersiveViewer = document.getElementById("immersiveViewer");
const backToCatalogButton = document.getElementById("backToCatalog");
const activeScenarioLocation = document.getElementById("activeScenarioLocation");
const activeScenarioTitle = document.getElementById("activeScenarioTitle");
const comparisonDock = document.getElementById("comparisonDock");
const toggleComparisonDockButton = document.getElementById(
  "toggleComparisonDock"
);
const dockStateLabel = document.getElementById("dockStateLabel");
const futureDirectionButton = document.getElementById("futureDirectionButton");
const futureDirectionLabel = document.getElementById("futureDirectionLabel");
const futureOptionsMenu = document.getElementById("futureOptionsMenu");
const selectPresentButton = document.getElementById("selectPresent");
const selectFutureButton = document.getElementById("selectFuture");
const holdCompareButton = document.getElementById("holdCompare");
const holdCompareLabel = document.getElementById("holdCompareLabel");
const openScenarioInfoButton = document.getElementById("openScenarioInfo");
const closeScenarioInfoButton = document.getElementById("closeScenarioInfo");
const scenarioInfoSheet = document.getElementById("scenarioInfoSheet");
const scenarioInfoEyebrow = document.getElementById("scenarioInfoEyebrow");
const scenarioInfoTitle = document.getElementById("scenarioInfoTitle");
const scenarioInfoDescription = document.getElementById(
  "scenarioInfoDescription"
);
const scenarioInfoThemes = document.getElementById("scenarioInfoThemes");
const scenarioInfoProvenance = document.getElementById(
  "scenarioInfoProvenance"
);
const timeframeToggle = document.getElementById("timeframeToggle");
const homeButton = document.getElementById("homeButton");
const sceneElement = immersiveViewer?.querySelector("a-scene");
const player = document.getElementById("player");
const shareScenarioButton = document.getElementById("shareScenario");
const viewerLiveStatus = document.getElementById("viewerLiveStatus");

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
const scenarioCards = new Map();

let activeScenario = null;
let activeTimeframe = "present";
let activeFutureIndex = 0;
let comparisonReturnTimeframe = null;
let loadedFutureAsset = "";
let queuedFutureAsset = "";
let futureLoadHandle = null;
let isApplyingRoute = false;
let lastAppliedHash = null;

function clearChildren(el) {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

function setViewerLiveStatus(message) {
  if (viewerLiveStatus) viewerLiveStatus.textContent = message;
}

function disposePanoramaTexture(sphere) {
  const mesh = sphere?.getObject3D?.("mesh");
  const material = mesh?.material;
  if (!material?.map) return;
  material.map.dispose?.();
  material.map = null;
  material.needsUpdate = true;
}

function cancelQueuedFutureLoad() {
  if (futureLoadHandle == null) return;
  if (window.cancelIdleCallback) {
    window.cancelIdleCallback(futureLoadHandle);
  } else {
    window.clearTimeout(futureLoadHandle);
  }
  futureLoadHandle = null;
  queuedFutureAsset = "";
}

function loadFuturePanorama(asset) {
  if (!futureSphere || !asset) return;
  cancelQueuedFutureLoad();
  if (loadedFutureAsset !== asset) {
    futureSphere.setAttribute("src", asset);
    loadedFutureAsset = asset;
  }
  futureSphere.setAttribute("visible", true);
}

function queueFuturePanorama(asset) {
  if (!asset || loadedFutureAsset === asset || queuedFutureAsset === asset) return;
  cancelQueuedFutureLoad();
  queuedFutureAsset = asset;
  const load = () => {
    futureLoadHandle = null;
    queuedFutureAsset = "";
    if (getActiveFuture()?.asset !== asset) return;
    loadFuturePanorama(asset);
    setFutureBlend(activeTimeframe, true);
  };
  futureLoadHandle = window.requestIdleCallback
    ? window.requestIdleCallback(load, { timeout: 1200 })
    : window.setTimeout(load, 320);
}

function releasePanoramas() {
  cancelQueuedFutureLoad();
  photoSphere?.setAttribute("visible", false);
  futureSphere?.setAttribute("visible", false);
  photoSphere?.removeAttribute("src");
  futureSphere?.removeAttribute("src");
  disposePanoramaTexture(photoSphere);
  disposePanoramaTexture(futureSphere);
  loadedFutureAsset = "";
}

function syncAframeAuxiliaryAccessibility() {
  const isViewerActive = Boolean(
    activeScenario && !immersiveViewer?.hasAttribute("hidden")
  );
  document
    .querySelectorAll(
      ".a-enter-vr, .a-enter-vr-button, .a-orientation-modal, .a-dialog"
    )
    .forEach((element) => {
      element.setAttribute("aria-hidden", String(!isViewerActive));
    });
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

    button.addEventListener("click", () => openScenarioRoute(scenario));

    scenarioButtonContainer.appendChild(button);
    scenarioButtons.set(scenario.id, button);
  });
}

function buildScenarioCatalog() {
  if (!scenarioCardGrid) return;
  clearChildren(scenarioCardGrid);
  scenarioCards.clear();

  scenarios.forEach((scenario, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "scenario-card";
    card.dataset.scenarioId = scenario.id;
    card.setAttribute(
      "aria-label",
      `Explore ${scenario.label} as a 360 degree scenario`
    );

    const media = document.createElement("span");
    media.className = "scenario-card__media";

    if (scenario.thumbnail) {
      const image = document.createElement("img");
      image.src = scenario.thumbnail;
      image.alt = "";
      image.loading = index === 0 ? "eager" : "lazy";
      image.decoding = "async";
      media.appendChild(image);
    }

    const formatBadge = document.createElement("span");
    formatBadge.className = "scenario-card__format";
    formatBadge.textContent = "360° experience";
    media.appendChild(formatBadge);

    const body = document.createElement("span");
    body.className = "scenario-card__body";

    const location = document.createElement("span");
    location.className = "scenario-card__location";
    location.textContent = scenario.location || "New city scenario";

    const title = document.createElement("strong");
    title.className = "scenario-card__title";
    title.textContent = scenario.label;

    const summary = document.createElement("span");
    summary.className = "scenario-card__summary";
    summary.textContent =
      scenario.summary || "Explore this place across present and future states.";

    const themes = document.createElement("span");
    themes.className = "scenario-card__themes";
    const themeList = scenario.themes?.length
      ? scenario.themes
      : ["Mobility future"];
    themeList.forEach((theme) => {
      const chip = document.createElement("span");
      chip.textContent = theme;
      themes.appendChild(chip);
    });

    const footer = document.createElement("span");
    footer.className = "scenario-card__footer";

    const futureCount = document.createElement("span");
    const count = scenario.futures?.length || 1;
    futureCount.textContent = `Now + ${count} possible future${count === 1 ? "" : "s"}`;

    const action = document.createElement("span");
    action.className = "scenario-card__action";
    action.textContent = "Enter the scene →";

    footer.append(futureCount, action);
    body.append(location, title, summary, themes, footer);
    card.append(media, body);
    card.addEventListener("click", () => openScenarioRoute(scenario));
    scenarioCardGrid.appendChild(card);
    scenarioCards.set(scenario.id, card);
  });

  const placeholder = document.createElement("article");
  placeholder.className = "scenario-card scenario-card--placeholder";
  placeholder.setAttribute("aria-label", "Space for more city scenarios");

  const placeholderMark = document.createElement("span");
  placeholderMark.className = "scenario-card__placeholder-mark";
  placeholderMark.textContent = "+";

  const placeholderBody = document.createElement("span");
  placeholderBody.className = "scenario-card__body";

  const placeholderLocation = document.createElement("span");
  placeholderLocation.className = "scenario-card__location";
  placeholderLocation.textContent = "Growing collection";

  const placeholderTitle = document.createElement("strong");
  placeholderTitle.className = "scenario-card__title";
  placeholderTitle.textContent = "More places to explore";

  const placeholderSummary = document.createElement("span");
  placeholderSummary.className = "scenario-card__summary";
  placeholderSummary.textContent =
    "New streets, questions, and evidence-led possible futures are on their way.";

  const placeholderStatus = document.createElement("span");
  placeholderStatus.className = "scenario-card__placeholder-status";
  placeholderStatus.textContent = "Reference network in progress";

  placeholderBody.append(
    placeholderLocation,
    placeholderTitle,
    placeholderSummary,
    placeholderStatus
  );
  placeholder.append(placeholderMark, placeholderBody);
  scenarioCardGrid.appendChild(placeholder);
}

function buildTimeframeControls() {
  clearChildren(timeframeToggle);
  timeframeButtons.clear();

  const entries = [
    { timeframe: "present", label: "Now", position: "-0.55 0 0" },
    { timeframe: "future", label: "Possible future", position: "0.55 0 0" }
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

function getActiveFuture() {
  return activeScenario?.futures?.[activeFutureIndex] || null;
}

function setFutureBlend(timeframe, immediate = false) {
  if (!futureSphere) return;
  const opacity = timeframe === "future" ? 1 : 0;
  const reduceMotion = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  futureSphere.removeAttribute("animation__blend");
  if (immediate || reduceMotion) {
    futureSphere.setAttribute("material", "opacity", opacity);
    return;
  }

  futureSphere.setAttribute(
    "animation__blend",
    `property: material.opacity; to: ${opacity}; dur: 220; easing: easeInOutQuad`
  );
}

function updateScenarioInfo() {
  if (!activeScenario) return;
  const future = getActiveFuture();
  const frame = activeTimeframe === "present" ? activeScenario.present : future;
  const stateLabel =
    activeTimeframe === "present" ? "Now" : future?.horizon || "Possible future";

  if (scenarioInfoEyebrow) {
    scenarioInfoEyebrow.textContent = `${stateLabel} · ${activeScenario.location || "City scenario"}`;
  }
  if (scenarioInfoTitle) {
    scenarioInfoTitle.textContent =
      activeTimeframe === "present"
        ? activeScenario.label
        : future?.label || activeScenario.label;
  }
  if (scenarioInfoDescription) {
    scenarioInfoDescription.textContent = frame?.description || activeScenario.summary;
  }
  if (scenarioInfoThemes) {
    clearChildren(scenarioInfoThemes);
    const themes = activeScenario.themes?.length
      ? activeScenario.themes
      : ["Mobility future"];
    themes.forEach((theme) => {
      const chip = document.createElement("span");
      chip.textContent = theme;
      scenarioInfoThemes.appendChild(chip);
    });
  }
  if (scenarioInfoProvenance) {
    scenarioInfoProvenance.textContent =
      activeTimeframe === "present"
        ? "Prototype provenance · verified pilot panorama"
        : "Prototype provenance · verified paired panorama and precomputed reference rationale";
  }
}

function updateComparisonControls(displayedTimeframe = activeTimeframe) {
  if (!activeScenario) return;
  const future = getActiveFuture();
  const isPreviewing = comparisonReturnTimeframe !== null;
  const displayedLabel =
    displayedTimeframe === "present"
      ? "Now"
      : future?.horizon || future?.label || "Possible future";

  if (dockStateLabel) {
    dockStateLabel.textContent = isPreviewing
      ? `Comparing · ${displayedLabel}`
      : displayedLabel;
  }
  if (futureDirectionLabel) {
    futureDirectionLabel.textContent = future?.label || "Possible future";
  }
  if (holdCompareLabel) {
    holdCompareLabel.textContent = "Hold to compare";
  }

  const presentActive = activeTimeframe === "present";
  selectPresentButton?.classList.toggle("is-active", presentActive);
  selectPresentButton?.setAttribute("aria-pressed", String(presentActive));
  selectFutureButton?.classList.toggle("is-active", !presentActive);
  selectFutureButton?.setAttribute("aria-pressed", String(!presentActive));
  comparisonDock?.classList.toggle("is-comparing", isPreviewing);
}

function closeFutureOptions() {
  futureOptionsMenu?.setAttribute("hidden", "");
  futureDirectionButton?.setAttribute("aria-expanded", "false");
}

function buildFutureOptions() {
  if (!activeScenario || !futureOptionsMenu || !futureDirectionButton) return;
  clearChildren(futureOptionsMenu);
  const futures = activeScenario.futures || [];
  const hasOptions = futures.length > 1;

  futureDirectionButton.disabled = !hasOptions;
  futureDirectionButton.classList.toggle("has-options", hasOptions);
  closeFutureOptions();

  futures.forEach((future, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "future-option-button";
    button.setAttribute("role", "option");
    button.setAttribute("aria-selected", String(index === activeFutureIndex));
    button.textContent = future.label;
    button.addEventListener("click", () => {
      activeFutureIndex = index;
      loadFuturePanorama(future.asset);
      buildFutureOptions();
      updateComparisonControls();
      updateScenarioInfo();
      if (activeTimeframe === "future") {
        setFutureBlend("future", true);
      }
      syncViewerRoute();
      futureDirectionButton.focus();
    });
    futureOptionsMenu.appendChild(button);
  });
}

function setActiveTimeframe(timeframe) {
  if (!activeScenario || activeTimeframe === timeframe) return;
  activeTimeframe = timeframe;
  if (timeframe === "future") {
    loadFuturePanorama(getActiveFuture()?.asset);
  }
  updateTimeframeButtons();
  setFutureBlend(timeframe);
  updateComparisonControls();
  updateScenarioInfo();
  syncViewerRoute();
}

function applyScenarioFrame(immediate = false) {
  if (!activeScenario) return;
  const future = getActiveFuture();
  if (!activeScenario.present || !future) return;

  photoSphere.setAttribute("src", activeScenario.present.asset);
  photoSphere.setAttribute("visible", true);
  if (loadedFutureAsset && loadedFutureAsset !== future.asset) {
    futureSphere?.setAttribute("visible", false);
    futureSphere?.removeAttribute("src");
    disposePanoramaTexture(futureSphere);
    loadedFutureAsset = "";
  }
  if (activeTimeframe === "future") {
    loadFuturePanorama(future.asset);
  } else {
    futureSphere?.setAttribute("visible", false);
    queueFuturePanorama(future.asset);
  }
  infoText.setAttribute("value", "");
  setFutureBlend(activeTimeframe, immediate);
  buildFutureOptions();
  updateComparisonControls();
  updateScenarioInfo();
}

function enterScenario(scenario, { timeframe = "present", focus = true } = {}) {
  activeScenario = scenario;
  activeTimeframe = timeframe === "future" ? "future" : "present";
  activeFutureIndex = 0;

  homeMenu.setAttribute("visible", false);
  scenarioControls.setAttribute(
    "visible",
    Boolean(sceneElement?.is?.("vr-mode"))
  );
  scenarioCatalog?.setAttribute("hidden", "");
  immersiveViewer?.removeAttribute("hidden");
  document.body.classList.add("scenario-active");
  syncAframeAuxiliaryAccessibility();
  if (activeScenarioLocation) {
    activeScenarioLocation.textContent = scenario.location || "City scenario";
  }
  if (activeScenarioTitle) {
    activeScenarioTitle.textContent = scenario.label;
  }
  styleHomeButton("default");

  updateTimeframeButtons();
  comparisonDock?.classList.remove("is-collapsed", "is-comparing");
  toggleComparisonDockButton?.setAttribute("aria-expanded", "true");
  scenarioInfoSheet?.setAttribute("hidden", "");
  openScenarioInfoButton?.setAttribute("aria-expanded", "false");
  applyScenarioFrame(true);
  requestAnimationFrame(() => {
    const scene = immersiveViewer?.querySelector("a-scene");
    scene?.resize?.();
    window.dispatchEvent(new Event("resize"));
    if (focus) immersiveViewer?.focus({ preventScroll: true });
  });
}

function exitToHome({ restoreFocus = true } = {}) {
  const previousScenarioId = activeScenario?.id;
  activeScenario = null;
  activeTimeframe = "present";
  activeFutureIndex = 0;

  releasePanoramas();
  infoText.setAttribute("value", "");

  homeMenu.setAttribute("visible", false);
  scenarioControls.setAttribute("visible", false);
  immersiveViewer?.setAttribute("hidden", "");
  scenarioCatalog?.removeAttribute("hidden");
  document.body.classList.remove("scenario-active");
  syncAframeAuxiliaryAccessibility();

  scenarioButtons.forEach((button) => {
    styleScenarioButton(button, "default");
  });

  updateTimeframeButtons();
  closeFutureOptions();
  scenarioInfoSheet?.setAttribute("hidden", "");
  openScenarioInfoButton?.setAttribute("aria-expanded", "false");
  if (restoreFocus && previousScenarioId) {
    scenarioCards.get(previousScenarioId)?.focus();
  }
}

homeButton.addEventListener("click", async () => {
  if (sceneElement?.is?.("vr-mode")) {
    try {
      await sceneElement.exitVR();
    } catch (error) {}
  }
  showExplorer();
  navigateTo("/explore");
});

homeButton.addEventListener("mouseenter", () => {
  if (!activeScenario) return;
  styleHomeButton("hover");
});

homeButton.addEventListener("mouseleave", () => {
  styleHomeButton("default");
});

backToCatalogButton?.addEventListener("click", () => {
  showExplorer();
  navigateTo("/explore");
});

selectPresentButton?.addEventListener("click", () => {
  setActiveTimeframe("present");
});

selectFutureButton?.addEventListener("click", () => {
  setActiveTimeframe("future");
});

function startComparison(event) {
  if (!activeScenario || comparisonReturnTimeframe !== null) return;
  event?.preventDefault();
  comparisonReturnTimeframe = activeTimeframe;
  const previewTimeframe = activeTimeframe === "present" ? "future" : "present";
  if (event?.pointerId != null) {
    holdCompareButton?.setPointerCapture?.(event.pointerId);
  }
  setFutureBlend(previewTimeframe);
  updateComparisonControls(previewTimeframe);
}

function endComparison(event) {
  if (comparisonReturnTimeframe === null) return;
  event?.preventDefault();
  const returnTimeframe = comparisonReturnTimeframe;
  comparisonReturnTimeframe = null;
  setFutureBlend(returnTimeframe);
  updateComparisonControls(returnTimeframe);
}

holdCompareButton?.addEventListener("pointerdown", startComparison);
holdCompareButton?.addEventListener("pointerup", endComparison);
holdCompareButton?.addEventListener("pointercancel", endComparison);
holdCompareButton?.addEventListener("lostpointercapture", endComparison);
holdCompareButton?.addEventListener("click", (event) => event.preventDefault());

toggleComparisonDockButton?.addEventListener("click", () => {
  const collapsed = comparisonDock?.classList.toggle("is-collapsed") || false;
  toggleComparisonDockButton.setAttribute("aria-expanded", String(!collapsed));
  toggleComparisonDockButton.setAttribute(
    "aria-label",
    collapsed ? "Expand comparison controls" : "Collapse comparison controls"
  );
  closeFutureOptions();
});

futureDirectionButton?.addEventListener("click", () => {
  if (futureDirectionButton.disabled) return;
  const expanded = futureDirectionButton.getAttribute("aria-expanded") === "true";
  futureOptionsMenu?.toggleAttribute("hidden", expanded);
  futureDirectionButton.setAttribute("aria-expanded", String(!expanded));
});

function openScenarioInfo() {
  if (!activeScenario || !scenarioInfoSheet) return;
  updateScenarioInfo();
  scenarioInfoSheet.removeAttribute("hidden");
  openScenarioInfoButton?.setAttribute("aria-expanded", "true");
  closeScenarioInfoButton?.focus();
}

function closeScenarioInfo() {
  const wasOpen = scenarioInfoSheet && !scenarioInfoSheet.hasAttribute("hidden");
  scenarioInfoSheet?.setAttribute("hidden", "");
  openScenarioInfoButton?.setAttribute("aria-expanded", "false");
  if (wasOpen) openScenarioInfoButton?.focus();
}

openScenarioInfoButton?.addEventListener("click", openScenarioInfo);
closeScenarioInfoButton?.addEventListener("click", closeScenarioInfo);

document.addEventListener("keydown", (event) => {
  if (!activeScenario || immersiveViewer?.hasAttribute("hidden")) return;
  const target = event.target;
  const isFormControl =
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLButtonElement;
  if (isFormControl) return;

  if (event.code === "Space") {
    event.preventDefault();
    if (!event.repeat) startComparison(event);
  } else if (event.key === "1") {
    setActiveTimeframe("present");
  } else if (event.key === "2") {
    setActiveTimeframe("future");
  } else if (event.key.toLowerCase() === "i") {
    openScenarioInfo();
  } else if (event.key === "Escape") {
    closeScenarioInfo();
  }
});

document.addEventListener("keyup", (event) => {
  if (event.code === "Space") endComparison(event);
});

window.addEventListener("blur", endComparison);

sceneElement?.addEventListener("enter-vr", () => {
  immersiveViewer?.classList.add("is-vr");
  if (activeScenario) scenarioControls?.setAttribute("visible", true);
});

sceneElement?.addEventListener("exit-vr", () => {
  immersiveViewer?.classList.remove("is-vr");
  scenarioControls?.setAttribute("visible", false);
});

const openPlaceLensButton = document.getElementById("openPlaceLens");
const showExplorerButton = document.getElementById("showExplorer");
const landingWorkspace = document.getElementById("landingWorkspace");
const explorerWorkspace = document.getElementById("explorerWorkspace");
const backToLandingButton = document.getElementById("backToLanding");
const placeLensOverlay = document.getElementById("placeLensOverlay");
const placeLensPanel = document.getElementById("placeLensPanel");
const closePlaceLensButton = document.getElementById("closePlaceLens");
const placeSearchForm = document.getElementById("placeSearchForm");
const placeSearchInput = document.getElementById("placeSearch");
const clearPlaceSearchButton = document.getElementById("clearPlaceSearch");
const placeSearchResults = document.getElementById("placeSearchResults");
const placeSelection = document.getElementById("placeSelection");
const startPlaceAnalysisButton = document.getElementById("startPlaceAnalysis");
const backToPlaceButton = document.getElementById("backToPlace");
const continueToGroundingButton = document.getElementById(
  "continueToGrounding"
);
const backToAnalysisButton = document.getElementById("backToAnalysis");
const generateScenarioButton = document.getElementById("generateScenario");
const cancelGenerationButton = document.getElementById("cancelGeneration");
const viewGeneratedScenarioButton = document.getElementById(
  "viewGeneratedScenario"
);
const analysisAgentSteps = document.getElementById("analysisAgentSteps");
const generationAgentSteps = document.getElementById("generationAgentSteps");
const analysisOutcome = document.getElementById("analysisOutcome");
const groundingBrief = document.getElementById("groundingBrief");
const referenceNetwork = document.getElementById("referenceNetwork");
const generationOutcome = document.getElementById("generationOutcome");
const lensLiveStatus = document.getElementById("lensLiveStatus");

const lensStages = {
  place: document.getElementById("placeLensPlace"),
  analysis: document.getElementById("placeLensAnalysis"),
  grounding: document.getElementById("placeLensGrounding"),
  generation: document.getElementById("placeLensGeneration")
};

const lensStageOrder = ["place", "analysis", "grounding", "generation"];
let selectedLensScenario = null;
let lensTimers = [];
let lensRunActive = false;
let lensLastFocusedElement = null;

function createElement(tagName, className, textContent) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (textContent) element.textContent = textContent;
  return element;
}

function setLensLiveStatus(message) {
  if (lensLiveStatus) lensLiveStatus.textContent = message;
}

function clearLensTimers() {
  lensTimers.forEach((timer) => window.clearTimeout(timer));
  lensTimers = [];
  lensRunActive = false;
  analysisAgentSteps?.setAttribute("aria-busy", "false");
  generationAgentSteps?.setAttribute("aria-busy", "false");
}

function scheduleLensTask(callback, delay) {
  const timer = window.setTimeout(() => {
    lensTimers = lensTimers.filter((activeTimer) => activeTimer !== timer);
    callback();
  }, delay);
  lensTimers.push(timer);
}

function getLensDelay() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ? 0
    : 520;
}

function setLensStage(stageName) {
  lensStageOrder.forEach((name) => {
    const stage = lensStages[name];
    if (!stage) return;
    stage.toggleAttribute("hidden", name !== stageName);
  });

  const currentIndex = lensStageOrder.indexOf(stageName);
  document.querySelectorAll("[data-lens-progress]").forEach((item) => {
    const itemIndex = lensStageOrder.indexOf(item.dataset.lensProgress);
    const label = item.querySelector("strong")?.textContent || "Step";
    item.classList.toggle("is-current", itemIndex === currentIndex);
    item.classList.toggle("is-complete", itemIndex < currentIndex);
    if (itemIndex === currentIndex) {
      item.setAttribute("aria-current", "step");
    } else {
      item.removeAttribute("aria-current");
    }
    item.setAttribute(
      "aria-label",
      `Step ${itemIndex + 1} of ${lensStageOrder.length}, ${label}, ${itemIndex === currentIndex ? "current" : itemIndex < currentIndex ? "complete" : "upcoming"}`
    );
  });
}

function createPlaceResult(scenario) {
  const button = createElement("button", "place-search-result");
  button.type = "button";
  button.setAttribute("aria-pressed", String(selectedLensScenario?.id === scenario.id));

  const image = document.createElement("img");
  image.src = scenario.thumbnail;
  image.alt = "";
  image.loading = "lazy";

  const copy = createElement("span", "place-search-result__copy");
  copy.append(
    createElement("strong", "", scenario.label),
    createElement("span", "", scenario.location),
    createElement("small", "", scenario.lens.sceneType)
  );

  const marker = createElement("span", "place-search-result__marker", "↗");
  marker.setAttribute("aria-hidden", "true");
  button.append(image, copy, marker);
  button.addEventListener("click", () => selectLensScenario(scenario));
  return button;
}

function renderPlaceSearchResults() {
  if (!placeSearchResults || !placeSearchInput) return;
  const query = placeSearchInput.value.trim().toLowerCase();
  const matches = scenarios.filter((scenario) => {
    const searchable = [
      scenario.label,
      scenario.location,
      scenario.lens.sceneType
    ]
      .join(" ")
      .toLowerCase();
    return !query || searchable.includes(query);
  });

  if (
    selectedLensScenario &&
    !matches.some((scenario) => scenario.id === selectedLensScenario.id)
  ) {
    selectedLensScenario = null;
    startPlaceAnalysisButton?.setAttribute("disabled", "");
    renderPlaceSelection();
    if (!isApplyingRoute) navigateTo("/analyze", {}, { replace: true });
  }

  clearChildren(placeSearchResults);
  clearPlaceSearchButton?.toggleAttribute("hidden", !query);

  const heading = createElement(
    "p",
    "place-search-results__heading",
    query ? `${matches.length} matching supported place${matches.length === 1 ? "" : "s"}` : "Supported pilot places"
  );
  placeSearchResults.appendChild(heading);

  if (!matches.length) {
    const empty = createElement("div", "place-search-empty");
    empty.append(
      createElement("strong", "", `No supported place matches “${placeSearchInput.value.trim()}”.`),
      createElement(
        "span",
        "",
        "Coverage is growing. Browse the verified reference places below."
      )
    );
    const browseButton = createElement("button", "secondary-button", "Browse places");
    browseButton.type = "button";
    browseButton.addEventListener("click", () => {
      placeSearchInput.value = "";
      renderPlaceSearchResults();
      placeSearchInput.focus();
    });
    empty.appendChild(browseButton);
    placeSearchResults.appendChild(empty);
    setLensLiveStatus("No supported places matched the search. Browse verified places.");
    return;
  }

  matches.forEach((scenario) => placeSearchResults.appendChild(createPlaceResult(scenario)));
  setLensLiveStatus(`${matches.length} supported place${matches.length === 1 ? "" : "s"} available.`);
}

function renderPlaceSelection() {
  if (!placeSelection) return;
  clearChildren(placeSelection);

  if (!selectedLensScenario) {
    placeSelection.setAttribute("hidden", "");
    return;
  }

  placeSelection.removeAttribute("hidden");

  const card = createElement("article", "place-selection__card");
  const image = document.createElement("img");
  image.src = selectedLensScenario.thumbnail;
  image.alt = `Current 360° view of ${selectedLensScenario.label}`;

  const copy = createElement("div", "place-selection__copy");
  copy.append(
    createElement("p", "eyebrow", "Selected place"),
    createElement("h4", "", selectedLensScenario.label),
    createElement("p", "", selectedLensScenario.location),
    createElement("span", "place-selection__tag", selectedLensScenario.lens.sceneType)
  );
  card.append(image, copy);
  placeSelection.appendChild(card);
}

function selectLensScenario(scenario) {
  selectedLensScenario = scenario;
  startPlaceAnalysisButton?.removeAttribute("disabled");
  renderPlaceSelection();
  renderPlaceSearchResults();
  setLensLiveStatus(`${scenario.label} selected. Understand this place to continue.`);
  if (!isApplyingRoute) navigateTo(`/analyze/${scenario.id}`);
}

function createAgentStep(label) {
  const item = createElement("div", "agent-step");
  item.dataset.state = "pending";
  const indicator = createElement("span", "agent-step__indicator");
  indicator.setAttribute("aria-hidden", "true");
  const copy = createElement("div", "agent-step__copy");
  copy.append(
    createElement("strong", "", label),
    createElement("span", "", "Waiting")
  );
  item.append(indicator, copy);
  return item;
}

function setAgentStepState(item, state) {
  item.dataset.state = state;
  const status = item.querySelector(".agent-step__copy span");
  if (!status) return;
  status.textContent = state === "active" ? "In progress" : state === "complete" ? "Complete" : "Waiting";
}

function runAgentSteps(container, labels, onComplete) {
  if (!container) return;
  clearLensTimers();
  clearChildren(container);
  container.setAttribute("aria-busy", "true");
  const items = labels.map((label) => {
    const item = createAgentStep(label);
    container.appendChild(item);
    return item;
  });
  lensRunActive = true;
  let index = 0;

  const advance = () => {
    if (!lensRunActive) return;
    if (index >= items.length) {
      lensRunActive = false;
      container.setAttribute("aria-busy", "false");
      onComplete?.();
      return;
    }
    const item = items[index];
    setAgentStepState(item, "active");
    setLensLiveStatus(`${labels[index]}.`);
    scheduleLensTask(() => {
      if (!lensRunActive) return;
      setAgentStepState(item, "complete");
      index += 1;
      advance();
    }, getLensDelay());
  };

  advance();
}

function renderCompletedAgentSteps(container, labels) {
  if (!container) return;
  clearLensTimers();
  clearChildren(container);
  labels.forEach((label) => {
    const item = createAgentStep(label);
    setAgentStepState(item, "complete");
    container.appendChild(item);
  });
  container.setAttribute("aria-busy", "false");
}

function renderAnalysisOutcome() {
  if (!analysisOutcome || !selectedLensScenario) return;
  clearChildren(analysisOutcome);
  const outcome = selectedLensScenario.lens;
  analysisOutcome.append(
    createElement("p", "eyebrow", "Current read"),
    createElement("h4", "", outcome.sceneType),
    createElement("p", "", outcome.currentRead)
  );
  analysisOutcome.removeAttribute("hidden");
}

function renderGrounding() {
  if (!selectedLensScenario || !groundingBrief || !referenceNetwork) return;
  const scenario = selectedLensScenario;
  const future = scenario.futures[0];
  clearChildren(groundingBrief);
  clearChildren(referenceNetwork);

  const now = createElement("article", "scenario-brief__state scenario-brief__state--now");
  now.append(
    createElement("p", "eyebrow", "Now"),
    createElement("h4", "", scenario.lens.sceneType),
    createElement("p", "", scenario.lens.currentRead)
  );

  const futureState = createElement(
    "article",
    "scenario-brief__state scenario-brief__state--future"
  );
  futureState.append(
    createElement("p", "eyebrow", future.horizon || "Possible future"),
    createElement("h4", "", future.label),
    createElement("p", "", scenario.lens.direction)
  );
  groundingBrief.append(now, futureState);

  const rationale = createElement("article", "recommendation-rationale");
  rationale.append(
    createElement("p", "eyebrow", "Why this direction"),
    createElement("h4", "", "Recommendation rationale"),
    createElement("p", "", scenario.lens.rationale.recommendation),
    createElement(
      "p",
      "recommendation-rationale__tradeoff",
      `Trade-off considered: ${scenario.lens.rationale.tradeoff}`
    ),
    createElement(
      "p",
      "recommendation-rationale__status",
      "Prototype rationale · source records, implementation dates, outcomes, and ranking evidence connect with the live repository."
    )
  );
  groundingBrief.appendChild(rationale);

  const networkHeading = createElement("div", "reference-network__heading");
  networkHeading.append(
    createElement("p", "eyebrow", "What informs this?"),
    createElement(
      "p",
      "",
      "The system transfers relevant moves, not the appearance of another city. Prototype records mark local conditions separately from transferable precedents."
    )
  );
  referenceNetwork.appendChild(networkHeading);

  const grid = createElement("div", "reference-network__grid");
  scenario.lens.references.forEach((reference) => {
    const card = createElement("article", "reference-card");
    card.append(
      createElement("p", "reference-card__type", reference.type),
      createElement("p", "reference-card__location", reference.location),
      createElement("h4", "", reference.label),
      createElement("p", "", reference.detail),
      createElement("p", "reference-card__provenance", reference.provenance)
    );
    grid.appendChild(card);
  });
  referenceNetwork.appendChild(grid);
}

function renderGenerationOutcome() {
  if (!generationOutcome || !selectedLensScenario) return;
  clearChildren(generationOutcome);
  const heading = createElement("div", "generation-outcome__heading");
  heading.append(
    createElement("p", "eyebrow", "Quality gate passed"),
    createElement("h4", "", "The verified comparison is ready.")
  );
  generationOutcome.appendChild(heading);
  generationOutcome.appendChild(
    createElement(
      "p",
      "",
      "This prototype opens the verified 360° future already paired with this supported place. A live renderer will replace this handoff for new locations."
    )
  );
  const checks = createElement("ul", "quality-checks");
  selectedLensScenario.lens.qualityChecks.forEach((check) => {
    checks.appendChild(createElement("li", "", check));
  });
  generationOutcome.appendChild(checks);
  generationOutcome.removeAttribute("hidden");
}

function startLensAnalysis() {
  if (!selectedLensScenario) return;
  if (!isApplyingRoute) navigateTo(`/analyze/${selectedLensScenario.id}/read`);
  setLensStage("analysis");
  analysisOutcome?.setAttribute("hidden", "");
  continueToGroundingButton?.setAttribute("disabled", "");
  runAgentSteps(
    analysisAgentSteps,
    selectedLensScenario.lens.analysisSteps,
    () => {
      renderAnalysisOutcome();
      continueToGroundingButton?.removeAttribute("disabled");
      setLensLiveStatus("Place read complete. See the evidence-led direction.");
    }
  );
}

function startLensGeneration() {
  if (!selectedLensScenario) return;
  if (!isApplyingRoute) navigateTo(`/analyze/${selectedLensScenario.id}/visualize`);
  setLensStage("generation");
  generationOutcome?.setAttribute("hidden", "");
  viewGeneratedScenarioButton?.setAttribute("disabled", "");
  if (cancelGenerationButton) {
    cancelGenerationButton.textContent = "Cancel run";
    cancelGenerationButton.dataset.runState = "running";
  }
  runAgentSteps(
    generationAgentSteps,
    selectedLensScenario.lens.generationSteps,
    () => {
      renderGenerationOutcome();
      viewGeneratedScenarioButton?.removeAttribute("disabled");
      if (cancelGenerationButton) {
        cancelGenerationButton.textContent = "Back to direction";
        cancelGenerationButton.dataset.runState = "complete";
      }
      setLensLiveStatus("Visual quality check complete. The comparison is ready.");
    }
  );
}

function cancelLensGeneration() {
  const completed = cancelGenerationButton?.dataset.runState === "complete";
  clearLensTimers();
  if (cancelGenerationButton) {
    cancelGenerationButton.textContent = "Cancel run";
    cancelGenerationButton.dataset.runState = "idle";
  }
  setLensStage("grounding");
  if (!isApplyingRoute && selectedLensScenario) {
    navigateTo(`/analyze/${selectedLensScenario.id}/direction`);
  }
  setLensLiveStatus(
    completed
      ? "Returned to the evidence-led direction."
      : "Generation cancelled. The evidence-led direction is saved."
  );
}

function hidePlaceLens() {
  clearLensTimers();
  placeLensOverlay?.classList.remove("is-visible");
  placeLensOverlay?.setAttribute("aria-hidden", "true");
  placeLensOverlay?.setAttribute("hidden", "");
  document.body.classList.remove("place-lens-open");
}

function showLanding({ focusTarget = showExplorerButton } = {}) {
  if (activeScenario) exitToHome({ restoreFocus: false });
  hidePlaceLens();
  landingWorkspace?.removeAttribute("hidden");
  landingWorkspace?.setAttribute("aria-hidden", "false");
  explorerWorkspace?.setAttribute("hidden", "");
  explorerWorkspace?.setAttribute("aria-hidden", "true");
  document.body.dataset.workspace = "landing";
  if (focusTarget) {
    requestAnimationFrame(() => focusTarget.focus());
  }
}

function showExplorer({ focusTarget = backToLandingButton } = {}) {
  hidePlaceLens();
  landingWorkspace?.setAttribute("hidden", "");
  landingWorkspace?.setAttribute("aria-hidden", "true");
  explorerWorkspace?.removeAttribute("hidden");
  explorerWorkspace?.setAttribute("aria-hidden", "false");
  document.body.dataset.workspace = "explorer";
  exitToHome({ restoreFocus: false });
  requestAnimationFrame(() => {
    const scene = explorerWorkspace?.querySelector("a-scene");
    scene?.resize?.();
    window.dispatchEvent(new Event("resize"));
    if (focusTarget) focusTarget.focus();
  });
}

function openPlaceLens({ focus = true } = {}) {
  if (!placeLensOverlay) return;
  if (activeScenario) exitToHome({ restoreFocus: false });
  lensLastFocusedElement = document.activeElement instanceof HTMLElement
    ? document.activeElement
    : null;
  landingWorkspace?.setAttribute("hidden", "");
  landingWorkspace?.setAttribute("aria-hidden", "true");
  explorerWorkspace?.setAttribute("hidden", "");
  explorerWorkspace?.setAttribute("aria-hidden", "true");
  placeLensOverlay.removeAttribute("hidden");
  placeLensOverlay.classList.add("is-visible");
  placeLensOverlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("place-lens-open");
  document.body.dataset.workspace = "lens";
  setLensStage("place");
  startPlaceAnalysisButton?.toggleAttribute("disabled", !selectedLensScenario);
  renderPlaceSearchResults();
  renderPlaceSelection();
  if (focus) requestAnimationFrame(() => placeSearchInput?.focus());
}

function closePlaceLens() {
  showLanding({ focusTarget: lensLastFocusedElement || openPlaceLensButton });
  navigateTo("/");
}

function getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  );
}

function trapPlaceLensFocus(event) {
  if (!placeLensOverlay || placeLensOverlay.hasAttribute("hidden")) return;
  if (event.key === "Escape") {
    event.preventDefault();
    closePlaceLens();
    return;
  }
  if (event.key !== "Tab") return;
  const focusable = getFocusableElements(placeLensPanel);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function findScenarioById(id) {
  return scenarios.find((scenario) => scenario.id === id) || null;
}

function buildRouteHash(path, params = {}) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return `#${normalizedPath}${query ? `?${query}` : ""}`;
}

function navigateTo(path, params = {}, { replace = false, apply = false } = {}) {
  const hash = buildRouteHash(path, params);
  if (window.location.hash === hash) {
    if (apply) applyRoute();
    return;
  }
  window.history[replace ? "replaceState" : "pushState"](null, "", hash);
  if (apply) {
    lastAppliedHash = null;
    applyRoute();
  } else {
    lastAppliedHash = hash;
  }
}

function getRoute() {
  const routeValue = window.location.hash.slice(1) || "/";
  const [rawPath, rawQuery = ""] = routeValue.split("?");
  const path = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
  return {
    hash: window.location.hash || "#/",
    path,
    parts: path.split("/").filter(Boolean),
    params: new URLSearchParams(rawQuery)
  };
}

function parseRouteNumber(params, key, minimum, maximum) {
  const value = Number(params.get(key));
  if (!Number.isFinite(value)) return null;
  return Math.min(Math.max(value, minimum), maximum);
}

function getCameraRouteState() {
  const lookControls = player?.components?.["look-controls"];
  const camera = sceneElement?.camera;
  const yaw = lookControls?.yawObject?.rotation?.y ?? camera?.rotation?.y;
  const pitch = lookControls?.pitchObject?.rotation?.x ?? camera?.rotation?.x;
  const toDegrees = (radians) =>
    Number.isFinite(radians) ? Math.round((radians * 1800) / Math.PI) / 10 : null;
  const fov = Number.isFinite(camera?.fov) ? Math.round(camera.fov * 10) / 10 : null;
  return {
    yaw: toDegrees(yaw),
    pitch: toDegrees(pitch),
    fov
  };
}

function applyCameraRoute(params) {
  const yaw = parseRouteNumber(params, "yaw", -360, 360);
  const pitch = parseRouteNumber(params, "pitch", -85, 85);
  const fov = parseRouteNumber(params, "fov", 30, 100);
  if (yaw === null && pitch === null && fov === null) return;

  const apply = () => {
    const lookControls = player?.components?.["look-controls"];
    const toRadians = (degrees) => (degrees * Math.PI) / 180;
    if (yaw !== null) {
      if (lookControls?.yawObject) {
        lookControls.yawObject.rotation.y = toRadians(yaw);
      } else {
        player?.setAttribute("rotation", `0 ${yaw} 0`);
      }
    }
    if (pitch !== null) {
      if (lookControls?.pitchObject) {
        lookControls.pitchObject.rotation.x = toRadians(pitch);
      } else {
        player?.setAttribute("rotation", `${pitch} ${yaw ?? 0} 0`);
      }
    }
    if (fov !== null && sceneElement?.camera) {
      sceneElement.camera.fov = fov;
      sceneElement.camera.updateProjectionMatrix();
    }
  };

  if (sceneElement?.hasLoaded) {
    requestAnimationFrame(apply);
  } else {
    sceneElement?.addEventListener("loaded", apply, { once: true });
  }
}

function getViewerRouteParams(includeCamera = false) {
  const params = { view: activeTimeframe };
  if (includeCamera) Object.assign(params, getCameraRouteState());
  return params;
}

function syncViewerRoute({ includeCamera = false } = {}) {
  if (!activeScenario || isApplyingRoute) return;
  navigateTo(
    `/places/${activeScenario.id}`,
    getViewerRouteParams(includeCamera),
    { replace: true }
  );
}

function openScenarioRoute(scenario) {
  showExplorer({ focusTarget: null });
  enterScenario(scenario);
  navigateTo(`/places/${scenario.id}`, { view: "present" });
}

function restoreLensStage(scenario, stage) {
  if (!scenario || !stage) {
    setLensStage("place");
    return;
  }

  if (stage === "read") {
    renderCompletedAgentSteps(analysisAgentSteps, scenario.lens.analysisSteps);
    renderAnalysisOutcome();
    continueToGroundingButton?.removeAttribute("disabled");
    setLensStage("analysis");
    setLensLiveStatus("Precomputed place read ready.");
    return;
  }

  renderCompletedAgentSteps(analysisAgentSteps, scenario.lens.analysisSteps);
  renderAnalysisOutcome();
  continueToGroundingButton?.removeAttribute("disabled");
  renderGrounding();

  if (stage === "direction") {
    setLensStage("grounding");
    setLensLiveStatus("Precomputed direction ready.");
    return;
  }

  if (stage === "visualize") {
    renderCompletedAgentSteps(generationAgentSteps, scenario.lens.generationSteps);
    renderGenerationOutcome();
    viewGeneratedScenarioButton?.removeAttribute("disabled");
    if (cancelGenerationButton) {
      cancelGenerationButton.textContent = "Back to direction";
      cancelGenerationButton.dataset.runState = "complete";
    }
    setLensStage("generation");
    setLensLiveStatus("Precomputed verified comparison ready.");
    return;
  }

  setLensStage("place");
}

function applyRoute() {
  const route = getRoute();
  if (isApplyingRoute || route.hash === lastAppliedHash) return;
  lastAppliedHash = route.hash;
  isApplyingRoute = true;

  try {
    const [section, scenarioId, stage] = route.parts;

    if (section === "analyze") {
      const scenario = scenarioId ? findScenarioById(scenarioId) : null;
      if (scenarioId && !scenario) {
        window.history.replaceState(null, "", buildRouteHash("/analyze"));
        lastAppliedHash = "#/analyze";
      }
      if (
        scenario &&
        stage &&
        !["read", "direction", "visualize"].includes(stage)
      ) {
        window.history.replaceState(
          null,
          "",
          buildRouteHash(`/analyze/${scenario.id}`)
        );
        lastAppliedHash = `#/analyze/${scenario.id}`;
      }
      selectedLensScenario = scenario;
      if (placeSearchInput) placeSearchInput.value = "";
      openPlaceLens({ focus: false });
      startPlaceAnalysisButton?.toggleAttribute("disabled", !selectedLensScenario);
      renderPlaceSearchResults();
      renderPlaceSelection();
      restoreLensStage(selectedLensScenario, stage);
      return;
    }

    if (section === "places") {
      const scenario = findScenarioById(scenarioId);
      if (scenario) {
        showExplorer({ focusTarget: null });
        enterScenario(scenario, {
          timeframe: route.params.get("view"),
          focus: false
        });
        applyCameraRoute(route.params);
        return;
      }
      window.history.replaceState(null, "", buildRouteHash("/explore"));
      lastAppliedHash = "#/explore";
      showExplorer({ focusTarget: null });
      return;
    }

    if (section === "explore") {
      showExplorer({ focusTarget: null });
      return;
    }

    showLanding({ focusTarget: null });
  } finally {
    isApplyingRoute = false;
  }
}

async function shareActiveScenario() {
  if (!activeScenario) return;
  syncViewerRoute({ includeCamera: true });
  const url = `${window.location.origin}${window.location.pathname}${window.location.hash}`;
  const shareData = {
    title: `${activeScenario.label} · InflectionPoints`,
    text: `Explore ${activeScenario.label} as it is now and as a possible future.`,
    url
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      setViewerLiveStatus("Share sheet opened.");
      return;
    }
    await navigator.clipboard.writeText(url);
    setViewerLiveStatus("Share link copied. It restores this view and comparison state.");
  } catch (error) {
    if (error?.name === "AbortError") return;
    window.prompt("Copy this share link", url);
    setViewerLiveStatus("Share link ready to copy.");
  }
}

function initPlaceLens() {
  openPlaceLensButton?.addEventListener("click", () => {
    openPlaceLens();
    navigateTo("/analyze");
  });
  showExplorerButton?.addEventListener("click", () => {
    showExplorer();
    navigateTo("/explore");
  });
  backToLandingButton?.addEventListener("click", () => {
    showLanding();
    navigateTo("/");
  });
  closePlaceLensButton?.addEventListener("click", closePlaceLens);
  placeSearchInput?.addEventListener("input", renderPlaceSearchResults);
  clearPlaceSearchButton?.addEventListener("click", () => {
    if (!placeSearchInput) return;
    placeSearchInput.value = "";
    renderPlaceSearchResults();
    placeSearchInput.focus();
  });
  placeSearchForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (selectedLensScenario) {
      startLensAnalysis();
      return;
    }
    const firstScenario = scenarios.find((scenario) => {
      const query = placeSearchInput?.value.trim().toLowerCase() || "";
      return [scenario.label, scenario.location, scenario.lens.sceneType]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
    if (firstScenario) selectLensScenario(firstScenario);
  });
  startPlaceAnalysisButton?.addEventListener("click", startLensAnalysis);
  backToPlaceButton?.addEventListener("click", () => {
    clearLensTimers();
    setLensStage("place");
    placeSearchInput?.focus();
    if (selectedLensScenario) navigateTo(`/analyze/${selectedLensScenario.id}`);
  });
  continueToGroundingButton?.addEventListener("click", () => {
    renderGrounding();
    setLensStage("grounding");
    generateScenarioButton?.focus();
    if (selectedLensScenario) {
      navigateTo(`/analyze/${selectedLensScenario.id}/direction`);
    }
  });
  backToAnalysisButton?.addEventListener("click", () => {
    setLensStage("analysis");
    if (selectedLensScenario) navigateTo(`/analyze/${selectedLensScenario.id}/read`);
  });
  generateScenarioButton?.addEventListener("click", startLensGeneration);
  cancelGenerationButton?.addEventListener("click", cancelLensGeneration);
  viewGeneratedScenarioButton?.addEventListener("click", () => {
    if (!selectedLensScenario) return;
    hidePlaceLens();
    showExplorer({ focusTarget: null });
    enterScenario(selectedLensScenario);
    navigateTo(`/places/${selectedLensScenario.id}`, { view: "present" });
  });
  shareScenarioButton?.addEventListener("click", shareActiveScenario);
  document.addEventListener("keydown", trapPlaceLensFocus);
}

buildScenarioCatalog();
buildTimeframeControls();
styleHomeButton("default");
initPlaceLens();
sceneElement?.addEventListener("loaded", syncAframeAuxiliaryAccessibility);
window.addEventListener("popstate", applyRoute);
window.addEventListener("hashchange", applyRoute);
applyRoute();
