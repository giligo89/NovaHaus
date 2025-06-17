// main.js
import {
  Scene, WebGLRenderer, PerspectiveCamera, Color,
  AmbientLight, DirectionalLight, TextureLoader,
  MeshStandardMaterial, RepeatWrapping
} from 'three';

// Асинхронная загрузка зависимостей
async function loadGLTFLoader() {
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader');
  return GLTFLoader;
}

async function loadGSAP() {
  const gsapModule = await import('gsap');
  return gsapModule.default || gsapModule;
}

// Импорт анимаций (обновлен позже)
import { initPageAnimations } from './animations.js';

document.addEventListener('DOMContentLoaded', async () => {
  console.log('NovaHaus main.js loaded');

  // Асинхронная инициализация анимаций
  await initPageAnimations();

  // Scene variables
  let scene;
  let camera;
  let renderer;
  let model;

  let wallMaterials = [], floorMaterials = [];
  let currentWallIndex = 0, currentFloorIndex = 0;
  let wallMeshes = [], floorMeshes = [];

  // ========== DARK THEME TOGGLE ==========
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-theme');
      const isDark = document.body.classList.contains('dark-theme');
      themeToggle.textContent = isDark ? 'Светлая тема' : 'Тёмная тема';
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-theme');
      themeToggle.textContent = 'Светлая тема';
    }
  }

  // ========== 3D SCENE INITIALIZATION ==========
  const sceneCanvas = document.getElementById('scene');
  if (sceneCanvas && typeof THREE !== 'undefined') {
    await initScene();
    initGestures();
  }

  /**
   * Initializes the Three.js scene
   */
  async function initScene() {
    // Загружаем зависимости
    const GLTFLoader = await loadGLTFLoader();
    const gsap = await loadGSAP();

    // Scene setup
    scene = new Scene();
    scene.background = new Color(0xf5f5f5);

    // Camera setup
    camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 5);

    // Renderer setup
    renderer = new WebGLRenderer({
      canvas: sceneCanvas,
      antialias: true,
      alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Lighting
    const ambientLight = new AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);

    // Model loading
    const loader = new GLTFLoader();
    loader.load("{% static 'models/apartment_standard.glb' %}", (gltf) => {
      model = gltf.scene;
      scene.add(model);

      // Collect wall and floor meshes
      model.traverse(child => {
        if ('isMesh' in child) {
          if (child.name.toLowerCase().includes('wall')) {
            wallMeshes.push(child);
          } else if (child.name.toLowerCase().includes('floor')) {
            floorMeshes.push(child);
          }
        }
      });

      initMaterials();

      // Initial animation
      gsap.to(model.rotation, {
        y: Math.PI * 2,
        duration: 20,
        repeat: -1,
        ease: 'none'
      });
    }, undefined, (error) => {
      console.error('Error loading model:', error);
    });

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Window resize handler
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  /**
   * Initializes materials for walls and floors
   */
  function initMaterials() {
    wallMaterials = [
      createMaterial("{% static 'images/textures/wall1.jpg' %}"),
      createMaterial("{% static 'images/textures/wall2.jpg' %}"),
      createMaterial("{% static 'images/textures/wall3.jpg' %}")
    ];

    floorMaterials = [
      createMaterial("{% static 'images/textures/floor1.jpg' %}", 0.1, 0.1),
      createMaterial("{% static 'images/textures/floor2.jpg' %}", 0.1, 0.1),
      createMaterial("{% static 'images/textures/floor3.jpg' %}", 0.1, 0.1)
    ];

    applyMaterials();
  }

  /**
   * Creates a material with texture
   */
  function createMaterial(texturePath, roughness = 0.5, metalness = 0.5) {
    const textureLoader = new TextureLoader();
    const texture = textureLoader.load(texturePath);
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(4, 4);

    return new MeshStandardMaterial({
      map: texture,
      roughness: roughness,
      metalness: metalness
    });
  }

  /**
   * Applies current materials to walls and floors
   */
  function applyMaterials() {
    wallMeshes.forEach(mesh => {
      mesh.material = wallMaterials[currentWallIndex];
    });

    floorMeshes.forEach(mesh => {
      mesh.material = floorMaterials[currentFloorIndex];
    });
  }

  /**
   * Initializes touch gestures for mobile
   */
  function initGestures() {
    let startX = 0;

    sceneCanvas.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
    });

    sceneCanvas.addEventListener('touchend', e => {
      const endX = e.changedTouches[0].clientX;
      const diff = startX - endX;

      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          // Свайп влево
          currentWallIndex = (currentWallIndex + 1) % wallMaterials.length;
        } else {
          // Свайп вправо
          currentWallIndex = (currentWallIndex - 1 + wallMaterials.length) % wallMaterials.length;
        }
        applyMaterials();
      }
    });
  }

  // ========== UI HANDLERS ==========
  // Wall texture change handler
  const changeWallBtn = document.getElementById('change-wall');
  if (changeWallBtn) {
    changeWallBtn.addEventListener('click', async () => {
      const gsap = await loadGSAP();

      currentWallIndex = (currentWallIndex + 1) % wallMaterials.length;
      applyMaterials();

      gsap.to(changeWallBtn, {
        scale: 1.1,
        duration: 0.1,
        yoyo: true,
        repeat: 1
      });
    });
  }

  // Floor texture change handler
  const changeFloorBtn = document.getElementById('change-floor');
  if (changeFloorBtn) {
    changeFloorBtn.addEventListener('click', async () => {
      const gsap = await loadGSAP();

      currentFloorIndex = (currentFloorIndex + 1) % floorMaterials.length;
      applyMaterials();

      gsap.to(changeFloorBtn, {
        scale: 1.1,
        duration: 0.1,
        yoyo: true,
        repeat: 1
      });
    });
  }
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('{% static "js/service-worker.js" %}')
        .then(reg => console.log('Service Worker registered', reg))
        .catch(err => console.error('Service Worker registration failed', err));
}