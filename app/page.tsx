'use client'

import dynamic from 'next/dynamic'

const FlightSimulator = dynamic(() => import('./components/FlightSimulator'), {
  ssr: false,
  loading: () => <div className="loading">Loading Flight Simulator...</div>
})

export default function Home() {
  return (
    <main style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
      <FlightSimulator />
    </main>
  )
}
