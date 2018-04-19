// Allow users to close flash notifications.
const contentHost = document.querySelector('.content')
const flashMsgs = document.querySelectorAll('.flashmsg')

flashMsgs.forEach(msg => {
  msg.querySelector('button').addEventListener('mousedown', event => {
    contentHost.removeChild(msg)
  })
})
