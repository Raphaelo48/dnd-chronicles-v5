// ============ DICE 3D ============
(function () {
  let scene, camera, renderer, dieMesh;
  let spinning = false;
  let rotVel = { x: 0, y: 0, z: 0 };
  let rafId = null;
  let initialized = false;
  let currentSides = 20;

  const DIE_COLORS = {
    4:   0xe74c3c,
    6:   0x3a86ff,
    8:   0x2ecc71,
    10:  0x9b59b6,
    12:  0xe67e22,
    20:  0xd4af37,
    100: 0x16a085,
  };

  // ---- Geometries ----
  function getGeometry(sides) {
    switch (sides) {
      case 4:   return new THREE.TetrahedronGeometry(1.25, 0);
      case 6:   return new THREE.BoxGeometry(1.5, 1.5, 1.5);
      case 8:   return new THREE.OctahedronGeometry(1.35, 0);
      case 10:
      case 100: return makeD10();
      case 12:  return new THREE.DodecahedronGeometry(1.25, 0);
      case 20:  return new THREE.IcosahedronGeometry(1.35, 0);
      default:  return new THREE.IcosahedronGeometry(1.35, 0);
    }
  }

  function makeD10() {
    // Pentagonal trapezohedron: top pole, bottom pole, 10 equatorial verts
    const verts = [];
    verts.push(0,  1.5, 0);   // 0 top
    verts.push(0, -1.5, 0);   // 1 bottom
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const y = (i % 2 === 0) ? 0.25 : -0.25;
      verts.push(Math.cos(a) * 1.1, y, Math.sin(a) * 1.1);
    }
    const idx = [];
    for (let i = 0; i < 10; i++) {
      const a = 2 + i;
      const b = 2 + (i + 1) % 10;
      idx.push(0, a, b);
      idx.push(1, b, a);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return geo;
  }

  // ---- Scene init ----
  function init() {
    if (initialized) return;
    if (!window.THREE) return;

    const wrap = document.getElementById('dice-3d-wrap');
    const canvas = document.getElementById('dice-3d-canvas');
    if (!wrap || !canvas) return;

    const W = wrap.clientWidth;
    const H = 240;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 100);
    camera.position.set(0, 0, 5.5);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.45));

    const sun = new THREE.DirectionalLight(0xffffff, 0.9);
    sun.position.set(3, 4, 5);
    scene.add(sun);

    const accent = new THREE.PointLight(0xd4af37, 1.2, 12);
    accent.position.set(-3, 2, 3);
    scene.add(accent);

    const rim = new THREE.DirectionalLight(0x8888ff, 0.3);
    rim.position.set(-2, -3, -2);
    scene.add(rim);

    buildDie(currentSides);
    startLoop();
    initialized = true;

    window.addEventListener('resize', onResize);
  }

  function onResize() {
    if (!renderer) return;
    const wrap = document.getElementById('dice-3d-wrap');
    if (!wrap) return;
    const W = wrap.clientWidth;
    const H = 240;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
  }

  // ---- Die mesh ----
  function buildDie(sides) {
    if (dieMesh) { scene.remove(dieMesh); dieMesh = null; }

    const geo = getGeometry(sides);
    const color = DIE_COLORS[sides] || 0xd4af37;

    const mat = new THREE.MeshPhongMaterial({
      color,
      shininess: 120,
      specular: new THREE.Color(0xffffff),
      flatShading: [4, 6, 8, 10, 100].includes(sides),
    });

    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });

    const group = new THREE.Group();
    group.add(new THREE.Mesh(geo, mat));
    group.add(new THREE.Mesh(geo.clone(), wireMat));
    dieMesh = group;
    scene.add(dieMesh);
  }

  // ---- Render loop ----
  function startLoop() {
    if (rafId) return;
    function loop() {
      rafId = requestAnimationFrame(loop);
      tick();
    }
    loop();
  }

  function tick() {
    if (!dieMesh || !renderer) return;

    if (spinning) {
      rotVel.x *= 0.965;
      rotVel.y *= 0.965;
      rotVel.z *= 0.965;
      if (Math.abs(rotVel.x) + Math.abs(rotVel.y) + Math.abs(rotVel.z) < 0.003) {
        spinning = false;
        rotVel = { x: 0, y: 0, z: 0 };
        setHint('');
      }
    } else {
      // Gentle idle rotation
      rotVel.y = 0.006;
      rotVel.x = 0;
      rotVel.z = 0;
    }

    dieMesh.rotation.x += rotVel.x;
    dieMesh.rotation.y += rotVel.y;
    dieMesh.rotation.z += rotVel.z;

    renderer.render(scene, camera);
  }

  // ---- Hint label ----
  function setHint(text) {
    const h = document.getElementById('dice-3d-hint');
    if (h) h.textContent = text;
  }

  // ---- Public API ----
  window.dice3dSelectDie = function (sides) {
    currentSides = sides;
    if (initialized) buildDie(sides);
  };

  window.dice3dRoll = function () {
    if (!initialized) return;
    spinning = true;
    rotVel.x = (Math.random() - 0.5) * 0.7 + 0.3;
    rotVel.y = (Math.random() - 0.5) * 0.7 + 0.5;
    rotVel.z = (Math.random() - 0.5) * 0.4;
    setHint('🎲');
  };

  // Lazy init: trigger on first time dice page shown
  window.addEventListener('pageShown', function (e) {
    if (e.detail === 'dice') {
      setTimeout(init, 60);
    }
  });

})();
