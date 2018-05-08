// Allow users to close flash notifications.
const contentHost = document.querySelector('.content')
const flashMsgs = document.querySelectorAll('.flashmsg')

flashMsgs.forEach(msg => {
  msg.querySelector('button').addEventListener('mousedown', event => {
    contentHost.removeChild(msg)
  })
})

// Disable items after they have been clicked. Objects that are either Input type="submit" and those that have the class "disableOnClick".
// This prevents inadvertent double-clicks.
const itemsToDisable = [...document.querySelectorAll('input[type=submit]'), ...document.querySelectorAll('.disableOnClick')]
itemsToDisable.forEach(a => {
  a.addEventListener('click', event => setTimeout(() => a.setAttribute('disabled', ''), 0))
})

// Enables submit buttons once data has been added to input boxes of type "checkbox", "text", and "password", unless it has the class "ignoreInput".
const inputItems = Array.prototype.filter.call([
  ...document.querySelectorAll('input[type=text]'),
  ...document.querySelectorAll('input[type=password]'),
  ...document.querySelectorAll('input[type=checkbox]'),
  ...document.querySelectorAll('select')
], a => { return (!a.classList.contains('ignoreInput')) })
const submitItems = Array.prototype.filter.call(document.querySelectorAll('input[type=submit]'), a => { return (!a.classList.contains('ignoreInput')) })
inputItems.forEach(a => {
  a.addEventListener('input', event => setTimeout(() => submitItems.forEach(b => b.removeAttribute('disabled')), 0))
})
