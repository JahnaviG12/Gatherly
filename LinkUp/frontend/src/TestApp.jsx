import React, { useState, useEffect } from 'react'

export default function TestApp() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setCount(c => c + 1), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{padding:40}}>
      <h2>Test Harness</h2>
      <p>useState tick: {count}</p>
      <p>If this increments, hooks work.</p>
    </div>
  )
}
