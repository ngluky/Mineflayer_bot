var fun_id = {}
var id = 0
var ws
//type: STAR_COMMAND, STOP_COMMAND, FOLLOW, STAR_BOT, STOP_BOT, UNFOLLOW
function sendAip(type, data, callback) {
    id++
    ws.send(JSON.stringify({type: type, data: data, id: id}))
    if (callback) {
        fun_id[id] = callback
    }
}

function connet(callback) {
    ws = new WebSocket(`ws${location.protocol.replace('http', '')}/${location.host}`)
    ws.onopen = () => {
        console.log('conneted')
    }
    ws.onclose = () => {
        console.log('lost connet...')
        setTimeout(() => {
            connet()
        }, 5000)
    }
    ws.onmessage = (message) => {
        var message = JSON.parse(message.data)
        const {type, data, id} = message
        const fun = fun_id[id]
        if (fun) fun(JSON.parse(data))
    }
}

function follow(name , callback) {
    apiSend('FOLLOW',  {
        bot_name: name
    }, callback)
}

function init(callback) {
    sendAip('INIT', null, callback)
}

connet()