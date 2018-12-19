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

/* client.on('navdata', data => {
  console.log(data.demo.batteryPercentage)
}) */

let state = {
  flying: false
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
      } else if (msg.command === 'front') {
        client.front(0.2)
      } else if (msg.command === 'back') {
        client.back(0.2)
      } else if (msg.command === 'left') {
        client.left(0.2)
      } else if (msg.command === 'right') {
        client.right(0.2)
      } else if (msg.command === 'counter-clockwise') {
        client.counterClockwise(1)
      } else if (msg.command === 'clockwise') {
        client.clockwise(1)
      } else if (msg.command === 'blink') {
        client.animateLeds('blinkRed', 5, 1)
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
})

console.log(`ufo streamin' at http://localhost:${ port }`)