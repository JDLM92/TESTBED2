const experiences = [
  {
    id: "seaside",
    label: "Seaside Photo",
    type: "photo",
    asset: "#asset-seaside",
    description: "Golden hour on the Pacific coastline."
  },
  {
    id: "mountain",
    label: "Desert Photo",
    type: "photo",
    asset: "#asset-mountain",
    description: "Clouds rolling over a red rock desert vista."
  },
  {
    id: "city",
    label: "Tokyo Night Video",
    type: "video",
    asset: "#asset-city",
    description: "Night drive through Shinjuku's neon streets."
  },
  {
    id: "ocean",
    label: "Ocean Race Video",
    type: "video",
    asset: "#asset-ocean",
    description: "Sail the waves in an offshore race."
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
  const spacing = 0.32;
  const startY = ((experiences.length - 1) * spacing) / 2;

  experiences.forEach((exp, index) => {
    const button = document.createElement("a-entity");
    button.setAttribute("class", "experience-button clickable");
    button.setAttribute(
      "geometry",
      "primitive: plane; width: 1.4; height: 0.26;"
    );
    button.setAttribute(
      "material",
      "color: #1b6ef3; opacity: 0.92; shader: flat;"
    );
    button.setAttribute("position", `0 ${startY - index * spacing} 0`);

    const label = document.createElement("a-text");
    label.setAttribute("value", exp.label);
    label.setAttribute("align", "center");
    label.setAttribute("width", "1.3");
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
      button.setAttribute(
        "material",
        "color: #3fa7ff; opacity: 1; shader: flat;"
      );
    });

    button.addEventListener("mouseleave", () => {
      if (button.getAttribute("data-active") === "true") return;
      button.setAttribute(
        "material",
        "color: #1b6ef3; opacity: 0.92; shader: flat;"
      );
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
    button.setAttribute(
      "material",
      isActive
        ? "color: #34d399; opacity: 1; shader: flat;"
        : "color: #1b6ef3; opacity: 0.92; shader: flat;"
    );
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
