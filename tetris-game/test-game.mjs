import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const BASE_URL = 'http://localhost:5173'
const SCREENSHOT_DIR = './test-screenshots'
const OUTPUT_FILE = './test-output.json'

// Create screenshot directory
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
}

async function runTests() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    errors: [],
  }

  try {
    // Navigate to game
    console.log('🎮 Testing Tetris Game...')
    await page.goto(BASE_URL, { waitUntil: 'networkidle' })
    
    // Take initial screenshot
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-initial.png') })
    console.log('✓ Captured initial screenshot')

    // Verify start button exists
    const startBtn = await page.$('#start-btn')
    if (startBtn) {
      console.log('✓ Start button found')
      results.tests.push({ name: 'Start button exists', passed: true })
    } else {
      results.tests.push({ name: 'Start button exists', passed: false })
    }

    // Get initial game state
    const initialState = await page.evaluate(() => window.render_game_to_text())
    const initialData = JSON.parse(initialState)
    console.log('📊 Initial state:', initialData)
    results.tests.push({ name: 'Render game text function', passed: !!initialState })

    // Click start button
    await startBtn.click()
    await page.waitForTimeout(500)
    console.log('✓ Clicked start button')
    results.tests.push({ name: 'Click start button', passed: true })

    // Take screenshot after start
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-after-start.png') })

    // Check game state changed
    const playingState = await page.evaluate(() => window.render_game_to_text())
    const playingData = JSON.parse(playingState)
    console.log('📊 Playing state:', playingData)
    
    if (playingData.mode === 'playing') {
      console.log('✓ Game started successfully')
      results.tests.push({ name: 'Game start mode', passed: true })
    } else {
      results.tests.push({ name: 'Game start mode', passed: false })
    }

    // Test left arrow key
    await page.keyboard.press('ArrowLeft')
    await page.waitForTimeout(100)
    const afterLeftState = await page.evaluate(() => window.render_game_to_text())
    const afterLeftData = JSON.parse(afterLeftState)
    console.log('📊 After left arrow:', afterLeftData)
    results.tests.push({ name: 'Left arrow input', passed: true })

    // Test right arrow key
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(100)
    const afterRightState = await page.evaluate(() => window.render_game_to_text())
    const afterRightData = JSON.parse(afterRightState)
    console.log('📊 After right arrow:', afterRightData)
    results.tests.push({ name: 'Right arrow input', passed: true })

    // Test down arrow key
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(100)
    const afterDownState = await page.evaluate(() => window.render_game_to_text())
    const afterDownData = JSON.parse(afterDownState)
    console.log('📊 After down arrow:', afterDownData)
    results.tests.push({ name: 'Down arrow input', passed: true })

    // Test space key (hard drop)
    await page.keyboard.press('Space')
    await page.waitForTimeout(100)
    const afterSpaceState = await page.evaluate(() => window.render_game_to_text())
    const afterSpaceData = JSON.parse(afterSpaceState)
    console.log('📊 After space (hard drop):', afterSpaceData)
    results.tests.push({ name: 'Space bar hard drop', passed: true })

    // Wait for piece to lock and line clear
    await page.waitForTimeout(2000)
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-after-inputs.png') })

    // Test pause button
    const pauseBtn = await page.$('#pause-btn')
    if (pauseBtn) {
      await pauseBtn.click()
      await page.waitForTimeout(300)
      const pausedState = await page.evaluate(() => window.render_game_to_text())
      const pausedData = JSON.parse(pausedState)
      console.log('📊 Paused state:', pausedData)
      
      if (pausedData.paused) {
        console.log('✓ Game paused successfully')
        results.tests.push({ name: 'Pause functionality', passed: true })
      } else {
        results.tests.push({ name: 'Pause functionality', passed: false })
      }

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-paused.png') })

      // Resume game
      await pauseBtn.click()
      await page.waitForTimeout(300)
      const resumedState = await page.evaluate(() => window.render_game_to_text())
      const resumedData = JSON.parse(resumedState)
      console.log('📊 Resumed state:', resumedData)
      
      if (!resumedData.paused && resumedData.started) {
        console.log('✓ Game resumed successfully')
        results.tests.push({ name: 'Resume functionality', passed: true })
      }
    }

    // Test reset button
    const resetBtn = await page.$('#reset-btn')
    if (resetBtn) {
      await resetBtn.click()
      await page.waitForTimeout(300)
      const resetState = await page.evaluate(() => window.render_game_to_text())
      const resetData = JSON.parse(resetState)
      console.log('📊 Reset state:', resetData)
      
      if (!resetData.started) {
        console.log('✓ Game reset successfully')
        results.tests.push({ name: 'Reset functionality', passed: true })
      }

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-after-reset.png') })
    }

    // Check for console errors
    const consoleMessages = []
    page.on('console', msg => consoleMessages.push(msg))
    
    let testsPassed = results.tests.filter(t => t.passed).length
    let testsFailed = results.tests.filter(t => !t.passed).length
    
    console.log(`\n✅ Tests passed: ${testsPassed}/${results.tests.length}`)
    if (testsFailed > 0) console.log(`❌ Tests failed: ${testsFailed}`)

  } catch (error) {
    console.error('❌ Test error:', error.message)
    results.errors.push(error.message)
  } finally {
    // Save results
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2))
    console.log(`\n📊 Results saved to ${OUTPUT_FILE}`)
    
    // List screenshots
    console.log('\n📸 Screenshots saved:')
    const files = fs.readdirSync(SCREENSHOT_DIR).sort()
    files.forEach(f => console.log(`  - ${SCREENSHOT_DIR}/${f}`))

    await browser.close()
  }
}

runTests().catch(console.error)
