import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { theme } from "../theme";

// Builds a stylized, low-poly skeleton out of primitive geometry (spheres,
// cylinders, capsules) since we don't have a licensed 3D scan to bundle.
// It's a study aid / orientation tool, not a photoreal model.

const BONE_COLOR = 0xf2ead9;
const HIGHLIGHT_COLOR = 0xf2578d;

function buildSkeleton(THREE) {
  const group = new THREE.Group();
  const boneMat = new THREE.MeshStandardMaterial({ color: BONE_COLOR, roughness: 0.6, metalness: 0.05 });

  function addPart(name, mesh, x, y, z, rx = 0, ry = 0, rz = 0) {
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.userData.name = name;
    mesh.userData.baseColor = BONE_COLOR;
    group.add(mesh);
    return mesh;
  }

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 24), boneMat.clone());
  addPart("Skull", skull, 0, 3.4, 0);

  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.35), boneMat.clone());
  addPart("Jaw", jaw, 0, 3.0, 0.1);

  for (let i = 0; i < 7; i++) {
    const v = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.14, 12), boneMat.clone());
    addPart("Cervical vertebra " + (i + 1), v, 0, 3.15 - i * 0.15, 0);
  }

  for (let i = 0; i < 12; i++) {
    const v = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.15, 12), boneMat.clone());
    addPart("Thoracic vertebra " + (i + 1), v, 0, 2.1 - i * 0.16, 0);
  }

  for (let i = 0; i < 5; i++) {
    const v = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.15, 0.17, 12), boneMat.clone());
    addPart("Lumbar vertebra " + (i + 1), v, 0, 0.15 - i * 0.18, 0);
  }

  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < 8; i++) {
      const curve = new THREE.EllipseCurve(0, 0, 0.75 - i * 0.02, 0.45, 0, Math.PI, false, 0);
      const points = curve.getPoints(20).map((p) => new THREE.Vector3(p.x * side, p.y, 0));
      const path = new THREE.CatmullRomCurve3(points);
      const geo = new THREE.TubeGeometry(path, 20, 0.035, 8, false);
      const rib = new THREE.Mesh(geo, boneMat.clone());
      addPart("Rib " + (i + 1) + (side === -1 ? " (left)" : " (right)"), rib, side * 0.15, 1.9 - i * 0.16, -0.1, 0, side === -1 ? Math.PI : 0, 0);
    }
  }

  const sternum = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.1, 0.1), boneMat.clone());
  addPart("Sternum", sternum, 0, 1.6, 0.5);

  const pelvis = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.2, 12, 24, Math.PI), boneMat.clone());
  addPart("Pelvis", pelvis, 0, -0.9, 0, Math.PI, 0, 0);

  for (let side = -1; side <= 1; side += 2) {
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), boneMat.clone());
    addPart("Shoulder joint" + (side === -1 ? " (left)" : " (right)"), shoulder, side * 0.75, 2.0, 0);

    const humerus = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 1.1, 12), boneMat.clone());
    addPart("Humerus" + (side === -1 ? " (left)" : " (right)"), humerus, side * 0.85, 1.4, 0, 0, 0, side * 0.15);

    const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), boneMat.clone());
    addPart("Elbow joint" + (side === -1 ? " (left)" : " (right)"), elbow, side * 0.95, 0.85, 0);

    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.07, 1.0, 12), boneMat.clone());
    addPart("Forearm" + (side === -1 ? " (left)" : " (right)"), forearm, side * 1.0, 0.35, 0, 0, 0, side * 0.1);

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 12), boneMat.clone());
    addPart("Hand" + (side === -1 ? " (left)" : " (right)"), hand, side * 1.05, -0.2, 0);

    const hip = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), boneMat.clone());
    addPart("Hip joint" + (side === -1 ? " (left)" : " (right)"), hip, side * 0.35, -0.95, 0);

    const femur = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 1.4, 12), boneMat.clone());
    addPart("Femur" + (side === -1 ? " (left)" : " (right)"), femur, side * 0.35, -1.7, 0);

    const knee = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 12), boneMat.clone());
    addPart("Knee joint" + (side === -1 ? " (left)" : " (right)"), knee, side * 0.35, -2.4, 0);

    const tibia = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 1.3, 12), boneMat.clone());
    addPart("Tibia" + (side === -1 ? " (left)" : " (right)"), tibia, side * 0.35, -3.1, 0);

    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.4), boneMat.clone());
    addPart("Foot" + (side === -1 ? " (left)" : " (right)"), foot, side * 0.35, -3.8, 0.15);
  }

  return group;
}

function buildOrgans(THREE) {
  const group = new THREE.Group();

  const heart = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xcc4d5e, roughness: 0.5 })
  );
  heart.position.set(0.1, 1.7, 0.15);
  heart.userData.name = "Heart";
  group.add(heart);

  for (const side of [-1, 1]) {
    const lung = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xe8a3ac, roughness: 0.6 })
    );
    lung.scale.set(0.7, 1.3, 0.9);
    lung.position.set(side * 0.42, 1.7, -0.05);
    lung.userData.name = "Lung" + (side === -1 ? " (left)" : " (right)");
    group.add(lung);
  }

  const liver = new THREE.Mesh(
    new THREE.SphereGeometry(0.38, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0x8b4a3d, roughness: 0.55 })
  );
  liver.scale.set(1.2, 0.6, 0.8);
  liver.position.set(0.25, 0.85, 0.1);
  liver.userData.name = "Liver";
  group.add(liver);

  const stomach = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xd98e9b, roughness: 0.6 })
  );
  stomach.scale.set(1.1, 0.8, 0.8);
  stomach.position.set(-0.3, 0.7, 0.15);
  stomach.userData.name = "Stomach";
  group.add(stomach);

  return group;
}

export default function Anatomy3D() {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const [selectedName, setSelectedName] = useState(null);
  const [showOrgans, setShowOrgans] = useState(false);

  useEffect(() => {
    let renderer, scene, camera, controls, animationId;
    let skeletonGroup, organsGroup;
    let raycaster, mouse;
    let mounted = true;

    async function init() {
      const THREE = await import("three");
      const { OrbitControls } = await import("three-stdlib");

      if (!mounted || !containerRef.current) return;

      const container = containerRef.current;
      const width = container.clientWidth || 350;
      const height = container.clientHeight || 450;

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xfff0f6);

      camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      camera.position.set(0, 0.5, 6);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.innerHTML = "";
      container.appendChild(renderer.domElement);

      const ambient = new THREE.AmbientLight(0xffffff, 0.7);
      scene.add(ambient);
      const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
      dirLight.position.set(3, 5, 4);
      scene.add(dirLight);
      const fillLight = new THREE.DirectionalLight(0xffd6e8, 0.4);
      fillLight.position.set(-4, -2, -3);
      scene.add(fillLight);

      skeletonGroup = buildSkeleton(THREE);
      scene.add(skeletonGroup);

      organsGroup = buildOrgans(THREE);
      organsGroup.visible = false;
      scene.add(organsGroup);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.minDistance = 2.5;
      controls.maxDistance = 12;
      controls.target.set(0, 0.5, 0);
      controls.update();

      raycaster = new THREE.Raycaster();
      mouse = new THREE.Vector2();

      function onPointerDown(event) {
        const rect = renderer.domElement.getBoundingClientRect();
        const clientX = event.touches ? event.touches[0].clientX : event.clientX;
        const clientY = event.touches ? event.touches[0].clientY : event.clientY;
        mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const targets = [...skeletonGroup.children, ...organsGroup.children];
        const hits = raycaster.intersectObjects(targets);

        skeletonGroup.children.forEach((m) => {
          if (m.material && m.userData.baseColor !== undefined) {
            m.material.color.setHex(m.userData.baseColor);
          }
        });

        if (hits.length > 0) {
          const hit = hits[0].object;
          setSelectedName(hit.userData.name || null);
          if (hit.material && hit.userData.baseColor !== undefined) {
            hit.material.color.setHex(HIGHLIGHT_COLOR);
          }
        }
      }

      renderer.domElement.addEventListener("pointerdown", onPointerDown);

      function animate() {
        animationId = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      }
      animate();

      function handleResize() {
        if (!container) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
      window.addEventListener("resize", handleResize);

      sceneRef.current = {
        cleanup: () => {
          window.removeEventListener("resize", handleResize);
          renderer.domElement.removeEventListener("pointerdown", onPointerDown);
          cancelAnimationFrame(animationId);
          renderer.dispose();
        },
        setOrgansVisible: (v) => {
          organsGroup.visible = v;
        },
      };
    }

    init();

    return () => {
      mounted = false;
      if (sceneRef.current) sceneRef.current.cleanup();
    };
  }, []);

  useEffect(() => {
    if (sceneRef.current) sceneRef.current.setOrgansVisible(showOrgans);
  }, [showOrgans]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={[styles.toggleButton, showOrgans && styles.toggleButtonActive]}
          onPress={() => setShowOrgans((v) => !v)}
        >
          <Text style={[styles.toggleButtonText, showOrgans && styles.toggleButtonTextActive]}>
            {showOrgans ? "Hide organs" : "Show organs"}
          </Text>
        </TouchableOpacity>
        {selectedName && (
          <View style={styles.labelPill}>
            <Text style={styles.labelText}>{selectedName}</Text>
          </View>
        )}
      </View>
      <div ref={containerRef} style={{ flex: 1, width: "100%", height: "100%", borderRadius: 16, overflow: "hidden" }} />
      <Text style={styles.hint}>Drag to rotate · scroll/pinch to zoom · tap a bone to name it</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: "row", alignItems: "center", marginBottom: 8, flexWrap: "wrap" },
  toggleButton: {
    backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 14, paddingVertical: 10, paddingHorizontal: 16,
    borderWidth: 1, borderColor: theme.cardBorder, marginRight: 10,
  },
  toggleButtonActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  toggleButtonText: { color: theme.text, fontWeight: "700" },
  toggleButtonTextActive: { color: "#fff" },
  labelPill: {
    backgroundColor: theme.primary, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 14,
  },
  labelText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  hint: { textAlign: "center", color: theme.muted, fontSize: 12, marginTop: 8 },
});
