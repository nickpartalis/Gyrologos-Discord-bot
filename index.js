const Discord = require("discord.js")
const Database = require("@replit/database")
const client = new Discord.Client()
const keepAlive = require("./server")
const cron = require("cron")
const db = new Database()

const playerList = process.env.PLAYER_LIST.split(", ")
const ADMIN_ID = process.env.ADMIN_ID
const PLAYER_NUM = 3
const TURN_HOURS = 28
const CHANNEL_ID = process.env.CHANNEL_ID
const recentCommand = new Set()

// IMAGE/GIF LINKS
const turnLostGif = [
  // A bunch of meme images that say "Pathetic!", for when a player runs out of time
  "https://i.pinimg.com/originals/77/9e/91/779e913b7a6ea3148570e30c11bffd78.jpg",
  "https://pbs.twimg.com/media/DuVUG6KX4AM_nRp.jpg",
  "https://64.media.tumblr.com/ac13536dff1e6dfdfa8c5ffc184de9fa/tumblr_p2dkhixMy21uh8pdmo2_1280.png",
  ]

const turnChangeGif = [
  // INSERT YOUR GIFS HERE
  "https://i.giphy.com/media/gw3IWyGkC0rsazTi/200.gif"
  ]

async function checkAttachment(msg) {
  // Checks attachment and ends the turn if it's a .sav file
  const attachments = (msg.attachments).array()
  const nameArray = attachments[0].name.split('.')
  const attExt = nameArray[nameArray.length - 1]
  nameArray.splice(-1, 1)

  if (attExt === "sav") {
    if (!(msg.content === "!bypass" && msg.author.id === ADMIN_ID)) {
    // CHANGE TURN
      let index = await getIndex()
      if (playerList[index] != msg.author.id) msg.reply("it is not your turn.")
      else {
        const now = new Date()
        const turnHours = TURN_HOURS - ((await deadline("get") - now) / (60 * 60 * 1000)) // hours

        const playerStats = await db.get("playerStats")
        const player = msg.author.id
        const [turns, average] = playerStats[player].averageTime
        let newAverage = (turns * average + turnHours) / (turns + 1)
        newAverage = parseFloat(newAverage.toFixed(1)) // float with 1 decimal
        playerStats[player].averageTime = [turns+1, newAverage]
        await db.set("playerStats", playerStats)
        console.log("playerStats", playerStats)
        // }

        index = (index + 1) % PLAYER_NUM
        await db.set("nextPlayerIndx", index)

        const text = `your turn is over. Average turn completion time: ${newAverage} hours.
It is now <@${playerList[index]}>'s turn. Time remaining: ${await getTimeLeft()}`
        let embedMessage = new Discord.MessageEmbed()
        .setImage(turnChangeGif[await getIndexInOrder(turnChangeGif.length)])
        msg.reply(text, {embed: embedMessage,})
      }
    }
  }
}

async function deadline(action, date = null) {
  if (action === "set" && date != null) {
    await db.set("deadline", date)
  }
  else if (action === "get"){
    const deadLine = new Date(await db.get("deadline"))
    return deadLine
  }
}

function toHoursNMins(milisecs) {
  let hours = Math.floor(milisecs /  (1000 * 60 * 60));
  let mins = Math.floor((milisecs / (1000 * 60)) % 60);
  return `${hours}h ${mins}m`
}

async function getTimeLeft() {
  const now = new Date()
  let next_deadline = new Date(now)
  const next_deadline_hour = next_deadline.getHours() + TURN_HOURS
  next_deadline.setHours(next_deadline_hour, 0, 0, 0) //Sets deadline to +TURN_HOURS hours, 0 minutes, 0 seconds
  await deadline("set", next_deadline)
  const timeLeft = toHoursNMins(next_deadline - now)
  return timeLeft
}

function getIndex() {
  return db.get("nextPlayerIndx")
}

async function skipTurn(channel) {
  const index = await getIndex()
  const newIndex = (index + 1) % PLAYER_NUM
  await db.set("nextPlayerIndx", newIndex)
  const timeLeft = await getTimeLeft()
  channel.send(`Skipped <@${playerList[index]}>'s turn. It is now <@${playerList[newIndex]}>'s turn. Time remaining: ${timeLeft}`)
}


async function autoWarning() {
  // Warns player of their remaining time
  const deadLine = new Date(await deadline("get"))
  const now = new Date()
  const timeleft = deadLine - now
  const index = await getIndex()
  const player = await playerList[index]
  const channel = await client.channels.fetch(CHANNEL_ID)

  if (timeleft <= 0) {
    let embedMessage = new Discord.MessageEmbed()
    .setImage(await getImage(turnLostGif))
    channel.send(`<@${player}>, your time is up.`, {embed: embedMessage,})
    skipTurn(channel)
  }
  else if (timeleft <= 4000000 && timeleft > 2000000) { // 1 hour remaining
    channel.send(`<@${player}>, you have 1 hour to finish your turn. Hurry up!`)
  }
  else if (timeleft <= 11000000 && timeleft > 9000000) { //3 hours remaining
    channel.send(`<@${player}>, you have 3 hours to finish your turn.`)
  }
  else if (timeleft <= 22000000 && timeleft > 21000000) {// 6 hours remaining
    channel.send(`<@${player}>, you have 6 hours to finish your turn.`)
  }
}

async function getGif() {
  const gifList = await db.get("gifList")
  const randIndex = Math.floor(Math.random() * gifList.length)
  return gifList[randIndex]
}

async function addGif(link) {
  let gifList = await db.get("gifList")
  if (!gifList.includes(link)) {
    gifList.push([link])
    await db.set("gifList", gifList)
  }
}

function getImage(imgList) {
  const randIndex = Math.floor(Math.random() * imgList.length)
  return imgList[randIndex]
}

async function getIndexInOrder(len){
    index = await db.get("gifIndex")
    index = (index + 1) % len
    await db.set("gifIndex", index)
    return index
}

function initStats(){
  let stats = []
  for (const id of playerList){
    let player = {
      id: id,
      wins: 0,
      turnTime: [],
    }
    stats.push(player)
  }
  return stats
}

function average(list){
  let sum = 0
  for (let t of list){
    sum += t
  }
  return parseFloat((sum/list.length).toFixed(1))
}

// BOT STATUS
client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`)
  client.user.setActivity("!turn", {
  type: "WATCHING",
  })
})

// Testing 
/*
client.on("message", msg => {
  if (msg.content === "ping") msg.reply("pong")
})
client.on("message", async function(msg) {
  if (msg.content === "test?") {
    const channel = await client.channels.fetch(channel_id)
    let embedMessage = new Discord.MessageEmbed()
    .setImage("https://media1.tenor.com/images/dce516dd8e762b83e810a0ff9d851ddc/tenor.gif")
    channel.send('This is a normal message.', {embed: embedMessage,}) }
})
*/

// BOT MESSAGE TRACKING
client.on("message", async function(msg) {
  if (msg.attachments.size > 0) {
    checkAttachment(msg)
  }
  if (msg.content === "!skipturn") {
    (msg.author.id == ADMIN_ID) ? skipTurn(msg.channel) : msg.reply("you have no permission to do that.")
  }
  else if (msg.content === "!battle") {
    getIndex().then(index => {
      if (playerList[index] != msg.author.id) msg.reply("it is not your turn.")
      else {
      msg.channel.send(`<@${playerList[index]}> has requested a battle with another player. The defender has 16 hours to accept. Don't forget to also post a screenshot of the troops on both sides for each battle. Type "!battlerules" to review the rules.`)
      }
    })
  }
  else if (msg.content === "!battlerules") {
    msg.channel.send(`  • To request a battle with another player on your turn, type the command "!battle" in the chat, tag them and post screenshots of each battle, showing both armies and the settlement or place they're happening. If there are multiple battles, number the screenshots.
  • The defender has the right to pass on playing any number of the requested battles. Those battles can be played by the attacker vs the computer.
  • The battle(s) must conclude within 16 hours, after which time the attacker is allowed to play the battles vs the computer.
  • In order for a unit to participate in the battle, it must be at at least 1/2 strength. Same units with less than 1/2 strength can be "merged" for the battle. Only General units and artillery are excluded from this rule.
  • Any battles with autoresolve odds of 10:1 or more can be played manually.
  • The result of the battle will be resolved in-game via the auto_win command from the admin, so casualties in the actual battle don't matter. The loser will always get significantly more casualties.
  • Battle requests have priorities over turn time. If your turn time's up while you have requested a battle, you can still complete your turn 1 hour after the 16-hour battle request deadline is over. NOTE: DO NOT ABUSE THIS FOR EXTRA TIME OR THERE WILL BE CONSEQUENCES!
    `)
  }
  else if (msg.content.startsWith("!add")){
    if (msg.author.id == ADMIN_ID) {
      const link = msg.content.split("!add ")[1]
      updateGif(link)
    }
    else msg.reply("you have no permission to do that.")
  }
  else if (msg.content === "!turn" || msg.content === "!time") {
    // Spam prevention
    if (recentCommand.has(msg.content)) {
      msg.reply("please wait 1 minute before using this command again...")
    } else {
      recentCommand.add(msg.content)

      const index = await getIndex()
      const nextDeadline = new Date(await deadline("get"))
      const now = new Date()
      msg.channel.send(`It's <@${playerList[index]}>'s turn. Time remaining: ${toHoursNMins(nextDeadline - now)}`)
      
      setTimeout(() => {recentCommand.delete(msg.content)}, 60000)
    }
  }
  else if (msg.content.startsWith("!declare_winner")){
    if (msg.author.id == ADMIN_ID) {
      let winner_tag = msg.content.split(" ")[1]
      winner_id = winner_tag.substr(2, winner_tag.length - 3)

      let stats = await db.get("playerStats")
      let winner = null
      winner = stats[winner_id]
      // console.log("Winner: ", winner)
      if (winner) { // not undefined
        // console.log("Entered if")
        winner.wins++
        let embedMessage = new Discord.MessageEmbed()
        .setImage("https://i.giphy.com/media/8Iv5lqKwKsZ2g/giphy.gif")
        msg.channel.send(`🏆${winner_tag}🏆 is declared the winner of this campaign. Congratulations!
Current number of wins: ${winner.wins}.`, {embed: embedMessage,})
        await db.set("playerStats", stats)
      }
    }
    else msg.reply("you do not have permission to do that.")
  }
  // TODO?
  // else if (msg.content === "!stats") {
  //   const stats = await db.get("stats")
  //   let embedMessage = new Discord.MessageEmbed()
  //   for (const player of stats){
  //     console.log(player.id, player.wins)
  //     embedMessage.addField(`<@${player.id}>`, `Wins: ${player.wins}}`, true) //\nAverage turn completion time: ${player.avgTurnTime()
  //   }
  //   msg.channel.send(embedMessage)
  // }
})

let job = new cron.CronJob('30 00 * * * *',  async function() { //Runs at X:00:30 every hour
  autoWarning() },
	function() {console.log("Cron job wasn't executed")},
	true,
	'Europe/Athens'
)

keepAlive()
client.login(process.env.TOKEN)

job.start()


// let stats = initStats()
// db.set("stats", stats)

// async function resetAvgTime(){
//   let stats = await db.get("playerStats")
//   for (let player in stats) stats[player].averageTime = [0, 0]
//   await db.set("playerStats", stats)
// }
// resetAvgTime()