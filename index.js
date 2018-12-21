const path = require('path')
const express = require('express')
const WebSocket = require('ws')
const drone = require('ar-drone')

const wss = new WebSocket.Server({ port: 3001 })

const app = express()
const port = 3000

app.use(express.static(path.join(__dirname, 'public')))
app.listen(port)

const client = drone.createClient({ frameRate: 2 })
const stream = client.getPngStream()

client.on('navdata', data => {
  if (!data.demo) return

  state.status = data.demo.flyState
  state.battery = data.demo.batteryPercentage
  state.rotation = data.demo.rotation
  state.altitude = data.demo.altitude
})

let state = {
  flying: false,
  status: null,
  battery: null,
  rotation: null,
  altitude: null,
  constants: {
    speed: 0.2
  }
}

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(data) {
    const msg = JSON.parse(data)
    console.log(msg)

    if (msg.type === 'command') {
      if (msg.command === 'takeoff-land') {
        if (state.flying) {
          client.land()
          state.flying = false
        } else {
          client.takeoff()
          state.flying = true
        }
      } else if (msg.command === 'stop') {
        client.stop()
      } else if (msg.command === 'up') {
        client.up(state.constants.speed)
      } else if (msg.command === 'down') {
        client.down(state.constants.speed)
      } else if (msg.command === 'front') {
        client.front(state.constants.speed)
      } else if (msg.command === 'back') {
        client.back(state.constants.speed)
      } else if (msg.command === 'left') {
        client.left(state.constants.speed)
      } else if (msg.command === 'right') {
        client.right(state.constants.speed)
      } else if (msg.command === 'counter-clockwise') {
        client.counterClockwise(1)
      } else if (msg.command === 'clockwise') {
        client.clockwise(1)
      } else if (msg.command === 'blink') {
        client.animateLeds('blinkRed', 5, 1)
      } else if (msg.command === 'disable-emergency') {
        client.disableEmergency()
      } else if (msg.command === 'calibrate') {
        client.calibrate(0)
      }
    }
  })
  
  stream.on('data', buffer => {
    const msg = {
      type: 'buffer',
      buffer: buffer
    }

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg))
    }
  })

  setInterval(() => {
    const msg = {
      type: 'state',
      state: state
    }

    console.log(state)

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg))
    }
  }, 500)
})

console.log(`ufo streamin' at http://localhost:${ port }`)