const hp_back = '<div class="icon"> <img src="img/heart_bac.png"></div>'
const hp_full = '<div class="icon"> <img src="img/heart_bac.png"> <img src="img/heart_full.png"> </div>'
const hp_hap  = '<div class="icon"> <img src="img/heart_bac.png"> <img src="img/heart_ha.png"> </div>'

const food_back = '<div class="icon"> <img src="img/fool_bac.png"> </div>'
const food_full = '<div class="icon"> <img src="img/fool_bac.png"> <img src="img/fool_full.png"> </div>'
const food_hap  = '<div class="icon"> <img src="img/fool_bac.png"> <img src="img/fool_ha.png"> </div>'
window.WebSocket = window.WebSocket || window.MozWebSocket;
let ws = new WebSocket(`ws${location.protocol.replace('http', '')}/${location.host}`)

let bots = []
let id = 0
let que = {}
let botName = ''

ws.addEventListener('open', init)


ws.addEventListener('message' , (mess) => {
    var data = JSON.parse(mess.data)
    var fu = que[data.id]
    que.hasOwnProperty(data.id)
    if (fu) fu(data.data);
    else {
        // console.log(data.data)
        if (data.type == 'inventory') {
            setSlot(data.data)
        }
        else if (data.type == 'hp') {
            SetHP(data.data /2)
        }
        else if (data.type == 'food') {
            SetFood(data.data /2)
        }
        else if (data.type == 'pos') {
            setPos(data.data)
        }
        else if (data.type == 'mess') {
            var log = document.querySelector('#bot_display > div > div.row > div.log')
            var div = document.createElement('div')
            div.className = 'line'
            div.textContent = data.data
            log.append(div)
            div.scrollTo(0 , div.scrollHeight)
        }
        else if (data.type == 'isrun') {
            var button = document.querySelector('.command.server button:nth-child(1)')
            if (data.data) {
                button.innerHTML = 'stop'
                button.style.background = 'darkred'
                button.onclick = stop
            }
            else {
                button.innerHTML = 'Start'
                button.style.background = ''
                button.onclick = createBot
            }
        }

        else if (data.type == 'error') {
            var log = document.querySelector('#bot_display > div > div.row > div.log')
            var div = document.createElement('div')
            div.className = 'line err'
            div.textContent = data.data.code
            log.append(div)
            div.scrollTo(0 , div.scrollHeight)
        }
    }
})

function SetHP(hp) {
    hp = (hp * 1).toFixed(1)
    var hp_bar = document.querySelector('.conten .f_hp .hp')
    var html = ''
    for (var a = 0; a< 10; a++) {
        if (a == hp - 0.5) {
            html += hp_hap + '\n'

        }
        else if (a < hp) {
            html += hp_full + '\n'
        }
        else {
            html += hp_back + '\n'
        }
    }

    hp_bar.innerHTML = html
}

function SetFood(food) {
    var food_bar = document.querySelector('.conten .f_hp .food')
    var html = ''
    for (var a = 0; a< 10; a++) {
        if (a == food - 0.5) {
            html += food_hap + '\n'

        }
        else if (a < food) {
            html += food_full + '\n'
        }
        else {
            html += food_back + '\n'
        }
    }

    food_bar.innerHTML = html
}

function SetXp(text , xp) {
    var text_xp = document.querySelector('body > div > div.conten > div > div.xp > p')
    text_xp.innerHTML = 'lever ' + text
    var xp_bar = document.querySelector('body > div > div.conten > div > div.xp > div > div > div')
    xp_bar.style.width = xp + '%'
}

function setSlot(data) {
    var slots = document.querySelectorAll('body > div > div.conten > div > div.inve > div .slot')
    slots.forEach(e => e.innerHTML = '')

    data.forEach(e => {
        slots[e.slot - 1].innerHTML = `<img src="https://minecraftitemids.com/item/64/${e.name}.png"><p>${e.count != 1 ? e.count : ''}</p>`
        console.log(e)
    })
}

function setPos(xyz) {
    var div = document.querySelector('#bot_display > div > div.row > div.f_hp > div.position > p')
    div.textContent = `x:${xyz[0].toFixed(1)} y:${xyz[1].toFixed(1)} z:${xyz[2].toFixed(1)}`
}

function sendAip(obj, callback) {
    ws.send(JSON.stringify(Object.assign({id: id}, obj)))
    que[id] = callback
    id += 1
}

function sile_bar(data) {
    bots = data
    console.log(bots)
    var sile_bar = document.querySelector('body > div > div.star_bart')
    var srt = ''
    bots.forEach(e => {
        srt += `<div class="button bot" onclick="unfollow();getInforBot('${e}')"><p>${e}</p></div>
        `
    })
    sile_bar.innerHTML = `
    <div class="star_bart">
        <div class="button">
            <i class="ri-settings-2-line"></i>
        </div>
        ${srt}
        <div class="button add" onclick="unfollow();new_bot()">
            <i class="ri-add-line"></i>
        </div>
    </div>
    `
}

function unfollow() {
    sendAip({type: 'unfollow'})
}

function init() {
    sendAip({type: 'object',path: ['bots']}, sile_bar)
}

function createBot() {
    var name = document.getElementById('name').value
    if (!bots.includes(name)) {
        bots.push(name)
        sile_bar(bots)
    }
    document.getElementById('name').disabled = true
    var ip = document.getElementById('ip').value
    var post = document.getElementById('port').value
    botName = name

    sendAip({type: 'function', path: ['createBot'], arg: [name, ip, post]}, (data) => {
        var button = document.querySelector('.command.server button:nth-child(1)')
        button.innerHTML = 'stop'
        button.style.background = 'darkred'
        button.onclick = stop
    })
}

function stop() {
    var buttons = document.querySelectorAll('body > div > div.star_bart > div .button.bot')

    buttons.forEach(e => {
        if (e.querySelector('p').textContent == botName) {
            e.remove()
        } 
    })

    var index = bots.indexOf(botName)
    bots.splice(index , 1)

    sendAip({type: 'function', path: ['stop'], arg: []}, (data) => {
        var button = document.querySelector('.command.server button:nth-child(1)')
        button.innerHTML = 'Start'
        button.style.background = ''
        button.onclick = createBot

    })
}

function new_bot() {
    var a = document.getElementById('bot_display')
    a.innerHTML = '<div class="infor"> <div class="row"> <div class="art"> <img src="img/skins-renderer.png"> </div> <div class="f_hp"> <div class="name"> <input type="text" id="name"> </div> <div class="hp"> <div class="icon"> <img src="img/heart_bac.png"> <img src="img/heart_full.png"> </div> <div class="icon"> <img src="img/heart_bac.png"> <img src="img/heart_full.png"> </div> <div class="icon"> <img src="img/heart_bac.png"> <img src="img/heart_full.png"> </div> <div class="icon"> <img src="img/heart_bac.png"> <img src="img/heart_full.png"> </div> <div class="icon"> <img src="img/heart_bac.png"> <img src="img/heart_full.png"> </div> <div class="icon"> <img src="img/heart_bac.png"> <img src="img/heart_full.png"> </div> <div class="icon"> <img src="img/heart_bac.png"> <img src="img/heart_full.png"> </div> <div class="icon"> <img src="img/heart_bac.png"> <img src="img/heart_full.png"> </div> <div class="icon"> <img src="img/heart_bac.png"> <img src="img/heart_full.png"> </div> <div class="icon"> <img src="img/heart_bac.png"> <img src="img/heart_ha.png"> </div> </div> <div class="food"> <div class="icon"> <img src="img/fool_bac.png"> <img src="img/fool_full.png"> </div> <div class="icon"> <img src="img/fool_bac.png"> <img src="img/fool_full.png"> </div> <div class="icon"> <img src="img/fool_bac.png"> <img src="img/fool_full.png"> </div> <div class="icon"> <img src="img/fool_bac.png"> <img src="img/fool_full.png"> </div> <div class="icon"> <img src="img/fool_bac.png"> <img src="img/fool_full.png"> </div> <div class="icon"> <img src="img/fool_bac.png"> <img src="img/fool_full.png"> </div> <div class="icon"> <img src="img/fool_bac.png"> <img src="img/fool_full.png"> </div> <div class="icon"> <img src="img/fool_bac.png"> <img src="img/fool_full.png"> </div> <div class="icon"> <img src="img/fool_bac.png"> <img src="img/fool_full.png"> </div> <div class="icon"> <img src="img/fool_bac.png"> <img src="img/fool_ha.png"> </div> </div> <div class="position"> <p>x:0 y:0 z:0</p> </div> </div> <div class="log"></div> </div> <div class="xp"> <p>leve 0</p> <div class="xp_di"> <div class="w3-light-grey w3-xlarge"> <div class="w3-container w3-green" style="width:0%"></div> </div> </div> </div> <div class="inve"> <div class="inve_di"> <div class="armor"> <div class="slot helmet"></div> <div class="slot chestplate"></div> <div class="slot leggins"></div> <div class="slot boots"></div> </div> <div class="off_hand"> <div class="slot vi"></div> <div class="slot vi"></div> <div class="slot vi"></div> <div class="slot off_hand"></div> </div> <div class="main-inventory"> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="hotbar"> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> </div> </div> </div> </div></div>'
    var button = document.querySelector('.command.server button:nth-child(1)')
    button.innerHTML = 'Start'
    button.style.background = ''
    button.onclick = createBot
    botName = ''
}

function getInforBot(name) {
    var a = document.getElementById('bot_display')
    a.innerHTML = '<div class="infor"> <div class="row"> <div class="art"> <img src="img/skins-renderer.png"> </div> <div class="f_hp"> <div class="name"> <input type="text" id="name"> </div> <div class="hp"> <div class="icon"> <img src="img/heart_bac.png"> <img src="img/heart_full.png"> </div> <div class="icon"> <img src="img/heart_bac.png"> <img src="img/heart_full.png"> </div> <div class="icon"> <img src="img/heart_bac.png"> <img src="img/heart_full.png"> </div> <div class="icon"> <img src="img/heart_bac.png"> <img src="img/heart_full.png"> </div> <div class="icon"> <img src="img/heart_bac.png"> <img src="img/heart_full.png"> </div> <div class="icon"> <img src="img/heart_bac.png"> <img src="img/heart_full.png"> </div> <div class="icon"> <img src="img/heart_bac.png"> <img src="img/heart_full.png"> </div> <div class="icon"> <img src="img/heart_bac.png"> <img src="img/heart_full.png"> </div> <div class="icon"> <img src="img/heart_bac.png"> <img src="img/heart_full.png"> </div> <div class="icon"> <img src="img/heart_bac.png"> <img src="img/heart_ha.png"> </div> </div> <div class="food"> <div class="icon"> <img src="img/fool_bac.png"> <img src="img/fool_full.png"> </div> <div class="icon"> <img src="img/fool_bac.png"> <img src="img/fool_full.png"> </div> <div class="icon"> <img src="img/fool_bac.png"> <img src="img/fool_full.png"> </div> <div class="icon"> <img src="img/fool_bac.png"> <img src="img/fool_full.png"> </div> <div class="icon"> <img src="img/fool_bac.png"> <img src="img/fool_full.png"> </div> <div class="icon"> <img src="img/fool_bac.png"> <img src="img/fool_full.png"> </div> <div class="icon"> <img src="img/fool_bac.png"> <img src="img/fool_full.png"> </div> <div class="icon"> <img src="img/fool_bac.png"> <img src="img/fool_full.png"> </div> <div class="icon"> <img src="img/fool_bac.png"> <img src="img/fool_full.png"> </div> <div class="icon"> <img src="img/fool_bac.png"> <img src="img/fool_ha.png"> </div> </div> <div class="position"> <p>x:0 y:0 z:0</p> </div> </div> <div class="log"></div> </div> <div class="xp"> <p>leve 0</p> <div class="xp_di"> <div class="w3-light-grey w3-xlarge"> <div class="w3-container w3-green" style="width:0%"></div> </div> </div> </div> <div class="inve"> <div class="inve_di"> <div class="armor"> <div class="slot helmet"></div> <div class="slot chestplate"></div> <div class="slot leggins"></div> <div class="slot boots"></div> </div> <div class="off_hand"> <div class="slot vi"></div> <div class="slot vi"></div> <div class="slot vi"></div> <div class="slot off_hand"></div> </div> <div class="main-inventory"> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="hotbar"> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> <div class="slot"></div> </div> </div> </div> </div></div>'
    document.getElementById('name').value = name
    botName = name
    sendAip({type: 'function', path: ["getInforBot"] , arg: [name]} , (da) => {
        console.log(da)
        SetHP(da.hp / 2)
        SetFood(da.food / 2)
        setSlot(da.inventory)
        SetXp(da.xp[0] , da.xp[1])
        setPos(da.position)
        var button = document.querySelector('.command.server button:nth-child(1)')
        if (da.isrun) {
            button.innerHTML = 'stop'
            button.style.background = 'darkred'
            button.onclick = stop
        }
        else {
            button.innerHTML = 'Start'
            button.style.background = ''
            button.onclick = createBot
        }
    })
}
function autofish() {
    sendAip({
        type: 'function', path: ['autofish']
    }, () => {   
    })
}
function goto() {
    var i = document.querySelectorAll('body > div > div.contro > div.command.pos > div.body_command input')
    console.log(i)
    sendAip({
        type: 'function', path: ['goto'], arg: [0,i[0].value * 1, i[1].value * 1, i[2].value * 1]
    }, () => {   
    })
}

function cancel() {
    sendAip({
        type: 'function', path: ['cancel'], arg: []
    })
}
function highwaybuding() {
    var inputs = document.querySelectorAll('.command.highway.input .body_command input')

    var values = [0];
    inputs.forEach(e => {
        values.push(e.value)
    })

    console.log(values)

    sendAip({
        type: 'function', path: ['highwaybuding'], arg:values
    }, () => {
        console.log('askjfj')
    })

}

function afk() {
    sendAip({
        type: 'function', path: ['afk'], arg: []
    }, () => {
        console.log('askjfj')
    })
}