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

const BUTTON_STYLES = {
  default: { color: "#0a84ff", opacity: 0.96 },
  hover: { color: "#409cff", opacity: 1 },
  active: { color: "#32d74b", opacity: 1 }
};

function applyButtonStyle(button, style) {
  button.setAttribute(
    "material",
    `shader: flat; color: ${style.color}; transparent: true; opacity: ${style.opacity}`
  );
}

const experiences = [
  {
    id: "mexico-present",
    label: "Mexico City — Present",
    type: "photo",
    asset: "#asset-mexico-present",
    description: "Mexico City's historic downtown captured in the present."
  },
  {
    id: "mexico-future",
    label: "Mexico City — Future Vision",
    type: "photo",
    asset: "#asset-mexico-future",
    description: "A speculative nightscape imagining Mexico City's future skyline."
  }
];

const photoSphere = document.getElementById("photoSphere");
const videoSphere = document.getElementById("videoSphere");
const buttonContainer = document.getElementById("buttonContainer");
const infoText = document.getElementById("infoText");

const videoElements = experiences
  .filter((exp) => exp.type === "video")
  .map((exp) => document.querySelector(exp.asset))
  .filter(Boolean);

const buttonMap = new Map();

function buildButtons() {
  const spacing = 0.5;
  const startY = ((experiences.length - 1) * spacing) / 2;

  experiences.forEach((exp, index) => {
    const button = document.createElement("a-entity");
    button.setAttribute("class", "experience-button clickable");
    button.setAttribute("pill-button", "width: 1.7; height: 0.44; radius: 0.22");
    applyButtonStyle(button, BUTTON_STYLES.default);
    button.setAttribute("render-order", "2");
    button.setAttribute("shadow", "receive: false");
    button.setAttribute("position", `0 ${startY - index * spacing} 0`);

    const label = document.createElement("a-text");
    label.setAttribute("value", exp.label);
    label.setAttribute("align", "center");
    label.setAttribute("width", "1.5");
    label.setAttribute("color", "#ffffff");
    label.setAttribute("shader", "msdf");
    label.setAttribute(
      "font",
      "https://cdn.aframe.io/fonts/Roboto-msdf.json"
    );
    label.setAttribute("position", "0 0 0.01");

    button.appendChild(label);

    button.addEventListener("mouseenter", () => {
      if (button.getAttribute("data-active") === "true") return;
      applyButtonStyle(button, BUTTON_STYLES.hover);
    });

    button.addEventListener("mouseleave", () => {
      if (button.getAttribute("data-active") === "true") return;
      applyButtonStyle(button, BUTTON_STYLES.default);
    });

    button.addEventListener("click", () => activateExperience(exp));

    buttonContainer.appendChild(button);
    buttonMap.set(exp.id, button);
  });
}

function setButtonState(activeId) {
  buttonMap.forEach((button, id) => {
    const isActive = id === activeId;
    button.setAttribute("data-active", isActive);
    applyButtonStyle(
      button,
      isActive ? BUTTON_STYLES.active : BUTTON_STYLES.default
    );
    button.setAttribute("scale", isActive ? "1.05 1.05 1" : "1 1 1");
  });
}

function activateExperience(exp) {
  setButtonState(exp.id);
  infoText.setAttribute("value", exp.description);

  if (exp.type === "photo") {
    videoSphere.setAttribute("visible", false);
    pauseAllVideos();
    photoSphere.setAttribute("src", exp.asset);
    photoSphere.setAttribute("visible", true);
  } else if (exp.type === "video") {
    const videoEl = document.querySelector(exp.asset);
    if (!videoEl) return;
    photoSphere.setAttribute("visible", false);
    videoSphere.setAttribute("src", exp.asset);
    videoSphere.setAttribute("visible", true);
    pauseAllVideos(videoEl);
    const playPromise = videoEl.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        // Autoplay might be blocked until the user interacts in-headset.
      });
    }
  }
}

function pauseAllVideos(exempt) {
  videoElements.forEach((video) => {
    if (video === exempt) return;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  });
}

buildButtons();
activateExperience(experiences[0]);
