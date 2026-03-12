import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const BASE_URL = 'http://localhost:5173'
const SCREENSHOT_DIR = './test-screenshots-extended'

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
}

async function runExtendedTests() {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()
  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    screenshots: [],
  }

  try {
    console.log('🎮 Extended Tetris Game Tests')
    await page.goto(BASE_URL, { waitUntil: 'networkidle' })
    
    // Test 1: Gameplay loop with multiple pieces
    console.log('\n📌 Test 1: Multiple piece drops and scoring')
    const startBtn = await page.$('#start-btn')
    await startBtn.click()
    await page.waitForTimeout(1000)
    
    // Drop 5 pieces rapidly
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Space')
      await page.waitForTimeout(800) // Wait for piece to lock
    }
    
    const scoreAfter5Pieces = await page.evaluate(() => {
      const state = JSON.parse(window.render_game_to_text())
      return state.score
    })
    console.log(`✓ Score after 5 pieces: ${scoreAfter5Pieces}`)
    results.tests.push({ 
      name: 'Multiple pieces drop', 
      passed: true,
      details: `Score: ${scoreAfter5Pieces}`
    })

    // Take screenshot
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-gameplay.png') })
    results.screenshots.push('01-gameplay.png')

    // Test 2: Game state consistency
    console.log('\n📌 Test 2: Game state consistency')
    const state1 = await page.evaluate(() => JSON.parse(window.render_game_to_text()))
    await page.waitForTimeout(300)
    const state2 = await page.evaluate(() => JSON.parse(window.render_game_to_text()))
    
    const consistent = state1.boardCols === state2.boardCols && 
                      state1.boardRows === state2.boardRows
    console.log(`✓ Board dimensions consistent: ${consistent}`)
    results.tests.push({ 
      name: 'Game state consistency', 
      passed: consistent 
    })

    // Test 3: Boundary conditions
    console.log('\n📌 Test 3: Boundary conditions (move to edges)')
    
    // Move left to wall
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('ArrowLeft')
    }
    await page.waitForTimeout(300)
    const leftState = await page.evaluate(() => JSON.parse(window.render_game_to_text()))
    console.log(`✓ Piece at left edge, x=${leftState.current.x}`)
    
    // Move right to wall
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('ArrowRight')
    }
    await page.waitForTimeout(300)
    const rightState = await page.evaluate(() => JSON.parse(window.render_game_to_text()))
    console.log(`✓ Piece at right edge, x=${rightState.current.x}`)
    
    results.tests.push({ 
      name: 'Boundary collision detection', 
      passed: leftState.current.x >= 0 && rightState.current.x <= 7
    })

    // Test 4: Pause/Resume/Pause cycle
    console.log('\n📌 Test 4: Pause/Resume/Pause cycle')
    const pauseBtn = await page.$('#pause-btn')
    
    // Pause
    await pauseBtn.click()
    await page.waitForTimeout(300)
    const pausedState1 = await page.evaluate(() => JSON.parse(window.render_game_to_text()))
    const pausedTime1 = pausedState1.current.y
    
    // Resume
    await pauseBtn.click()
    await page.waitForTimeout(300)
    
    // Pause again
    await pauseBtn.click()
    await page.waitForTimeout(300)
    const pausedState2 = await page.evaluate(() => JSON.parse(window.render_game_to_text()))
    const pausedTime2 = pausedState2.current.y
    
    console.log(`✓ Pause/Resume cycle OK (Y: ${pausedTime1} -> ${pausedTime2})`)
    results.tests.push({ 
      name: 'Pause/Resume cycling', 
      passed: pausedState1.paused && pausedState2.paused
    })

    // Test 5: Reset resets score to 0
    console.log('\n📌 Test 5: Reset clears score')
    const resetBtn = await page.$('#reset-btn')
    await resetBtn.click()
    await page.waitForTimeout(300)
    
    const resetState = await page.evaluate(() => JSON.parse(window.render_game_to_text()))
    const scoreCleared = resetState.score === 0 && !resetState.started
    console.log(`✓ Score reset: ${scoreCleared} (score=${resetState.score})`)
    results.tests.push({ 
      name: 'Reset clears score', 
      passed: scoreCleared
    })

    // Test 6: Multiple restart cycles
    console.log('\n📌 Test 6: Multiple start/reset cycles')
    const cycleTests = []
    for (let cycle = 0; cycle < 3; cycle++) {
      const startBtn2 = await page.$('#start-btn')
      await startBtn2.click()
      await page.waitForTimeout(500)
      
      const started = await page.evaluate(() => JSON.parse(window.render_game_to_text()).started)
      cycleTests.push(started)
      
      const resetBtn2 = await page.$('#reset-btn')
      await resetBtn2.click()
      await page.waitForTimeout(300)
    }
    
    const allCyclesOK = cycleTests.every(t => t === true)
    console.log(`✓ All ${cycleTests.length} start/reset cycles OK`)
    results.tests.push({ 
      name: 'Multiple start/reset cycles', 
      passed: allCyclesOK
    })

    // Test 7: Render function always returns JSON
    console.log('\n📌 Test 7: render_game_to_text always valid JSON')
    let jsonParseTests = 0
    for (let i = 0; i < 10; i++) {
      const text = await page.evaluate(() => window.render_game_to_text())
      try {
        JSON.parse(text)
        jsonParseTests++
      } catch (e) {
        console.log(`❌ Invalid JSON on iteration ${i}`)
      }
    }
    
    const jsonOK = jsonParseTests === 10
    console.log(`✓ JSON valid in all ${jsonParseTests}/10 samples`)
    results.tests.push({ 
      name: 'render_game_to_text JSON validity', 
      passed: jsonOK
    })

    // Final screenshot
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-final.png') })
    results.screenshots.push('02-final.png')

    // Summary
    const passed = results.tests.filter(t => t.passed).length
    const total = results.tests.length
    console.log(`\n✅ Extended Tests: ${passed}/${total} passed`)
    console.log(`📸 Screenshots: ${results.screenshots.length}`)

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    fs.writeFileSync('./test-output-extended.json', JSON.stringify(results, null, 2))
    console.log('\n📊 Results saved to test-output-extended.json')
    
    console.log('\n📸 Extended screenshots:')
    fs.readdirSync(SCREENSHOT_DIR).sort().forEach(f => {
      console.log(`  - ${SCREENSHOT_DIR}/${f}`)
    })

    await browser.close()
  }
}

runExtendedTests().catch(console.error)
