const express = require('express');
const http = require('http')
const path = require('path');
const WebSocket = require('ws')
const { v4: uuidv4 } = require('uuid')
var request = require('request').defaults({ encoding: null });


const botAutoFishing = require('./botAutoFishing');


const app = express();
const server = http.createServer(app)
const wss = new WebSocket.Server({ server: server })

var handl_command = {
    bots: {},
    bots_ws_follow: {},
    ws_id: {},
    cancel: (arg, ws) => {
        var bot = ws_2_bot(ws.id)
        // console.log(bot)
        if (bot) {
            bot.commands.bot_cancel()
        }
    },
    autofish: (arg, ws) => {
        var bot = ws_2_bot(ws.id)
        console.log(bot)
        if (bot) {
            bot.commands.bot_autofish()
        }
    },
    goto: (arg, ws) => {
        var bot = ws_2_bot(ws.id)
        if (bot) {
            bot.commands.bot_goto(null, arg)
        }
    },
    createBot: (arg, ws) => {
        if (handl_command.bots[arg[0]]) return true
        var bot = new botAutoFishing(arg[0], arg[1], arg[2], handl_command.get_fun)
        bot.Update = handl_update
        handl_command.bots[arg[0]] = bot
        handl_command.bots_ws_follow[arg[0]] = []
        if (!handl_command.bots_ws_follow[arg[0]].includes(ws.id)) {
            handl_command.bots_ws_follow[arg[0]].push(ws.id)
        }
        return true
    },
    getInforBot: (bot_name, ws) => {
        bots = handl_command.bots_ws_follow[bot_name]
        console.log(bots)
        Object.keys(handl_command.bots_ws_follow).forEach(e => {
            var element = handl_command.bots_ws_follow[e].find(j => j == ws.id)
            if (element) {
                const index = handl_command.bots_ws_follow[e].indexOf(ws.id);
                handl_command.bots_ws_follow[e].splice(index, 1)
            }
        })
        if (!bots.includes(ws.id)) {
            bots.push(ws.id)
        }
        var bot = handl_command.bots[bot_name[0]]
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
        var bot = ws_2_bot(ws.id)
        // console.log(bot)
        if (bot) {
            var name = bot.user
            bot.commands.bot_stop()
            delete handl_command.bots[name]
            delete handl_command.bots_ws_follow[name]
        }
    },
    highwaybuding: (arg, ws) => {
        var bot = ws_2_bot(ws.id)
        if (bot) {
            bot.commands.bot_highwaybuding(null, arg)
        }
    },
    afk: (arg, ws) => {
        var bot = ws_2_bot(ws.id)
        if (bot) {
            bot.commands.bot_afk(null, arg)
        }
    }
}

function handl_update(type, name, data) {
    var wss_id = handl_command.bots_ws_follow[name]
    wss.clients.forEach(ws => {
        if (wss_id.includes(ws.id)) {
            ws.send(JSON.stringify({ type: type, 'data': data}))
        }
    })
}
function ws_2_bot(id) {
    let bot_res;
    Object.keys(handl_command.bots_ws_follow).forEach(e => {
        var element = handl_command.bots_ws_follow[e].find(j => j == id)
        if (element) {
            bot_res = handl_command.bots[e]
        }
    })
    return bot_res
}

wss.on('connection', function connection(ws) {
    ws.id = uuidv4()
    ws.on('message', (mess) => {
        var mess = JSON.parse(String(mess))
        const id = mess.id
        console.log("🚀 ~ file: index.js:125 ~ ws.on ~ mess:", mess)

        switch (mess.type) {
            case 'STAR_BOT':
                const { botName, iP, Port } = mess.data
                if (handl_command.bots[botName]) return
                var bot = new botAutoFishing(botName, iP, Port)
                bot.Update = handl_update
                handl_command.bots[botName] = bot
                handl_command.bots_ws_follow[botName] = [ws.id]
                break;
            case 'FOLLOW':
                const { bot_name } = mess.data;
                if (!handl_command.bots_ws_follow[bot_name].includes(ws.id)) {
                    handl_command.bots_ws_follow[bot_name].push(ws.id)
                }
                handl_command.bots[bot_name].wsSendDEBUG()
                break;
            case 'UNFOLLOW':
                Object.keys(handl_command.bots_ws_follow).forEach(e => {
                    var element = handl_command.bots_ws_follow[e].find(j => j == ws.id)
                    if (element) {
                        const index = handl_command.bots_ws_follow[e].indexOf(ws.id);
                        handl_command.bots_ws_follow[e].splice(index, 1)
                    }
                })
                break;
            case 'STOP_BOT':
                var bot = ws_2_bot(ws.id)
                bot.commands.bot_stop()
                bot.wsSend('EVENT', JSON.stringify({
                    type: 'bot_run',
                    data: false
                }))
                break;
            case 'STAR_COMMAND':
                const { command } = mess.data
                console.log("🚀 ~ file: index.js:161 ~ ws.on ~ command:", command)
                var bot = ws_2_bot(ws.id)
                if (Object.keys(bot.commands).includes(command)) {
                    bot.commands[command]()
                }
                break;
            case 'INIT':
                ws.send(JSON.stringify({
                    type: 'INFOR',
                    data: JSON.stringify({
                        bots: Object.keys(handl_command.bots)
                    }),
                    id: id
                }))
        }
    })

    ws.on('close', () => {
        Object.keys(handl_command.bots_ws_follow).forEach(e => {
            var element = handl_command.bots_ws_follow[e].find(j => j == ws.id)
            if (element) {
                const index = handl_command.bots_ws_follow[e].indexOf(ws.id);
                handl_command.bots_ws_follow[e].splice(index, 1)
            }
        })
    })

})

app.get('/imgbase64', async (req, res) => {
    const url = req.query.url
    if (url) {

        request.get(url, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                data = "data:" + response.headers["content-type"] + ";base64," + Buffer.from(body).toString('base64');
                res.send(data)
            }
        });

    }
    else {
        res.send('null')
    }
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
app.get('/main.jsx', (req, res) => {
    res.sendFile('src/main.jsx', {
        root: path.join(__dirname)
    })
})
app.get('/style.css', (req, res) => {
    res.sendFile('/src/style.css', {
        root: path.join(__dirname)
    })
})
app.get('/ws.js', (req, res) => {
    res.sendFile('./src/ws.js', {
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