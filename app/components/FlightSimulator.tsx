'use client'

import { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sky, Cloud, Stars } from '@react-three/drei'
import * as THREE from 'three'

function Airplane() {
  const groupRef = useRef<THREE.Group>(null)
  const velocity = useRef(new THREE.Vector3(0, 0, -50))
  const rotation = useRef(new THREE.Euler(0, 0, 0))
  const keys = useRef<{ [key: string]: boolean }>({})
  const propellerRotation = useRef(0)

  const [stats, setStats] = useState({
    speed: 50,
    altitude: 100,
    pitch: 0,
    roll: 0,
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  useFrame((state, delta) => {
    if (!groupRef.current) return

    const speedMultiplier = 100
    const rotationSpeed = 1.5

    // Update propeller rotation
    propellerRotation.current += delta * 20

    // Pitch control (W/S - up/down)
    if (keys.current['w']) {
      rotation.current.x += rotationSpeed * delta
    }
    if (keys.current['s']) {
      rotation.current.x -= rotationSpeed * delta
    }

    // Roll control (A/D - left/right roll)
    if (keys.current['a']) {
      rotation.current.z += rotationSpeed * delta
    }
    if (keys.current['d']) {
      rotation.current.z -= rotationSpeed * delta
    }

    // Yaw control (Q/E - turn left/right)
    if (keys.current['q']) {
      rotation.current.y += rotationSpeed * delta
    }
    if (keys.current['e']) {
      rotation.current.y -= rotationSpeed * delta
    }

    // Speed control (Arrow Up/Down)
    if (keys.current['arrowup']) {
      velocity.current.z = Math.max(velocity.current.z - speedMultiplier * delta, -150)
    }
    if (keys.current['arrowdown']) {
      velocity.current.z = Math.min(velocity.current.z + speedMultiplier * delta, -20)
    }

    // Clamp rotations
    rotation.current.x = THREE.MathUtils.clamp(rotation.current.x, -Math.PI / 3, Math.PI / 3)
    rotation.current.z = THREE.MathUtils.clamp(rotation.current.z, -Math.PI / 3, Math.PI / 3)

    // Apply rotation
    groupRef.current.rotation.x = rotation.current.x
    groupRef.current.rotation.y = rotation.current.y
    groupRef.current.rotation.z = rotation.current.z

    // Calculate movement direction
    const direction = new THREE.Vector3(0, 0, 1)
    direction.applyEuler(rotation.current)

    const movement = direction.multiplyScalar(velocity.current.z * delta)
    groupRef.current.position.add(movement)

    // Keep airplane above ground
    if (groupRef.current.position.y < 10) {
      groupRef.current.position.y = 10
    }

    // Update camera to follow airplane
    const cameraOffset = new THREE.Vector3(0, 10, 30)
    cameraOffset.applyEuler(rotation.current)

    state.camera.position.lerp(
      groupRef.current.position.clone().add(cameraOffset),
      0.1
    )
    state.camera.lookAt(groupRef.current.position)

    // Update stats
    setStats({
      speed: Math.abs(velocity.current.z),
      altitude: Math.max(0, groupRef.current.position.y),
      pitch: (rotation.current.x * 180 / Math.PI),
      roll: (rotation.current.z * 180 / Math.PI),
    })
  })

  return (
    <group ref={groupRef} position={[0, 100, 0]}>
      {/* Fuselage */}
      <mesh>
        <cylinderGeometry args={[1, 1.5, 8, 8]} />
        <meshStandardMaterial color="#e0e0e0" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Nose cone */}
      <mesh position={[0, 4.5, 0]} rotation={[0, 0, 0]}>
        <coneGeometry args={[1, 2, 8]} />
        <meshStandardMaterial color="#ff0000" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Main wings */}
      <mesh position={[0, -1, 0]}>
        <boxGeometry args={[20, 0.3, 3]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Tail wing */}
      <mesh position={[0, -3, 0]}>
        <boxGeometry args={[6, 0.2, 2]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Vertical stabilizer */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[4, 0.2, 2]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Cockpit */}
      <mesh position={[0, 2, 0]}>
        <sphereGeometry args={[1.2, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#4a90e2"
          transparent
          opacity={0.6}
          metalness={0.5}
          roughness={0.1}
        />
      </mesh>

      {/* Propeller */}
      <mesh position={[0, 5.5, 0]} rotation={[0, propellerRotation.current, 0]}>
        <boxGeometry args={[0.2, 3, 0.2]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
    </group>
  )
}

function Terrain() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[2000, 2000, 50, 50]} />
      <meshStandardMaterial color="#3a8a3a" />
    </mesh>
  )
}

function Clouds() {
  const clouds = []
  for (let i = 0; i < 20; i++) {
    const x = (Math.random() - 0.5) * 1000
    const y = Math.random() * 100 + 50
    const z = (Math.random() - 0.5) * 1000
    clouds.push(
      <Cloud
        key={i}
        position={[x, y, z]}
        speed={0.2}
        opacity={0.5}
        segments={20}
        bounds={[10, 5, 5]}
        color="white"
      />
    )
  }
  return <>{clouds}</>
}

export default function FlightSimulator() {
  return (
    <>
      <Canvas camera={{ position: [0, 110, 30], fov: 75 }} shadows>
        <Sky sunPosition={[100, 20, 100]} />
        <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

        <ambientLight intensity={0.5} />
        <directionalLight
          position={[100, 100, 50]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        <Airplane />
        <Terrain />
        <Clouds />

        <fog attach="fog" args={['#87CEEB', 100, 1000]} />
      </Canvas>

      <div className="controls">
        <h2>✈️ Flight Controls</h2>
        <p><span className="key">W</span>/<span className="key">S</span> - Pitch Up/Down</p>
        <p><span className="key">A</span>/<span className="key">D</span> - Roll Left/Right</p>
        <p><span className="key">Q</span>/<span className="key">E</span> - Yaw Left/Right</p>
        <p><span className="key">↑</span>/<span className="key">↓</span> - Speed Up/Down</p>
      </div>

      <HUD />
    </>
  )
}

function HUD() {
  const [stats, setStats] = useState({
    speed: 50,
    altitude: 100,
    pitch: 0,
    roll: 0,
  })

  useEffect(() => {
    const interval = setInterval(() => {
      // Stats will be updated by the Airplane component
    }, 100)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="hud">
      <div>SPEED: {stats.speed.toFixed(1)} kt</div>
      <div>ALT: {stats.altitude.toFixed(0)} ft</div>
      <div>PITCH: {stats.pitch.toFixed(1)}°</div>
      <div>ROLL: {stats.roll.toFixed(1)}°</div>
    </div>
  )
}
