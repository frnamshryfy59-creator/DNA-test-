import * as THREE from
"https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";


/* =================================
   1. CONNECT HTML ELEMENTS
================================= */

const viewer = document.getElementById("dnaViewer");

const input = document.getElementById("sequenceInput");
const complementBox = document.getElementById("complement");
const complementPanel = document.getElementById("complementPanel");

const strandMode = document.getElementById("strandMode");
const baseChoice = document.getElementById("baseChoice");
const baseCount = document.getElementById("baseCount");

const rotateButton = document.getElementById("rotateButton");


/* =================================
   2. DNA DATA
================================= */

const colors = {
  A: 0x55bfff,
  T: 0xffad55,
  G: 0x59dfa0,
  C: 0xc17aff
};

const pairs = {
  A: "T",
  T: "A",
  G: "C",
  C: "G"
};

let sequence = "GGGGG";

let rotating = true;
let dragging = false;

let previousX = 0;
let previousY = 0;


/* =================================
   3. THREE.JS SCENE
================================= */

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  45,
  1,
  0.1,
  1000
);

camera.position.set(0, 0, 15);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true
});

renderer.setPixelRatio(
  Math.min(window.devicePixelRatio || 1, 2)
);

renderer.outputColorSpace = THREE.SRGBColorSpace;

viewer.appendChild(renderer.domElement);


/* =================================
   4. LIGHTING
================================= */

scene.add(
  new THREE.AmbientLight(0xffffff, 1.5)
);

const light = new THREE.PointLight(0xffffff, 80);

light.position.set(4, 5, 8);

scene.add(light);


/* =================================
   5. DNA GROUP
================================= */

const dna = new THREE.Group();

scene.add(dna);


/* =================================
   6. CREATE DNA OBJECTS
================================= */

// ساخت یک مهره سه‌بعدی

function sphere(position, color, size) {

  const geometry = new THREE.SphereGeometry(
    size,
    20,
    20
  );

  const material = new THREE.MeshStandardMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: 0.22,
    roughness: 0.35
  });

  const mesh = new THREE.Mesh(
    geometry,
    material
  );

  mesh.position.copy(position);

  dna.add(mesh);
}


// ساخت اتصال استوانه‌ای بین دو نقطه

function rod(start, end, color, thickness) {

  const direction = new THREE.Vector3()
    .subVectors(end, start);

  const geometry = new THREE.CylinderGeometry(
    thickness,
    thickness,
    direction.length(),
    12
  );

  const material = new THREE.MeshStandardMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: 0.12
  });

  const mesh = new THREE.Mesh(
    geometry,
    material
  );

  mesh.position.copy(start)
    .add(end)
    .multiplyScalar(0.5);

  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.normalize()
  );

  dna.add(mesh);
}


/* =================================
   7. REMOVE OLD DNA MODEL
================================= */

function clearDNA() {

  while (dna.children.length > 0) {

    const object = dna.children[0];

    dna.remove(object);

    if (object.geometry) {
      object.geometry.dispose();
    }

    if (object.material) {

      if (Array.isArray(object.material)) {
        object.material.forEach(material => material.dispose());
      } else {
        object.material.dispose();
      }

    }

  }

}


/* =================================
   8. BUILD DNA MODEL
================================= */


function buildDNA() {

  clearDNA();

  const count = sequence.length;

  if (count === 0) {
    return;
  }

  // پارامترهای هندسی تقریبی B-DNA
  const radius = 2.0;
  const rise = 0.68;
  const anglePerBase = (2 * Math.PI) / 10.5;

  const leftPoints = [];
  const rightPoints = [];

  const isSingle = strandMode.value === "single";

  for (let i = 0; i < count; i++) {

    const angle = i * anglePerBase;

    const y = ((count - 1) / 2 - i) * rise;

    const left = new THREE.Vector3(
      radius * Math.cos(angle),
      y,
      radius * Math.sin(angle)
    );

    const right = new THREE.Vector3(
      radius * Math.cos(angle + Math.PI),
      y,
      radius * Math.sin(angle + Math.PI)
    );

    leftPoints.push(left);
    rightPoints.push(right);

    const base = sequence[i];
    const opposite = pairs[base];

    if (isSingle) {

      // ستون فقرات برجسته‌تر
      sphere(left, 0x55d8ff, 0.19);

      // جهت حرکت باز به سمت مرکز مارپیچ
      const inward = new THREE.Vector3(
        -Math.cos(angle),
        0,
        -Math.sin(angle)
      );

      const baseTip = left.clone()
        .add(inward.multiplyScalar(1.15));

      // زبانه رنگی باز
      rod(left, baseTip, colors[base], 0.14);

      sphere(baseTip, colors[base], 0.23);

      // جزئیات کوچک روی باز
      const detail = left.clone().lerp(baseTip, 0.55);
      sphere(detail, colors[base], 0.11);

    } else {

      // حالت دو رشته‌ای قبلی
      sphere(left, 0x55d8ff, 0.13);
      sphere(right, 0xc17aff, 0.13);

      const middle = left.clone()
        .add(right)
        .multiplyScalar(0.5);

      rod(left, middle, colors[base], 0.09);
      rod(middle, right, colors[opposite], 0.09);

      sphere(
        left.clone().lerp(middle, 0.35),
        colors[base],
        0.15
      );

      sphere(
        right.clone().lerp(middle, 0.35),
        colors[opposite],
        0.15
      );
    }
  }

  // ستون فقرات پیوسته
  function backbone(points, color, thickness) {

    if (points.length < 2) {
      return;
    }

    const curve = new THREE.CatmullRomCurve3(points);

    const geometry = new THREE.TubeGeometry(
      curve,
      Math.max(24, count * 10),
      thickness,
      12,
      false
    );

    const material = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: isSingle ? 0.65 : 0.25,
      roughness: 0.3,
      metalness: 0.25
    });

    dna.add(new THREE.Mesh(geometry, material));
  }

  if (isSingle) {

    backbone(leftPoints, 0x55d8ff, 0.11);

    // نشانگرهای دو انتهای رشته
    sphere(leftPoints[0], 0xffd166, 0.25);
    sphere(leftPoints[count - 1], 0xffd166, 0.25);

  } else {

    backbone(leftPoints, 0x55d8ff, 0.065);
    backbone(rightPoints, 0xc17aff, 0.065);
  }

  // تنظیم فاصله دوربین
  const modelHeight = Math.max(
    4,
    (count - 1) * rise + 3
  );

  const verticalFov = THREE.MathUtils.degToRad(camera.fov);

  const distance =
    (modelHeight / 2) / Math.tan(verticalFov / 2);

  camera.position.set(
    0,
    0,
    Math.max(10, distance * 1.25)
  );

  camera.lookAt(0, 0, 0);
}



/* =================================
   9. UPDATE DNA INFORMATION
================================= */


function update() {

  // ساخت رشته مکمل
  const complementary = [...sequence]
    .map(base => pairs[base])
    .join("");

  // ساخت رشته مکمل معکوس
  const reverseComplement = [...complementary]
    .reverse()
    .join("");

  // نمایش هر سه توالی
  document.getElementById("originalSequence").textContent =
    sequence || "---";

  complementBox.textContent =
    complementary || "---";

  document.getElementById("reverseComplement").textContent =
    reverseComplement || "---";


  // تعداد بازها
  document.getElementById("count").textContent =
    sequence.length;


  // محاسبه درصد GC
  const gc = [...sequence].filter(
    base => base === "G" || base === "C"
  ).length;

  const percent = sequence.length
    ? Math.round(gc / sequence.length * 100)
    : 0;

  document.getElementById("gc").textContent =
    percent + "%";


  // بازسازی مدل سه‌بعدی
  buildDNA();

}



/* =================================
   10. GENERATE REPEATED DNA
================================= */

document.getElementById("generateButton")
  .addEventListener("click", () => {

    const base = baseChoice.value;

    const count = Math.max(
      1,
      Math.min(
        80,
        Number(baseCount.value) || 1
      )
    );

    sequence = base.repeat(count);

    input.value = sequence;

    update();

  });


/* =================================
   11. CHANGE STRAND MODE
================================= */

strandMode.addEventListener(
  "change",
  update
);


/* =================================
   12. CUSTOM DNA SEQUENCE
================================= */

input.addEventListener("input", () => {

  sequence = input.value
    .toUpperCase()
    .replace(/[^ATGC]/g, "")
    .slice(0, 80);

  input.value = sequence;

  update();

});


/* =================================
   13. ADD INDIVIDUAL BASES
================================= */

document.querySelectorAll("[data-base]")
  .forEach(button => {

    button.addEventListener("click", () => {

      sequence = (
        sequence + button.dataset.base
      ).slice(0, 80);

      input.value = sequence;

      update();

    });

  });


/* =================================
   14. CLEAR SEQUENCE
================================= */

document.getElementById("clearButton")
  .addEventListener("click", () => {

    sequence = "";

    input.value = "";

    update();

  });


/* =================================
   15. ROTATION CONTROL
================================= */

rotateButton.addEventListener("click", () => {

  rotating = !rotating;

  rotateButton.textContent = rotating
    ? "Pause Rotation"
    : "Resume Rotation";

});


/* =================================
   16. TOUCH AND MOUSE ROTATION
================================= */

renderer.domElement.addEventListener(
  "pointerdown",
  event => {

    dragging = true;

    previousX = event.clientX;
    previousY = event.clientY;

    renderer.domElement.setPointerCapture(
      event.pointerId
    );

  }
);


renderer.domElement.addEventListener(
  "pointermove",
  event => {

    if (!dragging) return;

    const dx = event.clientX - previousX;
    const dy = event.clientY - previousY;

    dna.rotation.y += dx * 0.008;

    dna.rotation.x += dy * 0.008;

    previousX = event.clientX;
    previousY = event.clientY;

  }
);


function stopDragging() {
  dragging = false;
}

renderer.domElement.addEventListener(
  "pointerup",
  stopDragging
);

renderer.domElement.addEventListener(
  "pointercancel",
  stopDragging
);

renderer.domElement.addEventListener(
  "lostpointercapture",
  stopDragging
);


/* =================================
   17. RESIZE VIEWER
================================= */

function resizeViewer() {

  const width = viewer.clientWidth;
  const height = viewer.clientHeight;

  if (!width || !height) return;

  camera.aspect = width / height;

  camera.updateProjectionMatrix();

  renderer.setSize(
    width,
    height
  );

}

const resizeObserver = new ResizeObserver(
  resizeViewer
);

resizeObserver.observe(viewer);


/* =================================
   18. ANIMATION LOOP
================================= */

function animate() {

  requestAnimationFrame(animate);

  if (rotating && !dragging) {

    dna.rotation.y += 0.006;

  }

  renderer.render(
    scene,
    camera
  );

}


/* =================================
   19. START DNA LAB
================================= */

input.value = sequence;

update();

resizeViewer();

animate();
     
