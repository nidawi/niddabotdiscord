// Allow users to close flash notifications.
const contentHost = document.querySelector('.content')
const flashMsg = document.querySelector('.flashmsg')

if (flashMsg) {
  flashMsg.addEventListener('mousedown', event => {
    event.stopPropagation()
    contentHost.removeChild(flashMsg)
  })
}

// Disable button after it has been clicked.
const submitBtns = [ ...document.querySelectorAll('input[type=\'submit\']'), ...document.querySelectorAll('button[type=\'submit\']') ]
if (submitBtns.length > 0) {
  Array.prototype.forEach.call(submitBtns, a => {
    a.addEventListener('click', event => {
      if (event.target.hasClicked) event.preventDefault()
      event.target.hasClicked = true
    })
  })
}
