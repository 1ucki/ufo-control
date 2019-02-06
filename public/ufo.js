const image = document.querySelector('#stream')
const battery = document.querySelector('#battery')
const altitude = document.querySelector('#altitude')
const slider = document.querySelector('#speed')

const socket = new WebSocket('ws://localhost:3001')

function interface (state) {
  battery.innerText = state.battery
  altitude.innerText = state.altitude
}

function stream (buffer) {
  const int8Array = new Uint8Array(buffer.data)
  const blob = new Blob([int8Array], { type: 'image/png' })
  const url = URL.createObjectURL(blob)

  image.src = url

  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 500)
}

function sendCommand (command) {
  const msg = {
    type: 'command',
    command: command
  }

  socket.send(JSON.stringify(msg))
}

function sendValue (value) {
  const msg = {
    type: 'value',
    value: 'speed',
    data: value
  }

  socket.send(JSON.stringify(msg))
}

socket.addEventListener('message', event => {
  const msg = JSON.parse(event.data)

  if (msg.type === 'buffer') {
    stream(msg.buffer)
  } else if (msg.type === 'state') {
    interface(msg.state)
  }
})

slider.oninput = (event) => {
  sendValue(event.srcElement.value * 2 / 10)
}

document.onkeydown = (event) => {
  if (event.keyCode === 32) {
    sendCommand('takeoff-land')
  } else if (event.keyCode === 38) {
    sendCommand('up')
  } else if (event.keyCode === 40) {
    sendCommand('down')
  } else if (event.keyCode === 87) {
    sendCommand('front')
  } else if (event.keyCode === 83) {
    sendCommand('back')
  } else if (event.keyCode === 65) {
    sendCommand('left')
  } else if (event.keyCode === 68) {
    sendCommand('right')
  } else if (event.keyCode === 81) {
    sendCommand('counter-clockwise')
  } else if (event.keyCode === 69) {
    sendCommand('clockwise')
  } else if (event.keyCode === 67) {
    sendCommand('calibrate')
  } else if (event.keyCode === 27) {
    sendCommand('disable-emergency')
  }
}

document.onkeyup = (event) => {
  if (event.keyCode === 38 ||
      event.keyCode === 40 ||
      event.keyCode === 87 ||
      event.keyCode === 83 ||
      event.keyCode === 65 ||
      event.keyCode === 68 ||
      event.keyCode === 81 ||
      event.keyCode === 69) {
    sendCommand('stop')
  }
}