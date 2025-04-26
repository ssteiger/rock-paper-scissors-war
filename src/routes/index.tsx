import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import type { FormEvent } from 'react'

export const Route = createFileRoute('/')({
  component: Home,
})

type EmojiType = 'rock' | 'paper' | 'scissors'
type Emoji = {
  id: number
  type: EmojiType
  position: { x: number, y: number }
  velocity: { x: number, y: number }
}

function Home() {
  const [emojiSize, setEmojiSize] = useState(24) // size in pixels

  const [emojis, setEmojis] = useState<Emoji[]>([])

  const [rockCount, setRockCount] = useState(50)
  const [paperCount, setPaperCount] = useState(50)
  const [scissorsCount, setScissorsCount] = useState(50)

  const [speedMultiplier, setSpeedMultiplier] = useState(3)

  const containerRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  const nextId = useRef(1)
  
  // Map emoji types to actual emoji characters
  const emojiMap: Record<EmojiType, string> = {
    rock: '🪨',
    paper: '📄',
    scissors: '✂️'
  }
  
  // Calculate emoji statistics for the header
  const emojiStats = useMemo(() => {
    const counts = {
      rock: 0,
      paper: 0,
      scissors: 0
    }
    
    // Count each type of emoji
    for (const emoji of emojis) {
      counts[emoji.type]++;
    }
    
    const total = emojis.length || 1 // Avoid division by zero
    
    // Calculate percentages
    const percentages = {
      rock: (counts.rock / total) * 100,
      paper: (counts.paper / total) * 100,
      scissors: (counts.scissors / total) * 100
    }
    
    return { counts, percentages, total }
  }, [emojis])
  
  // Function to create a new emoji with random position and velocity
  const createEmoji = useCallback((type: EmojiType): Emoji => {
    const containerWidth = containerRef.current?.clientWidth || window.innerWidth
    const containerHeight = containerRef.current?.clientHeight || window.innerHeight
    
    return {
      id: nextId.current++,
      type,
      position: {
        x: Math.random() * (containerWidth - emojiSize),
        y: Math.random() * (containerHeight - emojiSize),
      },
      velocity: {
        x: (Math.random() * 4 - 2) * speedMultiplier,
        y: (Math.random() * 4 - 2) * speedMultiplier
      }
    }
  }, [emojiSize, speedMultiplier])
  
  // Update emojis when counts change
  const updateEmojis = useCallback(() => {
    const newEmojis: Emoji[] = []
    
    // Add rock emojis
    for (let i = 0; i < rockCount; i++) {
      newEmojis.push(createEmoji('rock'))
    }
    
    // Add paper emojis
    for (let i = 0; i < paperCount; i++) {
      newEmojis.push(createEmoji('paper'))
    }
    
    // Add scissors emojis
    for (let i = 0; i < scissorsCount; i++) {
      newEmojis.push(createEmoji('scissors'))
    }
    
    setEmojis(newEmojis)
  }, [rockCount, paperCount, scissorsCount, createEmoji])
  
  // Initialize emojis
  useEffect(() => {
    updateEmojis()
  }, [updateEmojis])
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    updateEmojis()
  }
  
  // Update existing emoji speeds when speed multiplier changes
  useEffect(() => {
    setEmojis(prevEmojis => 
      prevEmojis.map(emoji => {
        // Keep direction the same but adjust speed
        const normalizedVelX = emoji.velocity.x / Math.abs(emoji.velocity.x) || 0
        const normalizedVelY = emoji.velocity.y / Math.abs(emoji.velocity.y) || 0
        
        const speedX = normalizedVelX * Math.random() * 4 * speedMultiplier
        const speedY = normalizedVelY * Math.random() * 4 * speedMultiplier
        
        return {
          ...emoji,
          velocity: {
            x: speedX,
            y: speedY
          }
        }
      })
    )
  }, [speedMultiplier])
  
  useEffect(() => {
    const moveEmojis = () => {
      if (!containerRef.current) return
      
      const containerWidth = containerRef.current.clientWidth
      const containerHeight = containerRef.current.clientHeight
      const headerHeight = headerRef.current?.clientHeight || 60 // Default header height
      
      setEmojis(prevEmojis => {
        // Check for collisions function
        const checkCollisions = (emojis: Emoji[]) => {
          const collisions: Array<{id1: number, id2: number, type1: EmojiType, type2: EmojiType}> = []
          
          // Check each pair of emojis
          for (let i = 0; i < emojis.length; i++) {
            for (let j = i + 1; j < emojis.length; j++) {
              const emoji1 = emojis[i]
              const emoji2 = emojis[j]
              
              // Simple collision detection based on distance
              const dx = emoji1.position.x - emoji2.position.x
              const dy = emoji1.position.y - emoji2.position.y
              const distance = Math.sqrt(dx * dx + dy * dy)
              
              if (distance < emojiSize * 2) {
                collisions.push({
                  id1: emoji1.id,
                  id2: emoji2.id,
                  type1: emoji1.type,
                  type2: emoji2.type
                })
              }
            }
          }
          
          return collisions
        }
        
        // First move all emojis
        const updatedEmojis = prevEmojis.map(emoji => {
          let newX = emoji.position.x + emoji.velocity.x
          let newY = emoji.position.y + emoji.velocity.y
          let newVelocityX = emoji.velocity.x
          let newVelocityY = emoji.velocity.y
          
          // Check boundaries and bounce
          if (newX <= 0 || newX + emojiSize * 1.5 >= containerWidth) {
            newVelocityX = -emoji.velocity.x // Reverse x direction
          }
          
          // Bottom boundary
          if (newY + emojiSize * 1.5 >= containerHeight) {
            newVelocityY = -emoji.velocity.y // Reverse y direction
          }
          
          // Top boundary - bounce off header instead of screen top
          if (newY <= headerHeight) {
            newVelocityY = Math.abs(emoji.velocity.y) // Ensure downward velocity
            newY = headerHeight // Place at header boundary
          }
          
          // Ensure emoji stays in bounds
          newX = Math.max(0, Math.min(containerWidth - emojiSize * 1.5, newX))
          newY = Math.max(headerHeight, Math.min(containerHeight - emojiSize * 1.5, newY))
          
          return {
            ...emoji,
            position: { x: newX, y: newY },
            velocity: { x: newVelocityX, y: newVelocityY }
          }
        })
        
        // Check for collisions after all emojis have moved
        const collisions = checkCollisions(updatedEmojis)
        
        // Apply collision rules
        for (const collision of collisions) {
          const { id1, id2, type1, type2 } = collision
          
          // Rock vs Scissors: Scissors turns into Rock
          if ((type1 === 'rock' && type2 === 'scissors')) {
            const index = updatedEmojis.findIndex(e => e.id === id2)
            if (index !== -1) {
              updatedEmojis[index] = { ...updatedEmojis[index], type: 'rock' }
            }
          } 
          else if ((type2 === 'rock' && type1 === 'scissors')) {
            const index = updatedEmojis.findIndex(e => e.id === id1)
            if (index !== -1) {
              updatedEmojis[index] = { ...updatedEmojis[index], type: 'rock' }
            }
          }
          
          // Paper vs Rock: Rock turns into Paper
          if ((type1 === 'paper' && type2 === 'rock')) {
            const index = updatedEmojis.findIndex(e => e.id === id2)
            if (index !== -1) {
              updatedEmojis[index] = { ...updatedEmojis[index], type: 'paper' }
            }
          }
          else if ((type2 === 'paper' && type1 === 'rock')) {
            const index = updatedEmojis.findIndex(e => e.id === id1)
            if (index !== -1) {
              updatedEmojis[index] = { ...updatedEmojis[index], type: 'paper' }
            }
          }
          
          // Scissors vs Paper: Paper turns into Scissors
          if ((type1 === 'scissors' && type2 === 'paper')) {
            const index = updatedEmojis.findIndex(e => e.id === id2)
            if (index !== -1) {
              updatedEmojis[index] = { ...updatedEmojis[index], type: 'scissors' }
            }
          }
          else if ((type2 === 'scissors' && type1 === 'paper')) {
            const index = updatedEmojis.findIndex(e => e.id === id1)
            if (index !== -1) {
              updatedEmojis[index] = { ...updatedEmojis[index], type: 'scissors' }
            }
          }
        }
        
        return updatedEmojis
      })
    }
    
    const animationId = setInterval(moveEmojis, 30)
    
    return () => clearInterval(animationId)
  }, [emojiSize])
  
  return (
    <div 
      ref={containerRef}
      className="h-screen w-full overflow-hidden relative bg-gray-100"
    >
      {/* Header with emoji counts */}
      <div 
        ref={headerRef}
        className="fixed top-0 left-0 w-full bg-white shadow-md p-3 z-10 flex justify-center"
      >
        <div className="flex gap-6 items-center">
          {Object.entries(emojiMap).map(([type, emoji]) => {
            const emojiType = type as EmojiType
            return (
              <div key={type} className="flex flex-col items-center">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{emoji}</span>
                  <span className="font-bold text-black">{emojiStats.counts[emojiType]}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {emojiStats.percentages[emojiType].toFixed(1)}%
                </div>
              </div>
            )
          })}
          <div className="text-sm text-gray-700 ml-4">
            Total: <span className="font-bold">{emojiStats.total}</span>
          </div>
        </div>
      </div>
      
      {emojis.map(emoji => (
        <div 
          key={emoji.id}
          className="absolute"
          style={{ 
            left: `${emoji.position.x}px`, 
            top: `${emoji.position.y}px`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: `${emojiSize}px`
          }}
        >
          {emojiMap[emoji.type]}
        </div>
      ))}
      
      {/* Control panel */}
      <div className="absolute bottom-4 left-4 p-4 bg-white text-black shadow-md rounded-md z-10">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <h3 className="font-bold text-sm">Emoji Controls</h3>
          
          <div className="flex gap-2 items-center">
            <label htmlFor="rockCount" className="text-sm">
              {emojiMap.rock}:
            </label>
            <input
              id="rockCount"
              type="number"
              min="0"
              value={rockCount}
              onChange={(e) => setRockCount(Number.parseInt(e.target.value) || 0)}
              className="w-16 p-1 border rounded bg-white"
            />
          </div>
          
          <div className="flex gap-2 items-center">
            <label htmlFor="paperCount" className="text-sm">
              {emojiMap.paper}:
            </label>
            <input
              id="paperCount"
              type="number"
              min="0"
              value={paperCount}
              onChange={(e) => setPaperCount(Number.parseInt(e.target.value) || 0)}
              className="w-16 p-1 border rounded bg-white"
            />
          </div>
          
          <div className="flex gap-2 items-center">
            <label htmlFor="scissorsCount" className="text-sm">
              {emojiMap.scissors}:
            </label>
            <input
              id="scissorsCount"
              type="number"
              min="0"
              value={scissorsCount}
              onChange={(e) => setScissorsCount(Number.parseInt(e.target.value) || 0)}
              className="w-16 p-1 border rounded bg-white"
            />
          </div>
          
          <div className="flex flex-col gap-1 mt-2">
            <label htmlFor="speedControl" className="text-sm flex justify-between">
              <span>Speed:</span>
              <span className="text-gray-600">{speedMultiplier.toFixed(1)}x</span>
            </label>
            <input
              id="speedControl"
              type="range"
              min="0.5"
              max="10"
              step="0.5"
              value={speedMultiplier}
              onChange={(e) => setSpeedMultiplier(Number.parseFloat(e.target.value))}
              className="w-full bg-white"
            />
          </div>
          
          <div className="flex flex-col gap-1 mt-2">
            <label htmlFor="sizeControl" className="text-sm flex justify-between">
              <span>Size:</span>
              <span className="text-gray-600">{emojiSize}px</span>
            </label>
            <input
              id="sizeControl"
              type="range"
              min="10"
              max="60"
              step="2"
              value={emojiSize}
              onChange={(e) => setEmojiSize(Number.parseInt(e.target.value))}
              className="w-full bg-white"
            />
          </div>
          
          <button 
            type="submit" 
            className="mt-2 bg-blue-500 text-white p-1 rounded hover:bg-blue-600 text-sm"
          >
            Update
          </button>
        </form>
      </div>
    </div>
  )
}
