import React, { useState, useEffect, useRef } from 'react'
import './Game.css'

const ROWS = 20
const COLS = 10
const BLOCK_SIZE = 30

const TETRIS_BLOCKS = {
  I: { shape: [[1, 1, 1, 1]], color: '#00F0F0' },
  O: { shape: [[1, 1], [1, 1]], color: '#F0F000' },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: '#A000F0' },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: '#00F000' },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: '#F00000' },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: '#0000F0' },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: '#F0A000' },
}

const BLOCK_TYPES = Object.keys(TETRIS_BLOCKS)

const getNewPiece = () => {
  const type = BLOCK_TYPES[Math.floor(Math.random() * BLOCK_TYPES.length)]
  return {
    type,
    shape: TETRIS_BLOCKS[type].shape,
    color: TETRIS_BLOCKS[type].color,
    x: 3,
    y: 0,
  }
}

const Game = () => {
  const [board, setBoard] = useState(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)))
  const [current, setCurrent] = useState(getNewPiece())
  const [next] = useState(getNewPiece())
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [paused, setPaused] = useState(false)
  const [started, setStarted] = useState(false)
  const gameLoopRef = useRef()
  const gameTimeRef = useRef(0)

  // Rotate piece 90 degrees clockwise
  const rotatePiece = (piece) => {
    const { shape } = piece
    const newShape = shape[0].map((_, colIndex) =>
      shape.map(row => row[colIndex]).reverse()
    )
    return { ...piece, shape: newShape }
  }

  // Check collision
  const canPlace = (piece, offsetX = 0, offsetY = 0) => {
    const newX = piece.x + offsetX
    const newY = piece.y + offsetY

    for (let row = 0; row < piece.shape.length; row++) {
      for (let col = 0; col < piece.shape[row].length; col++) {
        if (piece.shape[row][col]) {
          const boardX = newX + col
          const boardY = newY + row

          if (boardX < 0 || boardX >= COLS || boardY >= ROWS) return false
          if (boardY >= 0 && board[boardY]?.[boardX] !== null) return false
        }
      }
    }
    return true
  }

  // Lock piece to board
  const lockPiece = (piece, newBoard) => {
    const locked = newBoard.map(row => [...row])
    for (let row = 0; row < piece.shape.length; row++) {
      for (let col = 0; col < piece.shape[row].length; col++) {
        if (piece.shape[row][col]) {
          const y = piece.y + row
          const x = piece.x + col
          if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
            locked[y][x] = piece.color
          }
        }
      }
    }
    return locked
  }

  // Clear lines
  const clearLines = (newBoard) => {
    let clearedLines = 0
    const filtered = newBoard.filter(row => {
      if (row.every(cell => cell !== null)) {
        clearedLines++
        return false
      }
      return true
    })

    while (filtered.length < ROWS) {
      filtered.unshift(Array(COLS).fill(null))
    }

    return { board: filtered, lines: clearedLines }
  }

  // Game loop
  useEffect(() => {
    if (!started || gameOver || paused) return

    const interval = setInterval(() => {
      gameTimeRef.current += 50

      setCurrent(prev => {
        if (canPlace(prev, 0, 1)) {
          return { ...prev, y: prev.y + 1 }
        } else {
          // Lock piece
          let newBoard = lockPiece(prev, board)
          const { board: clearedBoard, lines } = clearLines(newBoard)

          setBoard(clearedBoard)
          setScore(s => s + lines * 100)

          const newPiece = getNewPiece()
          if (!canPlace(newPiece, 0, 0)) {
            setGameOver(true)
          }
          return newPiece
        }
      })
    }, 500)

    return () => clearInterval(interval)
  }, [started, gameOver, paused, board])

  // Keyboard controls
  useEffect(() => {
    if (!started || gameOver || paused) return

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          setCurrent(prev => canPlace(prev, -1, 0) ? { ...prev, x: prev.x - 1 } : prev)
          break
        case 'ArrowRight':
          e.preventDefault()
          setCurrent(prev => canPlace(prev, 1, 0) ? { ...prev, x: prev.x + 1 } : prev)
          break
        case 'ArrowDown':
          e.preventDefault()
          setCurrent(prev => canPlace(prev, 0, 1) ? { ...prev, y: prev.y + 1 } : prev)
          break
        case ' ':
          e.preventDefault()
          // Hard drop
          setCurrent(prev => {
            let dropped = { ...prev }
            while (canPlace(dropped, 0, 1)) {
              dropped.y++
            }
            return dropped
          })
          break
        case 'w':
        case 'W':
        case 'ArrowUp':
          e.preventDefault()
          // Rotate piece
          setCurrent(prev => {
            const rotated = rotatePiece(prev)
            // Try to place at current position first
            if (canPlace(rotated, 0, 0)) {
              return rotated
            }
            // Try to knock it left or right to fit (wall kick)
            for (let offset = 1; offset <= 2; offset++) {
              if (canPlace(rotated, -offset, 0)) {
                return { ...rotated, x: rotated.x - offset }
              }
              if (canPlace(rotated, offset, 0)) {
                return { ...rotated, x: rotated.x + offset }
              }
            }
            // If can't rotate, return original piece
            return prev
          })
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [started, gameOver, paused, board])

  // Render game state as text for testing
  const renderGameToText = () => {
    const payload = {
      mode: gameOver ? 'game_over' : paused ? 'paused' : started ? 'playing' : 'menu',
      started,
      gameOver,
      paused,
      score,
      current: {
        x: current.x,
        y: current.y,
        type: current.type,
      },
      boardRows: ROWS,
      boardCols: COLS,
    }
    return JSON.stringify(payload)
  }

  // Expose functions for Playwright
  useEffect(() => {
    window.render_game_to_text = renderGameToText
    window.advanceTime = (ms) => {
      // Advance game time deterministically
      gameTimeRef.current += ms
    }
  }, [gameOver, paused, started, score, current])

  const startGame = () => {
    setStarted(true)
    setBoard(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)))
    setScore(0)
    setGameOver(false)
    setPaused(false)
    setCurrent(getNewPiece())
  }

  const togglePause = () => {
    if (started && !gameOver) {
      setPaused(!paused)
    }
  }

  const resetGame = () => {
    setStarted(false)
    setGameOver(false)
    setPaused(false)
    setBoard(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)))
    setScore(0)
    setCurrent(getNewPiece())
  }

  return (
    <div className="game-container">
      <div className="game-wrapper">
        <div className="game-board">
          <canvas
            id="tetris-canvas"
            width={COLS * BLOCK_SIZE}
            height={ROWS * BLOCK_SIZE}
            ref={(canvas) => {
              if (canvas) {
                const ctx = canvas.getContext('2d')
                ctx.fillStyle = '#000'
                ctx.fillRect(0, 0, canvas.width, canvas.height)

                // Draw grid
                ctx.strokeStyle = '#333'
                ctx.lineWidth = 0.5
                for (let i = 0; i <= ROWS; i++) {
                  ctx.beginPath()
                  ctx.moveTo(0, i * BLOCK_SIZE)
                  ctx.lineTo(COLS * BLOCK_SIZE, i * BLOCK_SIZE)
                  ctx.stroke()
                }
                for (let i = 0; i <= COLS; i++) {
                  ctx.beginPath()
                  ctx.moveTo(i * BLOCK_SIZE, 0)
                  ctx.lineTo(i * BLOCK_SIZE, ROWS * BLOCK_SIZE)
                  ctx.stroke()
                }

                // Draw placed blocks
                for (let y = 0; y < ROWS; y++) {
                  for (let x = 0; x < COLS; x++) {
                    if (board[y][x]) {
                      ctx.fillStyle = board[y][x]
                      ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1)
                      ctx.strokeStyle = '#666'
                      ctx.lineWidth = 1
                      ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1)
                    }
                  }
                }

                // Draw current piece
                if (started && current && !gameOver) {
                  ctx.fillStyle = current.color
                  for (let row = 0; row < current.shape.length; row++) {
                    for (let col = 0; col < current.shape[row].length; col++) {
                      if (current.shape[row][col]) {
                        const x = (current.x + col) * BLOCK_SIZE
                        const y = (current.y + row) * BLOCK_SIZE
                        ctx.fillRect(x, y, BLOCK_SIZE - 1, BLOCK_SIZE - 1)
                        ctx.strokeStyle = '#fff'
                        ctx.lineWidth = 1
                        ctx.strokeRect(x, y, BLOCK_SIZE - 1, BLOCK_SIZE - 1)
                      }
                    }
                  }
                }
              }
            }}
          />
        </div>

        <div className="game-info">
          <h1>TETRIS</h1>
          <div className="score">
            <p>Score: <span id="score-value">{score}</span></p>
          </div>

          {!started ? (
            <div className="menu">
              <button id="start-btn" onClick={startGame}>START GAME</button>
              <div className="controls">
                <p>← → Arrow Keys to Move</p>
                <p>↓ Arrow Down to Drop</p>
                <p>W or ↑ Arrow Up to Rotate</p>
                <p>SPACE for Hard Drop</p>
              </div>
            </div>
          ) : (
            <div className="controls-active">
              <button id="pause-btn" onClick={togglePause}>
                {paused ? 'RESUME' : 'PAUSE'}
              </button>
              <button id="reset-btn" onClick={resetGame}>RESET</button>
              {gameOver && <div id="game-over-text" className="game-over-message">GAME OVER</div>}
              {paused && <div className="pause-message">PAUSED</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Game
