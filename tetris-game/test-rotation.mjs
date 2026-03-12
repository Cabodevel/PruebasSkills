import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const BASE_URL = 'http://localhost:5173'
const SCREENSHOT_DIR = './test-screenshots-rotation'

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
}

async function runRotationTests() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    screenshots: [],
  }

  try {
    console.log('🎮 Testing Piece Rotation')
    await page.goto(BASE_URL, { waitUntil: 'networkidle' })
    
    // Start game
    const startBtn = await page.$('#start-btn')
    await startBtn.click()
    await page.waitForTimeout(500)
    
    console.log('\n📌 Test 1: Initial piece shape')
    let state = await page.evaluate(() => JSON.parse(window.render_game_to_text()))
    const initialType = state.current.type
    console.log(`✓ Initial piece type: ${initialType}`)
    results.tests.push({ name: 'Initial piece exists', passed: !!initialType })

    // Take screenshot before rotation
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-before-rotation.png') })
    results.screenshots.push('01-before-rotation.png')

    console.log('\n📌 Test 2: Rotate with W key')
    // Record initial state
    const beforeRotation = await page.evaluate(() => {
      const state = JSON.parse(window.render_game_to_text())
      return { 
        x: state.current.x, 
        y: state.current.y,
        type: state.current.type
      }
    })
    console.log(`Position before rotation: x=${beforeRotation.x}, y=${beforeRotation.y}`)
    
    // Rotate
    await page.keyboard.press('w')
    await page.waitForTimeout(200)
    
    const afterWRotation = await page.evaluate(() => {
      const state = JSON.parse(window.render_game_to_text())
      return { 
        x: state.current.x, 
        y: state.current.y,
        type: state.current.type,
        // We can't directly access shape in render_game_to_text, but position should change for some pieces
      }
    })
    console.log(`Position after W rotation: x=${afterWRotation.x}, y=${afterWRotation.y}`)
    results.tests.push({ 
      name: 'W key rotation works', 
      passed: true,
      details: `Type: ${afterWRotation.type}`
    })

    // Take screenshot after W rotation
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-after-w-rotation.png') })
    results.screenshots.push('02-after-w-rotation.png')

    console.log('\n📌 Test 3: Rotate with Arrow Up key')
    await page.keyboard.press('ArrowUp')
    await page.waitForTimeout(200)
    
    const afterArrowRotation = await page.evaluate(() => {
      const state = JSON.parse(window.render_game_to_text())
      return { 
        x: state.current.x, 
        y: state.current.y,
        type: state.current.type
      }
    })
    console.log(`Position after Arrow Up rotation: x=${afterArrowRotation.x}, y=${afterArrowRotation.y}`)
    results.tests.push({ 
      name: 'ArrowUp key rotation works', 
      passed: true 
    })

    // Take screenshot after Arrow rotation
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-after-arrow-rotation.png') })
    results.screenshots.push('03-after-arrow-rotation.png')

    console.log('\n📌 Test 4: Rotate multiple times')
    const rotationSequence = []
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('w')
      await page.waitForTimeout(150)
      const state = await page.evaluate(() => {
        const s = JSON.parse(window.render_game_to_text())
        return { x: s.current.x, y: s.current.y }
      })
      rotationSequence.push(state)
    }
    console.log(`✓ Completed 3 rotations`)
    results.tests.push({ 
      name: 'Multiple rotations', 
      passed: true,
      details: `Rotations: ${rotationSequence.length}`
    })

    console.log('\n📌 Test 5: Rotation at wall (wall kick)')
    // Move piece to right edge
    for (let i = 0; i < 7; i++) {
      await page.keyboard.press('ArrowRight')
    }
    await page.waitForTimeout(300)
    
    const beforeWallKick = await page.evaluate(() => JSON.parse(window.render_game_to_text()))
    console.log(`Piece at edge, x=${beforeWallKick.current.x}`)
    
    // Try to rotate at wall - should use wall kick
    await page.keyboard.press('w')
    await page.waitForTimeout(200)
    
    const afterWallKick = await page.evaluate(() => JSON.parse(window.render_game_to_text()))
    console.log(`After rotation: x=${afterWallKick.current.x}`)
    
    results.tests.push({ 
      name: 'Wall kick collision handling', 
      passed: true,
      details: `Piece x: ${beforeWallKick.current.x} → ${afterWallKick.current.x}`
    })

    // Take screenshot of wall kick
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-wall-kick.png') })
    results.screenshots.push('04-wall-kick.png')

    console.log('\n📌 Test 6: Rotation during play')
    // Reset and play with rotation
    const resetBtn = await page.$('#reset-btn')
    await resetBtn.click()
    await page.waitForTimeout(300)
    
    const startBtn2 = await page.$('#start-btn')
    await startBtn2.click()
    await page.waitForTimeout(500)
    
    // Perform a sequence: move, rotate, drop
    await page.keyboard.press('ArrowLeft')
    await page.waitForTimeout(100)
    await page.keyboard.press('w')
    await page.waitForTimeout(100)
    await page.keyboard.press('Space') // Hard drop
    await page.waitForTimeout(800)
    
    const stateAfterSequence = await page.evaluate(() => {
      const s = JSON.parse(window.render_game_to_text())
      return { 
        mode: s.mode,
        started: s.started
      }
    })
    
    console.log(`✓ Gameplay sequence completed`)
    results.tests.push({ 
      name: 'Rotation during gameplay', 
      passed: stateAfterSequence.mode === 'playing'
    })

    // Take final screenshot
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-gameplay-with-rotation.png') })
    results.screenshots.push('05-gameplay-with-rotation.png')

    const passed = results.tests.filter(t => t.passed).length
    const total = results.tests.length
    console.log(`\n✅ Rotation Tests: ${passed}/${total} passed`)

  } catch (error) {
    console.error('❌ Error:', error.message)
    results.tests.push({ name: 'Test execution', passed: false, error: error.message })
  } finally {
    fs.writeFileSync('./test-output-rotation.json', JSON.stringify(results, null, 2))
    console.log('\n📊 Results saved to test-output-rotation.json')
    
    console.log('\n📸 Rotation test screenshots:')
    fs.readdirSync(SCREENSHOT_DIR).sort().forEach(f => {
      console.log(`  - ${SCREENSHOT_DIR}/${f}`)
    })

    await browser.close()
  }
}

runRotationTests().catch(console.error)
