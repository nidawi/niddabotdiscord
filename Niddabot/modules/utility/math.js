// A simplistic math module. Designed in a rather controversial way. We'll see how this turns out.
// Generally you don't want to use eval because it's scary and slow, but in this scenario I figured that it would be faster
// and easier to use eval than to write 10,000 lines of parsing. So in a way this is a test.
// Naturally, we need to verify the inpput and make sure that it's actually harmless math that is being passed,
// and not some nasty script that ruins our lives.
// It seems to work fine. Will keep monitoring.

const Router = require('../../components/Router')
const helpers = require('../../util/helpers')
const router = new Router()

const mathRegexp = /(\d)|[)(.,/%*^+ -]/ // Only accept these characters as valid math input. Basically, we reject all letters.
const doMath = text => {
  text = text.trim() // Trim
  text = text.replace('^', '**') // replace aliases
  if (!text || typeof text !== 'string') throw new Error('input was of an invalid format.')
  if (!text.split('').every(a => mathRegexp.test(a))) throw new Error('input had faulty syntax. Please try again.')
  try {
    // We use eval for this. Danger, danger.
    const result = eval(text) // eslint-disable-line no-eval
    return !isNaN(result) ? result : undefined
  } catch (err) {
    throw new Error('input had faulty syntax. Please try again.')
  }
}
const doTest = (val1, expected) => {
  const result = helpers.errorDevourer(() => doMath(val1))
  return `Expecting "${val1}" to equal ${expected}. Result: ${result || 'error'}. Success: ${expected === result}.`
}

router.use('test', (route, msg, next) => {
  // Math test route.
  msg.channel.send(`Tests initiated.`)
  const tests = [
    doTest('1+1', 2), // plus
    doTest('82-42', 40), // minus
    doTest('30 / 3', 10), // divided
    doTest('5*5', 25), // Times
    doTest('3**3', 27), // power of 1
    doTest('3^3', 27), // power of 2
    doTest('hello I am a duck', undefined), // text
    doTest('5 / 0', Infinity), // division with zero
    doTest('95&23', undefined), // faulty input
    doTest('3.2 + 7.1', 10.3), // decimals
    doTest('4 - 12', -8) // negative result
  ]
  tests.forEach(async a => {
    msg.channel.send(a)
    await helpers.wait()
  })
  msg.channel.send(`Tests completed.`)
})

router.use('*', (route, msg, next) => {
  // Math main route.
  if (route.hasArgument('help')) {
    // Provide general help.
    return msg.reply(`\n${route.insertBlock(`Standard operations: +, -, /, *\nPower of: ** or ^`)}`)
  }

  const result = doMath(route.getText())
  if (typeof result === 'number') msg.channel.send(route.insertBlock(result))
  else msg.reply('the result is not a valid number.')
})

module.exports = router
