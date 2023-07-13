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

ws.addEventListener('message' , (mess) => {
    var mess = JSON.parse(mess.data)
    // if (mess.data.type != "move") {
    //     console.log("🚀 ~ file: main.js:18 ~ ws.addEventListener ~ mess:", mess)
    // }

    switch(mess.type) {
        case 'EVENT':
            var data = JSON.parse(mess.data)
            switch (data.type) {
                case 'bot_run':
                    const status = document.querySelector('#bot_run .status_div');
                    status.style.background = data.data ? 'green' : 'red';
                    const startButton = document.querySelector('div.row > div.bot_button > button:nth-child(1)');
                    startButton.innerHTML = data.data ? `<i class="ri-stop-fill"></i> Stop`: `<i class="ri-play-fill"></i> Start`;
                    startButton.style.background = data.data ? 'red' : 'green';
                    startButton.onclick = data.data ? stop_bot: createBot;
                    break;
                case 'health':
                    const {hp, food} = data.data;
                    SetHP(hp / 2);
                    SetFood(food /2);
                    break;
                case 'move':
                    const {x , y , z} = data.data;
                    setPos([x , y, z]);
                    break;
                case 'updateSlot':
                    setSlot(data.data);
                    break;
            }
            break;
        case 'INFOR':
            const {bots, botName, iP, Port} = JSON.parse(mess.data)
            console.log("🚀 ~ file: main.js:45 ~ ws.addEventListener ~ bots, botName, iP, Port:", bots, botName, iP, Port)
            if (bots) {
                sile_bar(bots)
            }
            if (botName) {
                document.getElementById('name').value = botName
                document.getElementById('name').disabled = true
            }
            if (iP) {
                document.getElementById('ip').value = iP
                document.getElementById('ip').disabled = true
            }
            if (Port) {
                document.getElementById('port').value = Port
                document.getElementById('port').disabled = true
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
    var slots = document.querySelectorAll('body > div > div.conten > div > div.inve > div .slot > label')
    slots.forEach(e => e.innerHTML = '')
    
    data.forEach(item => {
        const slot = document.querySelector(`div.slot.s${item.slot} > label`)
        slot.innerHTML = `<img src="https://minecraftitemids.com/item/64/${item.name}.png"><p>${item.count != 1 ? item.count : ''}</p>`
    })
}

function setPos(xyz) {
    var div = document.querySelector('#bot_display > div > div.row > div.f_hp > div.position > p')
    div.textContent = `x:${xyz[0].toFixed(1)} y:${xyz[1].toFixed(1)} z:${xyz[2].toFixed(1)}`
}

//type: STAR_COMMAND, STOP_COMMAND, FOLLOW, STAR_BOT, STOP_BOT, UNFOLLOW
function sendAip(type, data) {
    ws.send(JSON.stringify({type: type, data: data}))
}

function sile_bar(data) {
    bots = data
    console.log("🚀 ~ file: main.js:119 ~ sile_bar ~ bots:", bots)
    var sile_bar = document.querySelector('body > div > div.star_bart')
    var srt = ''
    bots.forEach(e => {
        srt += `<div class="button bot" onclick="unfollow();Follow('${e}')"><p>${e}</p></div>
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
    sendAip('UNFOLLOW', null)
}


function createBot() {
    var name = document.getElementById('name').value
    if (!bots.includes(name)) {
        bots.push(name)
        sile_bar(bots)
    }
    document.getElementById('name').disabled = true
    var ip = document.getElementById('ip').value
    var port = document.getElementById('port').value
    botName = name

    sendAip('STAR_BOT', {
        botName: botName, 
        iP: ip,
        Port: port
    })
}

function stop_bot() {
    var buttons = document.querySelectorAll('body > div > div.star_bart > div .button.bot')

    buttons.forEach(e => {
        if (e.querySelector('p').textContent == botName) {
            e.remove()
        } 
    })

    var index = bots.indexOf(botName)
    bots.splice(index , 1)

    sendAip('STOP_BOT', null)
}

function new_bot() {
    var a = document.getElementById('bot_display')
    a.innerHTML = `
    <div class="infor">
    <div class="row">
        <div class="art"> <img src="img/skins-renderer.png"> </div>
        <div class="f_hp">
            <div class="name"> <input type="text" id="name" placeholder="BOT NAME"> </div>
            <div class="hp">
                <div class="icon"> <img src="img/heart_bac.png"> <img src="img/heart_full.png"> </div>
                <div class="icon"> <img src="img/heart_bac.png"> <img src="img/heart_full.png"> </div>
                <div class="icon"> <img src="img/heart_bac.png"> <img src="img/heart_full.png"> </div>
                <div class="icon"> <img src="img/heart_bac.png"> <img src="img/heart_full.png"> </div>
                <div class="icon"> <img src="img/heart_bac.png"> <img src="img/heart_full.png"> </div>
                <div class="icon"> <img src="img/heart_bac.png"> <img src="img/heart_full.png"> </div>
                <div class="icon"> <img src="img/heart_bac.png"> <img src="img/heart_full.png"> </div>
                <div class="icon"> <img src="img/heart_bac.png"> <img src="img/heart_full.png"> </div>
                <div class="icon"> <img src="img/heart_bac.png"> <img src="img/heart_full.png"> </div>
                <div class="icon"> <img src="img/heart_bac.png"> <img src="img/heart_ha.png"> </div>
            </div>
            <div class="food">
                <div class="icon"> <img src="img/fool_bac.png"> <img src="img/fool_full.png"> </div>
                <div class="icon"> <img src="img/fool_bac.png"> <img src="img/fool_full.png"> </div>
                <div class="icon"> <img src="img/fool_bac.png"> <img src="img/fool_full.png"> </div>
                <div class="icon"> <img src="img/fool_bac.png"> <img src="img/fool_full.png"> </div>
                <div class="icon"> <img src="img/fool_bac.png"> <img src="img/fool_full.png"> </div>
                <div class="icon"> <img src="img/fool_bac.png"> <img src="img/fool_full.png"> </div>
                <div class="icon"> <img src="img/fool_bac.png"> <img src="img/fool_full.png"> </div>
                <div class="icon"> <img src="img/fool_bac.png"> <img src="img/fool_full.png"> </div>
                <div class="icon"> <img src="img/fool_bac.png"> <img src="img/fool_full.png"> </div>
                <div class="icon"> <img src="img/fool_bac.png"> <img src="img/fool_ha.png"> </div>
            </div>
            <div class="position">
                <p>x:0 y:0 z:0</p>
            </div>
        </div>
        <div class="server_infor">
            <div class="l">
                <input type="text" placeholder="SERVER IP" id="ip">
                <input type="text" placeholder="SERVER PORT" id="port">
                <p>ping:</p>
            </div>
        </div>
        <div class="bot_button">
            <button onclick="createBot()">
                <i class="ri-play-fill"></i>
                Start
            </button>
            <button>
                <i class="ri-equalizer-fill"></i>
                confit
            </button>
        </div>
    </div>
    <div class="xp">
        <p>leve 0</p>
        <div class="xp_di">
            <div class="w3-light-grey w3-xlarge">
                <div class="w3-container w3-green" style="width:0%"></div>
            </div>
        </div>
    </div>
    <div class="inve">
        <div class="log"></div>
        <div class="status">
            <div class="div_line" id="bot_run">
                <p>Bot Runing</p>
                <div class="status_div"></div>
            </div>
            <div class="div_line" id="bot_goto">
                <p>GOTO</p>
                <div class="status_div"></div>
            </div>
            <div class="div_line" id="bot_autofish">
                <p>FISH</p>
                <div class="status_div"></div>
            </div>
            <div class="div_line" id="bot_eat">
                <p>AUTO EAT</p>
                <div class="status_div"></div>
            </div>
            <div class="div_line" id="bot_sleep">
                <p>SlEEP</p>
                <div class="status_div"></div>
            </div>
            <div class="div_line" id="bot_highwaybuding">
                <p>highwaybuding</p>
                <div class="status_div"></div>
            </div>
            <div class="div_line">
                <p>antiafk</p>
                <div class="status_div"></div>
            </div>
            <div class="div_line center">
                <button onclick="command(true)">
                    <i class="ri-external-link-line"></i>
                    CONMMAND
                </button>
            </div>
        </div>
        <div class="inve_di">
            <div class="armor">
                <div class="slot helmet">
                    <input type="checkbox" disabled id="checkbox">
                    <label for="checkbox"></label>
                </div>
                <div class="slot chestplate">
                    <input type="checkbox" disabled id="chestplate">
                    <label for="chestplate"></label>
                </div>
                <div class="slot leggins">
                    <input type="checkbox" disabled id="leggins">
                    <label for="leggins"></label>
                </div>
                <div class="slot boots">
                    <input type="checkbox" disabled id="boots">
                    <label for="boots"></label>
                </div>
            </div>
            <div class="off_hand">
                <div class="slot vi"></div>
                <div class="slot vi"></div>
                <div class="slot vi"></div>
                <div class="slot off_hand">
                    <input type="checkbox" disabled id="off_hand">
                    <label for="off_hand"></label>
                </div>
            </div>
            <div class="main-inventory">
                <div class="slot s9">
                    <input type="checkbox" id="cb9">
                    <label for="cb9"></label>
                </div>
                <div class="slot s10">
                    <input type="checkbox" id="cb10">
                    <label for="cb10"></label>
                </div>
                <div class="slot s11">
                    <input type="checkbox" id="cb11">
                    <label for="cb11"></label>
                </div>
                <div class="slot s12">
                    <input type="checkbox" id="cb12">
                    <label for="cb12"></label>
                </div>
                <div class="slot s13">
                    <input type="checkbox" id="cb13">
                    <label for="cb13"></label>
                </div>
                <div class="slot s14">
                    <input type="checkbox" id="cb14">
                    <label for="cb14"></label>
                </div>
                <div class="slot s15">
                    <input type="checkbox" id="cb15">
                    <label for="cb15"></label>
                </div>
                <div class="slot s16">
                    <input type="checkbox" id="cb16">
                    <label for="cb16"></label>
                </div>
                <div class="slot s17">
                    <input type="checkbox" id="cb17">
                    <label for="cb17"></label>
                </div>
                <div class="slot s18">
                    <input type="checkbox" id="cb18">
                    <label for="cb18"></label>
                </div>
                <div class="slot s19">
                    <input type="checkbox" id="cb19">
                    <label for="cb19"></label>
                </div>
                <div class="slot s20">
                    <input type="checkbox" id="cb20">
                    <label for="cb20"></label>
                </div>
                <div class="slot s21">
                    <input type="checkbox" id="cb21">
                    <label for="cb21"></label>
                </div>
                <div class="slot s22">
                    <input type="checkbox" id="cb22">
                    <label for="cb22"></label>
                </div>
                <div class="slot s23">
                    <input type="checkbox" id="cb23">
                    <label for="cb23"></label>
                </div>
                <div class="slot s24">
                    <input type="checkbox" id="cb24">
                    <label for="cb24"></label>
                </div>
                <div class="slot s25">
                    <input type="checkbox" id="cb25">
                    <label for="cb25"></label>
                </div>
                <div class="slot s26">
                    <input type="checkbox" id="cb26">
                    <label for="cb26"></label>
                </div>
                <div class="slot s27">
                    <input type="checkbox" id="cb27">
                    <label for="cb27"></label>
                </div>
                <div class="slot s28">
                    <input type="checkbox" id="cb28">
                    <label for="cb28"></label>
                </div>
                <div class="slot s29">
                    <input type="checkbox" id="cb29">
                    <label for="cb29"></label>
                </div>
                <div class="slot s30">
                    <input type="checkbox" id="cb30">
                    <label for="cb30"></label>
                </div>
                <div class="slot s31">
                    <input type="checkbox" id="cb31">
                    <label for="cb31"></label>
                </div>
                <div class="slot s32">
                    <input type="checkbox" id="cb32">
                    <label for="cb32"></label>
                </div>
                <div class="slot s33">
                    <input type="checkbox" id="cb33">
                    <label for="cb33"></label>
                </div>
                <div class="slot s34">
                    <input type="checkbox" id="cb34">
                    <label for="cb34"></label>
                </div>
                <div class="slot s35">
                    <input type="checkbox" id="cb35">
                    <label for="cb35"></label>
                </div>

                <div class="hotbar">
                    <div class="slot s36">
                        <input type="checkbox" id="cb36">
                        <label for="cb36"></label>
                    </div>
                    <div class="slot s37">
                        <input type="checkbox" id="cb37">
                        <label for="cb37"></label>
                    </div>
                    <div class="slot s37">
                        <input type="checkbox" id="cb37">
                        <label for="cb37"></label>
                    </div>
                    <div class="slot s38">
                        <input type="checkbox" id="cb38">
                        <label for="cb38"></label>
                    </div>
                    <div class="slot s39">
                        <input type="checkbox" id="cb39">
                        <label for="cb39"></label>
                    </div>
                    <div class="slot s40">
                        <input type="checkbox" id="cb40">
                        <label for="cb40"></label>
                    </div>
                    <div class="slot s41">
                        <input type="checkbox" id="cb41">
                        <label for="cb41"></label>
                    </div>
                    <div class="slot s42">
                        <input type="checkbox" id="cb42">
                        <label for="cb42"></label>
                    </div>
                    <div class="slot s43">
                        <input type="checkbox" id="cb43">
                        <label for="cb43"></label>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>`
}

function afk() {
    sendAip('STAR_COMMAND', {
        command: 'bot_afk'
    })
}
function Follow(name) {
    new_bot()
    sendAip('FOLLOW', {
        bot_name: name
    })
}