const mineflayer = require('mineflayer')
const antiafk = require("mineflayer-antiafk");

const Vec3 = require('vec3').Vec3
const pathfinder = require('mineflayer-pathfinder').pathfinder
const Movements = require('mineflayer-pathfinder').Movements
const { GoalNear, GoalFollow, GoalBlock } = require('mineflayer-pathfinder').goals

class highway {
    constructor(vec1, vec2) {
        this.pos = vec1
        this.target = vec2

        this.offset = [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1],
            [-1, 0, 0],
            [0, -1, 0],
            [0, 0, -1]
        ]
    }

    next() {
        var distances = []
        this.offset.forEach(e => {
            var d = Math.round(this.target.distanceTo(this.pos.offset(e[0], e[1], e[2])).toFixed(2) * 100)
            distances.push(d)
        })
        var min = Math.min(...distances)
        var index = distances.indexOf(min)

        if (this.pos.x == this.target.x && this.pos.y == this.target.y && this.pos.z == this.target.z) return false
        this.pos = this.pos.offset(this.offset[index][0], this.offset[index][1], this.offset[index][2])

        return this.pos
    }
}

class botAutoFishing {
    constructor(user, host, port) {
        this.user = user
        this.host = host == '' ? 'localhost' : host
        this.port = port == '' ? 1111 : port
        this.isrun = false
        this.last_command = null
        console.log(this, user, this.host, this.port)

        //type: DEBUG, EVENT, INFOR, SUCCESS, ERROR
        this.Update = (type, name, data) => { }
        this.wsSend = (type, data) => {
            this.Update(type, this.user, data)
        }
        this.commands = {
            bot_cancel: async (username, arg) => {
                if (this.last_command) {
                    this.commands.bot_stop(this.last_command)
                    this.last_command = null
                }
            },
            bot_goto: (username, arg) => {
                if (arg.length == 4) {
                    var x = parseInt(arg[1]), y = parseInt(arg[2]), z = parseInt(arg[3])
                    this.bot.pathfinder.setGoal(new GoalNear(x, y, z, 0))
                    this.bot.emit('goto_started', (x, y, z))
                    this.wsSend('DEBUG', `> GOTO ${x} ${y} ${z}`)
                    this.goal_reached_fun = () => {
                        if (username) {
                            this.bot.chat(`/msg ${username} đã tới nơi`)
                        }
                        this.wsSend('SUCCESS', '> GOTO complete')
                        this.bot.emit('goto_stoped', null)
                    }
                }
            },
            bot_follow: (username, arg) => {

                this.userNameFollow = username
                this.bot.chat(`/msg ${username} tôi đi theo bạn`)
                const player = this.bot.players[username]
                if (!player || !player.entity) return;
                this.bot.pathfinder.setGoal(new GoalFollow(player.entity, 1), true)
            },
            bot_autofish: (username, arg) => {
                var fishing_rod = this.bot.inventory.items().find((e) => e.name == 'fishing_rod')
                if (!fishing_rod) {
                    if (username) this.bot.chat(`/msg ${username} không có cần câu`);
                    this.wsSend('ERROR', '> FISH haven\' fishing_rod')
                    return
                }
                if (username) this.bot.chat(`/msg ${username} bắt đầu câu cá`);

                this.bot.equip(fishing_rod).then(() => {
                    this.wsSend('SUCCESS', '> FISH started')
                    this.bot.emit('autofish_started', null)
                    this.activateFishing()
                })
            },
            bot_dropall: (username, arg) => {
                this.wsSend('DEBUG', `> DROP_ALL ${this.bot.inventory.items().length}items`)
                var drop = () => {
                    if (this.bot.inventory.items().length == 0) {
                        this.wsSend('SUCCESS', `> DROP_ALL complete`)
                    }
                    var item = this.bot.inventory.items()[0]
                    this.bot.tossStack(item).then(() => {
                        drop()
                    })
                }
                drop()
            },
            bot_highwaybuding: (username, arg) => {
                var pos = this.bot.entity.position
                const target = new Vec3(arg[1] * 1, arg[2] * 1, arg[3] * 1)
                const line = new highway(pos, target)
                var temlay = new Vec3(1, 0, 1)
                var block_buding = this.mcData.itemsByName[arg[7]]
                const face = [
                    [1, 0, 0],
                    [-1, 0, 0],
                    [0, 1, 0],
                    [0, -1, 0],
                    [0, 0, 1],
                    [0, 0, -1],
                ]
                const dig = async (block) => {
                    if (this.stop_mess) { throw 'stop' }
                    if (block.name == 'water' || block.name == 'lava') return
                    var bestTool = this.bot.pathfinder.bestHarvestTool(block)
                    await this.bot.equip(bestTool)
                    await this.bot.dig(block, 'ignore')
                }
                const placeBlock = async (block, faceVector) => {
                    if (this.stop_mess) { throw 'stop' }
                    var item = this.bot.inventory.items().find(e => e.name == block_buding.name)
                    await this.bot.equip(item)
                    await this.bot.placeBlock(block, faceVector)
                }
                const buid = async () => {
                    var current_position, last_position, last_vector = new Vec3(0, 0, 0)
                    while (1) {
                        current_position = line.next()
                        if (!current_position) break
                        if (last_position) {
                            var faceVector = current_position.minus(last_position);
                            var templay_vector = temlay.minus(new Vec3(Math.abs(faceVector.x), 0, Math.abs(faceVector.z)))
                            let current_block_c, current_block_l, current_block_r
                            if (faceVector.x != 0 || faceVector.z != 0) {
                                for (var height = 1; height < 5; height++) {

                                    if (this.stop_mess) { throw 'stop' }

                                    if (height == 0) {
                                        var pos_c = current_position.offset(0, 0, 0)
                                        current_block_c = this.bot.blockAt(pos_c)
                                        if (current_block_c.transparent && current_block_c.diggable) {
                                            await dig(current_block_c)
                                        }

                                        current_block_c = this.bot.blockAt(current_position.offset(0, 0, 0))
                                        if (current_block_c.name == 'air' || current_block_c.name == 'water' || current_block_c.name == 'lava') {
                                            console.log(last_position)
                                            await placeBlock(this.bot.blockAt(last_position), faceVector)
                                        }

                                        if (faceVector.x != 0 || faceVector.z != 0) {
                                            var pos_l = current_position.offset(templay_vector.x, 0, templay_vector.z)
                                            var pos_r = current_position.offset(-templay_vector.x, 0, -templay_vector.z)

                                            current_block_l = this.bot.blockAt(pos_l)
                                            current_block_r = this.bot.blockAt(pos_r)

                                            if (current_block_l.transparent && current_block_l.diggable) {
                                                await dig(current_block_l)
                                            }
                                            if (current_block_r.transparent && current_block_r.diggable) {
                                                await dig(current_block_r)
                                            }

                                            current_block_l = this.bot.blockAt(current_position.offset(templay_vector.x, 0, templay_vector.z))
                                            current_block_r = this.bot.blockAt(current_position.offset(-templay_vector.x, 0, -templay_vector.z))

                                            if (current_block_l.name == 'air' || current_block_l.name == 'water' || current_block_l.name == 'lava') {
                                                await placeBlock(current_block_c, new Vec3(templay_vector.x, 0, templay_vector.z))
                                            }
                                            if (current_block_r.name == 'air' || current_block_r.name == 'water' || current_block_r.name == 'lava') {
                                                await placeBlock(current_block_c, new Vec3(-templay_vector.x, 0, -templay_vector.z))
                                            }
                                            await this.bot.pathfinder.goto(new GoalBlock(current_position.x, current_position.y + 1, current_position.z)).catch(e => { })
                                        }
                                    }

                                    else {
                                        if (height == 1) {
                                            if (last_vector.y == 0) continue
                                        }
                                        var pos_c = current_position.offset(0, 5 - height, 0)
                                        var pos_l = current_position.offset(templay_vector.x, 5 - height, templay_vector.z)
                                        var pos_r = current_position.offset(-templay_vector.x, 5 - height, -templay_vector.z)
    
                                        current_block_c = this.bot.blockAt(pos_c)
                                        current_block_l = this.bot.blockAt(pos_l)
                                        current_block_r = this.bot.blockAt(pos_r)
    
    
                                        var fromt_current_block_c = this.bot.blockAt(pos_c.offset(faceVector.x, 0, faceVector.z))
                                        var fromt_current_block_l = this.bot.blockAt(pos_l.offset(faceVector.x, 0, faceVector.z))
                                        var fromt_current_block_r = this.bot.blockAt(pos_r.offset(faceVector.x, 0, faceVector.z))
    
                                        if (fromt_current_block_c.name == 'water' || fromt_current_block_c.name == 'lava') {
                                            await placeBlock(current_block_c, faceVector)
                                        }
                                        if (fromt_current_block_l.name == 'water' || fromt_current_block_l.name == 'lava') {
                                            await placeBlock(current_block_l, faceVector)
                                        }
                                        if (fromt_current_block_r.name == 'water' || fromt_current_block_r.name == 'lava') {
                                            await placeBlock(current_block_r, faceVector)
                                        }
    
                                        //clear
                                        if (current_block_c.diggable) {
                                            for (var i = 0; i < 6; i++) {
                                                var e = face[i]
                                                var block = this.bot.blockAt(current_block_c.position.offset(e[0], e[1], e[2]))
                                                if (block.name == 'water' || block.name == 'lava') {
                                                    await placeBlock(current_block_c, new Vec3(e[0], e[1], e[2]))
                                                }
                                            }
                                            await dig(current_block_c)
                                        }
    
                                        if (current_block_l.diggable) {
                                            for (var i = 0; i < 6; i++) {
                                                var e = face[i]
                                                var block = this.bot.blockAt(current_block_l.position.offset(e[0], e[1], e[2]))
                                                if (block.name == 'water' || block.name == 'lava') {
                                                    await placeBlock(current_block_l, new Vec3(e[0], e[1], e[2]))
                                                }
                                            }
                                            await dig(current_block_l)
                                        }
    
                                        if (current_block_r.diggable) {
                                            for (var i = 0; i < 6; i++) {
                                                var e = face[i]
                                                var block = this.bot.blockAt(current_block_r.position.offset(e[0], e[1], e[2]))
                                                if (block.name == 'water' || block.name == 'lava') {
                                                    await placeBlock(current_block_r, new Vec3(e[0], e[1], e[2]))
                                                }
                                            }
                                            await dig(current_block_r)
                                        }
                                    }
                                    
                                }
                            }




                            last_vector = faceVector
                        }
                        last_position = current_position

                    }
                }

                this.bot.emit('highwaybuding_started', (target.x, target.y, target.z))
                this.bot.wsSend('DEBUG', `> HIGHWAYBUDING started to ${target.x} ${target.y} ${target.z}`)
                buid().then(e => {
                    this.bot.emit('highwaybuding_stoped', null)
                    this.wsSend('SUCCESS', '> HIGHWAYBUDING complete')
                }).catch(e => {
                    if (e == 'stop') {
                        this.bot.wsSend('SUCCESS', `> HIGHWAYBUDING cancel successfully`)
                    }
                    
                    this.bot.emit('highwaybuding_stoped' , '')
                })
            },
            bot_stop: (username, arg) => {
                this.isrun = false
                if (typeof (this.bot.quit) == 'function') {
                    this.wsSend('DEBUG', 'logout server')
                    this.isrun = false
                    this.wsSend('EVENT', JSON.stringify({
                        type: 'bot_run',
                        data: this.isrun
                    }))
                    this.bot.quit()
                }
            },
            bot_afk: (username, arg) => {
                this.bot.afk.setOptions({ fishing: false, actions: ['rotate', 'swingArm'] });
                this.bot.afk.start();
            },
            stop_command: async (username, arg) => {
                var command = arg[1].toLowerCase()
                switch (command) {
                    case "bot_goto":
                        if (this.goto) {
                            this.goal_reached_fun = undefined
                            this.bot.pathfinder.stop()
                            this.wsSend('SUCCESS', '> GOTO cancel successfully')
                            this.bot.emit('goto_stoped', null)
                        }
                        break;
                    case 'bot_autofish':
                        if (this.autofishData.isAutoFishing) {
                            if (this.autofishData.fishingBobberId) {
                                this.bot.activateItem()
                                this.autofishData.fishingBobberId = null
                            }
                            this.bot.wsSend('SUCCESS', '> FISH cancel successfully')
                            this.bot.emit('autofish_stoped')
                        }
                    
                    case 'bot_highwaybuding':

                }
            }
        }
        this.initBot();
    }

    //________________________________________________________________
    initBot() {
        this.bot = mineflayer.createBot({
            host: this.host,
            port: this.port,
            username: this.user
        })

        this.bot.loadPlugin(pathfinder)
        this.bot.loadPlugin(antiafk);

        this.autofishData = {
            isAutoFishing: false,
            fishingBobberId: null
        }
        this.goto = false
        this.stop_mess = false
        this.ishighwayed = false

        this.posBlockMine = null
        this.isKicked = false
        this.goal_reached_fun = () => { }

        this.initEvent()
    }
    initEvent() {
        this.bot.once('login', () => {
            this.isrun = true
            this.wsSend('EVENT', JSON.stringify({
                type: 'bot_run',
                data: this.isrun
            }))
        })
        this.bot.once('spawn', () => {
            this.mcData = require('minecraft-data')(this.bot.version)
            this.bot.inventory.on('updateSlot', () => {
                this.wsSend('EVENT', JSON.stringify({
                    type: 'updateSlot',
                    data: this.bot.inventory.items()
                }))
            })
            this.defaultMove = new Movements(this.bot, this.mcData)
            this.defaultMove.allowParkour = true
            this.defaultMove.allowSprinting = true
            this.defaultMove.canDig = true
            this.defaultMove.allow1by1towers = true
            this.bot.pathfinder.setMovements(this.defaultMove)

            this.bot.chat('/login i=input()')
        })
        this.bot.on('goal_reached', () => {
            if (this.goal_reached_fun) this.goal_reached_fun();
        })
        this.bot.on('end', (reason) => {
            console.log(`[${this.user}] Disconnected: ${reason}`);
            if (reason == "disconnect.quitting") {
                return
            }

            // Attempt to reconnect
            setTimeout(() => {
                if (this.isrun)
                    this.initBot()
                if (this.autofishData.isAutoFishing) {
                    this.commands.bot_autofish()
                }
            }, 5000);
        });
        this.bot.on('spawn', () => {
            if (this.isKicked) {
                this.isKicked = false
                if (this.autofishData.isAutoFishing) {

                    var item = this.bot.inventory.items().find((e) => e.name == 'fishing_rod')
                    if (!item) {
                        this.bot.chat('không có cần câu')
                        this.autofishData.isAutoFishing = false
                        return
                    }

                    var blocks = this.bot.findBlocks({
                        matching: this.mcData.blocksByName.water.id,
                        maxDistance: 100
                    })

                    console.log(blocks)
                    // ______________________________________________________________________________________
                    blocks.find((value) => {
                        this.bot.blockAt(value)
                    })
                }
                else if (this.posBlockMine) {
                    var block = this.bot.blockAt(this.posBlockMine)
                    var item = this.bot.pathfinder.bestHarvestTool(block)
                    if (item) {
                        this.bot.equip(item).then(() => {
                            if (this.bot.entity.position.distanceTo(p) > 2) {
                                this.bot.pathfinder.setGoal(new GoalNear(
                                    parseInt(arg[1]),
                                    parseInt(arg[2]),
                                    parseInt(arg[3]), 2)
                                )
                                this.goal_reached_fun = () => {
                                    this.bot.dig(block)
                                }
                            }
                            this.bot.dig(block)
                        })
                    }
                }
            }
        })
        this.bot.on('death', () => {
            this.bot.pathfinder.stop()
            this.autofishData.isAutoFishing = false
            this.bot.follow = null
            this.bot.mine = null
            this.autofishData.fishingBobberId = null
            this.bot.chat('Hủy tất cả do chết')
        })
        this.bot.on('entityUpdate', (e) => {
            if (this.autofishData.isAutoFishing) {
                if (e.name == "fishing_bobber" && e.id == this.autofishData.fishingBobberId) {
                    this.autofishData.fishingBobberId = null
                    this.bot.activateItem()
                    this.activateFishing()
                }
            }
        })
        this.bot.on('whisper', (username, message) => {
            if (username === this.bot.username) return
            var arg = message.split(' ')
            var command = this.commands[arg[0]]
            if (command) {
                this.commands.bot_cancel().then(e => {
                    this.last_command = command
                    console.log('ok')
                    command(username, arg)
                })
            }
            else {
                this.bot.chat(`/msg ${username} không có câu lệnh đó`)
            }
        })
        this.bot.on('health', () => {
            this.wsSend('EVENT', JSON.stringify({
                type: 'health',
                data: {
                    hp: this.bot.health,
                    food: this.bot.food
                }
            }))
        })
        this.bot.on('move', () => {
            var pos = this.bot.entity.position
            this.wsSend('EVENT', JSON.stringify({
                type: 'move',
                data: {
                    x: pos.x,
                    y: pos.y,
                    z: pos.z
                }
            }))
            // this.Update('pos', this.user, [pos.x, pos.y, pos.z])
        })
        this.bot.on('error', (error) => {
            this.wsSend('ERROR', JSON.stringify(error))
        })
        this.bot.on("actionBar", async (jsonMsg) => {
            if (jsonMsg.translate == 'sleep.players_sleeping') {
                var bed = this.bot.findBlock({
                    matching: (block) => {
                        var bool = block.displayName.includes('Bed')
                        return bool
                    }
                })
                if (bed) {
                    this.bot.afk.stop();
                    await this.bot.sleep(bed)
                    this.bot.afk.start();
                }
            }
        })
        this.bot.on('autofish_started', () => {
            this.autofishData.isAutoFishing = true
            this.wsSend('EVENT', JSON.stringify({
                type: 'bot_autofish',
                data: this.autofishData.isAutoFishing
            }))
        })
        this.bot.on('autofish_stoped', () => {
            this.autofishData.isAutoFishing = false
            this.wsSend('EVENT', JSON.stringify({
                type: 'bot_autofish',
                data: this.autofishData.isAutoFishing
            }))
        })
        this.bot.on('goto_started', () => {
            this.goto = true
            this.wsSend('EVENT', JSON.stringify({
                type: 'bot_goto',
                data: this.goto
            }))
        })
        this.bot.on('goto_stoped', () => {
            this.goto = false
            this.wsSend('EVENT', JSON.stringify({
                type: 'bot_goto',
                data: this.goto
            }))
        })
        this.bot.on('highwaybuding_started', (x , y, z) => {
            this.ishighwayed = true
            this.stop_mess = false
            this.wsSend('EVENT', JSON.stringify({
                type: 'bot_highwaybuding',
                data: this.ishighwayed
            }))
        })
        this.bot.on('highwaybuding_stoped', () => {
            this.ishighwayed = false
            this.stop_mess = false
            this.wsSend('EVENT', JSON.stringify({
                type: 'bot_highwaybuding',
                data: this.ishighwayed
            }))
        })
    }
    //________________________________________________________________
    activateFishing() {
        var getId = (e) => {
            if (e.name == "fishing_bobber") {
                this.autofishData.fishingBobberId = e.id
                this.bot.removeListener('entitySpawn', getId)
            }
        }

        var waterBlocks = this.bot.findBlocks({
            matching: this.mcData.blocksByName.water.id,
            count: 20,
            maxDistance: 3
        })

        var water = waterBlocks.find((e) => {
            return e.y == this.bot.entity.position.y - 1
        })
        if (water) {
            var p = water.offset(0.5, 0.5, 0.5)
            this.bot.addListener('entitySpawn', getId)
            this.bot.lookAt(p, true).then(() => {
                setTimeout(() => {
                    this.bot.activateItem()
                }, 100)
            })
        }
        else {
            this.wsSend('ERROR', '> FISH no water')
        }
    }

    wsSendDEBUG() {
        this.wsSend('EVENT', JSON.stringify({
            type: 'spawn',
            data: true
        }))
        this.wsSend('EVENT', JSON.stringify({
            type: 'health',
            data: {
                hp: this.bot.health,
                food: this.bot.food
            }
        }))
        this.wsSend('EVENT', JSON.stringify({
            type: 'updateSlot',
            data: this.bot.inventory.items()
        }))
        const pos = this.bot.entity.position
        this.wsSend('EVENT', JSON.stringify({
            type: 'move',
            data: {
                x: pos.x,
                y: pos.y,
                z: pos.z
            }
        }))
        this.wsSend('INFOR', JSON.stringify({
            botName: this.user,
            iP: this.host,
            Port: this.port
        }))
        this.wsSend('EVENT', JSON.stringify({
            type: 'bot_run',
            data: this.isrun
        }))
    }
}

// var bot = new botAutoFishing('fish1', '', '')

module.exports = botAutoFishing;