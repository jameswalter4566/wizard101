import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface WizardProps {
  position: number[];
  rotation: number;
  chatMessage?: string;
  chatTime?: number;
  username?: string;
}

const Wizard: React.FC<WizardProps> = ({ position, rotation, chatMessage, chatTime, username }) => {
  const wizardRef = useRef<THREE.Group>(null);
  const staffRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (wizardRef.current) {
      // Update wizard position and rotation
      wizardRef.current.position.set(position[0], position[1], position[2]);
      wizardRef.current.rotation.y = rotation;
    }

    // Animate floating staff
    if (staffRef.current) {
      staffRef.current.rotation.y += 0.02;
      staffRef.current.position.y = 2.5 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <group ref={wizardRef} castShadow>
      {/* Wizard Body - Simple Cylinder */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.5, 1.5, 8]} />
        <meshStandardMaterial 
          color="#4c1d95" 
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>

      {/* Wizard Head */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial 
          color="#fbbf24" 
          roughness={0.8}
          metalness={0.0}
        />
      </mesh>

      {/* Wizard Hat */}
      <mesh position={[0, 2.2, 0]} castShadow>
        <coneGeometry args={[0.4, 1.2, 8]} />
        <meshStandardMaterial 
          color="#7c3aed" 
          roughness={0.6}
          metalness={0.2}
        />
      </mesh>

      {/* Hat Star */}
      <mesh position={[0, 2.8, 0]} castShadow>
        <octahedronGeometry args={[0.1]} />
        <meshStandardMaterial 
          color="#fde047" 
          emissive="#fde047"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Wizard Robe - Lower Part */}
      <mesh position={[0, -0.5, 0]} castShadow>
        <coneGeometry args={[0.8, 1.0, 8]} />
        <meshStandardMaterial 
          color="#581c87" 
          roughness={0.8}
          metalness={0.0}
        />
      </mesh>

      {/* Magical Staff */}
      <mesh ref={staffRef} position={[0.6, 2.5, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 2, 8]} />
        <meshStandardMaterial 
          color="#8b4513" 
          roughness={0.9}
          metalness={0.0}
        />
      </mesh>

      {/* Staff Crystal */}
      <mesh position={[0.6, 3.5, 0]} castShadow>
        <octahedronGeometry args={[0.15]} />
        <meshStandardMaterial 
          color="#a855f7" 
          emissive="#a855f7"
          emissiveIntensity={0.5}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Magical Aura Particles */}
      <group>
        {Array.from({ length: 8 }).map((_, i) => (
          <Particle key={i} index={i} />
        ))}
      </group>

      {/* Username Label */}
      {username && (
        <Html
          position={[0, 3, 0]}
          center
          style={{
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold',
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          {username}
        </Html>
      )}

      {/* Chat Bubble */}
      {chatMessage && chatTime && Date.now() - chatTime < 5000 && (
        <Html
          position={[0, 3.5, 0]}
          center
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '8px 12px',
            borderRadius: '12px',
            color: '#333',
            fontSize: '14px',
            maxWidth: '200px',
            wordWrap: 'break-word',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          {chatMessage}
        </Html>
      )}
    </group>
  );
};

// Floating magical particles around wizard
const Particle: React.FC<{ index: number }> = ({ index }) => {
  const particleRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (particleRef.current) {
      const time = state.clock.elapsedTime;
      const radius = 1.5;
      const speed = 0.5 + index * 0.1;
      const verticalOffset = Math.sin(time * speed * 2) * 0.3;
      
      particleRef.current.position.x = Math.sin(time * speed + index) * radius;
      particleRef.current.position.z = Math.cos(time * speed + index) * radius;
      particleRef.current.position.y = 1 + verticalOffset + index * 0.2;
      
      // Fade in and out
      const material = particleRef.current.material as THREE.MeshStandardMaterial;
      material.opacity = 0.3 + Math.sin(time * 3 + index) * 0.2;
    }
  });

  return (
    <mesh ref={particleRef}>
      <sphereGeometry args={[0.05, 8, 8]} />
      <meshStandardMaterial 
        color="#c084fc" 
        emissive="#c084fc"
        emissiveIntensity={0.4}
        transparent
        opacity={0.5}
      />
    </mesh>
  );
};

export default Wizard;