
const canvas = document.getElementById("dnaCanvas");
const ctx = canvas.getContext("2d");

const input = document.getElementById("sequenceInput");
const complementBox = document.getElementById("complement");

const strandMode = document.getElementById("strandMode");
const baseChoice = document.getElementById("baseChoice");
const baseCount = document.getElementById("baseCount");
const generateButton = document.getElementById("generateButton");
const colors = {
  A: "#4cbaff",
  T: "#ffb65c",
  G: "#59dfa0",
  C: "#bc8cff"
};

const pairs = {
  A: "T",
  T: "A",
  G: "C",
  C: "G"
};

let sequence = "TTTT";
let angle = 0;
let rotating = true;
let dragging = false;
let lastX = 0;
generateButton.addEventListener("click", () => {
  const base = baseChoice.value;
  const count = Math.max(1, Math.min(80, Number(baseCount.value) || 1));

  sequence = base.repeat(count);
  input.value = sequence;

  update();
});

strandMode.addEventListener("change", update);
function resize() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw();
}

function draw() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  ctx.clearRect(0, 0, w, h);

  const centerX = w / 2;
  const centerY = h / 2;
  const radius = Math.min(w * 0.28, 90);

  const total = sequence.length;

  if (total === 0) {
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText("Enter DNA bases", centerX, centerY);
    return;
  }

  const points = [];

  for (let i = 0; i < total; i++) {
    const theta = i * 0.75 + angle;
    const y = centerY + (i - (total - 1) / 2) * 24;

    const x1 = centerX + Math.cos(theta) * radius;
    const z1 = Math.sin(theta);

    const x2 = centerX - Math.cos(theta) * radius;
    const z2 = -Math.sin(theta);

    points.push({ x1, x2, y, z1, z2, i });
  }

  // Backbones
  for (let strand = 0; strand < 2; strand++) {
    ctx.beginPath();

    points.forEach((p, i) => {
      const x = strand === 0 ? p.x1 : p.x2;

      if (i === 0) {
        ctx.moveTo(x, p.y);
      } else {
        ctx.lineTo(x, p.y);
      }
    });

    ctx.strokeStyle = strand === 0 ? "#55d8ff" : "#a17aff";
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  // Base pairs
  points.forEach(p => {
    const base = sequence[p.i];
    const opposite = pairs[base];

    ctx.beginPath();
    ctx.moveTo(p.x1, p.y);
    ctx.lineTo(p.x2, p.y);
    ctx.strokeStyle = "#a8c5df";
    ctx.lineWidth = 2;
    ctx.stroke();

    function sphere(x, color, z) {
      ctx.beginPath();
      ctx.arc(x, p.y, 7 + z * 2, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    sphere(p.x1, colors[base], p.z1);
    sphere(p.x2, colors[opposite], p.z2);
  });
}

function update() {
  const complementary = [...sequence]
    .map(base => pairs[base])
    .join("");

  complementBox.textContent = complementary || "---";

  document.getElementById("count").textContent =
    sequence.length;

  const gc = [...sequence].filter(
    base => base === "G" || base === "C"
  ).length;

  const percent = sequence.length
    ? Math.round(gc / sequence.length * 100)
    : 0;

  document.getElementById("gc").textContent =
    percent + "%";

  draw();
}

input.addEventListener("input", () => {
  sequence = input.value
    .toUpperCase()
    .replace(/[^ATGC]/g, "")
    .slice(0, 80);

  input.value = sequence;
  update();
});

document.querySelectorAll("[data-base]").forEach(button => {
  button.addEventListener("click", () => {
    sequence = (sequence + button.dataset.base).slice(0, 80);
    input.value = sequence;
    update();
  });
});

document.getElementById("clearButton")
  .addEventListener("click", () => {
    sequence = "";
    input.value = "";
    update();
  });

document.getElementById("rotateButton")
  .addEventListener("click", event => {
    rotating = !rotating;
    event.target.textContent =
      rotating ? "Pause Rotation" : "Resume Rotation";
  });

canvas.addEventListener("pointerdown", event => {
  dragging = true;
  lastX = event.clientX;
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", event => {
  if (!dragging) return;

  const dx = event.clientX - lastX;
  angle += dx * 0.012;
  lastX = event.clientX;
  draw();
});

function stopDragging() {
  dragging = false;
}

canvas.addEventListener("pointerup", stopDragging);
canvas.addEventListener("pointercancel", stopDragging);

function animate() {
  if (rotating && !dragging) {
    angle += 0.012;
    draw();
  }

  requestAnimationFrame(animate);
}

input.value = sequence;
resize();
window.addEventListener("resize", resize);
update();
animate();
