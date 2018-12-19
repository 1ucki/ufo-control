const image = document.querySelector('#stream')

const socket = new WebSocket('ws://localhost:3001')

function stream(buffer) {
  const int8Array = new Uint8Array(buffer.data)
  const blob = new Blob([int8Array], { type: 'image/png' })
  const url = URL.createObjectURL(blob)

  image.src = url

  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 500)
}

function sendCommand(command) {
  const msg = {
    type: 'command',
    command: command
  }

  socket.send(JSON.stringify(msg))
}

socket.addEventListener('message', event => {
  const msg = JSON.parse(event.data)

  if (msg.type === 'buffer') {
    stream(msg.buffer)
  }
})

document.onkeydown = (event) => {
  if (event.keyCode === 32) {
    sendCommand('takeoff-land')
  } else if (event.keyCode === 87) {
    sendCommand('front')
  } else if (event.keyCode === 83) {
    sendCommand('stop')
  } else if (event.keyCode === 65) {
    sendCommand('left')
  } else if (event.keyCode === 68) {
    sendCommand('right')
  } else if (event.keyCode === 81) {
    sendCommand('counter-clockwise')
  } else if (event.keyCode === 69) {
    sendCommand('clockwise')
  }
}