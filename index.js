const express = require('express');
const app = express();
const server = require('http').createServer(app)
const path = require('path');
const WebSocket = require('ws')
const { v4: uuidv4 } = require('uuid')

const wss = new WebSocket.Server({ server: server })

const botAutoFishing = require('./botAutoFishing');
const { request } = require('http');


function handl_update(type, name, value) {
    var wss_id = data.bots_ws_follow[name]
    wss.clients.forEach(e => {
        if (wss_id.includes(e.id)) {
            e.send(JSON.stringify({ type: type, 'data': value }))
        }
    })
}

function from_ws_2_bot(id) {
    let bot_res;
    Object.keys(data.bots_ws_follow).forEach(e => {
        var element = data.bots_ws_follow[e].find(j => j == id)
        if (element) {
            bot_res = data.bots[e]
        }
    })
    return bot_res
}

var data = {
    bots: {},
    bots_ws_follow: {},
    ws_id: {},
    cancel: (arg, ws) => {
        var bot = from_ws_2_bot(ws.id)
        // console.log(bot)
        if (bot) {
            bot.commands.bot_cancel()
        }
    },
    autofish: (arg, ws) => {
        var bot = from_ws_2_bot(ws.id)
        console.log(bot)
        if (bot) {
            bot.commands.bot_autofish()
        }
    },
    goto: (arg, ws) => {
        var bot = from_ws_2_bot(ws.id)
        if (bot) {
            bot.commands.bot_goto(null, arg)
        }
    },
    createBot: (arg, ws) => {
        if (data.bots[arg[0]]) return true
        var bot = new botAutoFishing(arg[0], arg[1], arg[2], data.get_fun)
        bot.Update = handl_update
        data.bots[arg[0]] = bot
        data.bots_ws_follow[arg[0]] = []
        if (!data.bots_ws_follow[arg[0]].includes(ws.id)) {
            data.bots_ws_follow[arg[0]].push(ws.id)
        }
        return true
    },
    getInforBot: (bot_name, ws) => {
        bots = data.bots_ws_follow[bot_name]
        console.log(bots)
        Object.keys(data.bots_ws_follow).forEach(e => {
            var element = data.bots_ws_follow[e].find(j => j == ws.id)
            if (element) {
                const index = data.bots_ws_follow[e].indexOf(ws.id);
                data.bots_ws_follow[e].splice(index, 1)
            }
        })
        if (!bots.includes(ws.id)) {
            bots.push(ws.id)
        }
        var bot = data.bots[bot_name[0]]
        var pos = bot.bot.entity.position
        if (bot && bot.isrun) {
            var res = {
                inventory: bot.bot.inventory.items(),
                hp: bot.bot.health,
                food: bot.bot.food,
                isrun: bot.isrun,
                xp: [bot.bot.experience.level, bot.bot.experience.progress],
                position: [pos.x, pos.y, pos.z]

            }
            return res
        }
    },
    stop: (arg, ws) => {
        var bot = from_ws_2_bot(ws.id)
        // console.log(bot)
        if (bot) {
            var name = bot.user
            bot.commands.bot_stop()
            delete data.bots[name]
            delete data.bots_ws_follow[name]
        }
    },
    highwaybuding: (arg, ws) => {
        var bot = from_ws_2_bot(ws.id)
        if (bot) {
            bot.commands.bot_highwaybuding(null, arg)
        }
    },
    afk: (arg, ws) => {
        var bot = from_ws_2_bot(ws.id)
        if (bot) {
            bot.commands.bot_afk(null, arg)
        }
    }
}
wss.on('connection', function connection(ws) {
    ws.id = uuidv4()
    ws.on('message', (mess) => {
        var me = JSON.parse(String(mess))
        // console.log(me)
        var res;
        if (me.type == 'object') {
            me.path.forEach(element => {
                res = data[element]
            });
            ws.send(JSON.stringify({ id: me.id, data: Object.keys(res, ws) }))
        }
        else if (me.type == 'function') {
            me.path.forEach(element => {
                res = data[element]
            });

            ws.send(JSON.stringify({ id: me.id, data: res(me.arg, ws) }))
        }
        else if (me.type == 'command') {
            if (me.path == 'autofish') {

            }
        }
        else if (me.type == 'unfollow') {
            Object.keys(data.bots_ws_follow).forEach(e => {
                var element = data.bots_ws_follow[e].find(j => j == ws.id)
                if (element) {
                    const index = data.bots_ws_follow[e].indexOf(ws.id);
                    data.bots_ws_follow[e].splice(index, 1)
                }
            })
        }
    })

    ws.on('close', () => {
        Object.keys(data.bots_ws_follow).forEach(e => {
            var element = data.bots_ws_follow[e].find(j => j == ws.id)
            if (element) {
                const index = data.bots_ws_follow[e].indexOf(ws.id);
                data.bots_ws_follow[e].splice(index, 1)
            }
        })
    })
})
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="en"><head> <meta charset="UTF-8"> <meta name="viewport" content="width=device-width, initial-scale=1.0"> <title>Document</title></head><body> <script> window.location = window.location.href + 'bot_contro' </script></body></html>`)
})
app.get('/img/:fileName', (req, res) => {
    var fileName = req.params.fileName
    res.sendFile(`/src/img/${fileName}`, {
        root: path.join(__dirname)
    })
})
app.get('/status', (req, res) => {
    console.log('status')
    res.send('ok')
})
app.get('/main.js', (req, res) => {
    res.sendFile('/src/main.js', {
        root: path.join(__dirname)
    })
})
app.get('/style.css', (req, res) => {
    res.sendFile('/src/style.css', {
        root: path.join(__dirname)
    })
})
app.get('/bot_contro', (req, res) => {
    res.sendFile('/src/index.html', {
        root: path.join(__dirname)
    })
})
server.listen(4000, () => {
    console.log('http://127.0.0.1:' + 4000)
    console.log('ok')
})