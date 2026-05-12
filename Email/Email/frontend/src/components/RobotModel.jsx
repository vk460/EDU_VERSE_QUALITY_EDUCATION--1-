import React, { useRef, useEffect } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';

export default function RobotModel({ animationState = 'Idle', theme = 'Apple Minimalist' }) {
  const group = useRef();
  const { scene, animations } = useGLTF('/RobotExpressive.glb');
  const { actions, mixer } = useAnimations(animations, group);

  useEffect(() => {
    // If actions are not loaded yet, do nothing
    if (!actions) return;

    // Crossfade animations for smooth transition
    Object.keys(actions).forEach((key) => {
      if (key !== animationState) {
        actions[key].fadeOut(0.5);
      }
    });

    if (actions[animationState]) {
      actions[animationState].reset().fadeIn(0.5).play();
    } else if (actions['Idle']) {
      actions['Idle'].reset().fadeIn(0.5).play();
    }
  }, [animationState, actions]);

  useEffect(() => {
    if (!scene) return;

    // We traverse the GLTF scene and dynamically change the materials based on the chosen theme.
    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        // Clone the material so we don't mutate the cached GLTF material globally
        child.material = child.material.clone();
        const matName = child.material.name.toLowerCase();
        
        // Define color palettes
        const palettes = {
          'Cyber Obsidian': { main: '#111116', dark: '#200030', light: '#444455', glow: '#00ffff', metal: 0.8 },
          'Apple Minimalist': { main: '#ffffff', dark: '#888888', light: '#dddddd', glow: '#44aaff', metal: 0.1 },
          'Sunset Gold': { main: '#fffaee', dark: '#ffd700', light: '#ffffff', glow: '#ff8c00', metal: 0.2 },
          'Industrial Mech': { main: '#4a4d52', dark: '#1a1c20', light: '#ff5500', glow: '#ff3300', metal: 0.6 },
          'Pastel Mint': { main: '#a8e6cf', dark: '#ffffff', light: '#dcfff2', glow: '#ffdf00', metal: 0.1 },
          'Custom Reference': { main: '#f8fafc', dark: '#3b82f6', light: '#ffffff', glow: '#06b6d4', metal: 0.1, face: '#0f172a' }
        };

        const activePalette = palettes[theme] || palettes['Custom Reference'];

        // Apply colors based on typical material names or rough material coloring
        if (matName.includes('main') || matName.includes('body')) {
          child.material.color.set(activePalette.main);
          child.material.metalness = activePalette.metal;
        } 
        
        if (matName.includes('dark') || matName.includes('joint') || matName.includes('grey')) {
          child.material.color.set(activePalette.dark);
          if (theme === 'Sunset Gold') {
              child.material.metalness = 1.0;
              child.material.roughness = 0.2;
          }
        }

        if (matName.includes('face') || matName.includes('screen') || matName.includes('black')) {
          child.material.color.set(activePalette.face || activePalette.dark);
        }

        if (matName.includes('light') || matName.includes('white')) {
          child.material.color.set(activePalette.light);
        }

        // Make eyes/screens glow
        if (matName.includes('green') || matName.includes('eye') || matName.includes('screen') || matName.includes('glow')) {
          child.material.color.set(activePalette.glow);
          child.material.emissive.set(activePalette.glow);
          child.material.emissiveIntensity = 2;
        }
      }
    });
  }, [theme, scene]);

  // Adjust position and scale so it fits perfectly inside the canvas without cutting off the head or legs
  return (
    <group ref={group} dispose={null} position={[0, -1.8, 0]} scale={0.75}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload('/RobotExpressive.glb');
