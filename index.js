const path = require('path')
const express = require('express')
const WebSocket = require('ws')
const drone = require('ar-drone')
const cv = require('opencv')

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
  state.altitude = data.demo.altitudeMeters
})

let state = {
  detect: true,
  flying: false,
  status: null,
  battery: 666,
  rotation: null,
  altitude: 666,
  values: {
    speed: 0.2
  }
}

wss.on('connection', ws => {
  ws.on('message', data => {
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
        client.up(state.values.speed)
      } else if (msg.command === 'down') {
        client.down(state.values.speed)
      } else if (msg.command === 'front') {
        client.front(state.values.speed)
      } else if (msg.command === 'back') {
        client.back(state.values.speed)
      } else if (msg.command === 'left') {
        client.left(state.values.speed)
      } else if (msg.command === 'right') {
        client.right(state.values.speed)
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
    } else if (msg.type === 'value') {
        if (msg.value === 'speed') {
          state.values.speed = msg.data
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

    if (state.detect) {
      cv.readImage(buffer, (err, image) => {
        if (err) console.log(err)

        image.detectObject(cv.FACE_CASCADE, {}, (err, faces) => {
          if (err) console.log(err)
          if (faces.length === 0) return

          const face = faces.reduce((a, b) => b.width > a.width ? b : a)
          const play = 50

          /* Centered face x: 270, y: 100, width: 100, height: 100 */

          console.log(face)
          if (face.width > 100 + play) client.back(state.values.speed)
          if (face.width < 100 - play) client.front(state.values.speed)
          if (face.x > 270 + play) client.clockwise(1)
          if (face.x < 270 - play) client.counterClockwise(1)
          if (face.y > 100 + play) client.down(state.values.speed)
          if (face.y < 100 - play) client.up(state.values.speed)
        })
      })
    }
  })

  setInterval(() => {
    const msg = {
      type: 'state',
      state: state
    }

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg))
    }
  }, 500)
})

console.log(`ufo streamin' at http://localhost:${ port }`)