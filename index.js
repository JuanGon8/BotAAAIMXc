const Discord = require("discord.js");
const { Client, Util } = require("discord.js");
const YouTube = require("simple-youtube-api");
const ytdl = require("ytdl-core");
const dotenv = require("dotenv").config();
require("./server.js");

const TOKEN = process.env.BOT_TOKEN;
const PREFIX = process.env.PREFIX;
const GOOGLE_API_KEY = process.env.YTAPI_KEY;

const bot = new Client({
    disableMentions: "all"
});

const youtube = new YouTube(GOOGLE_API_KEY);
const queue = new Map();

bot.on("warn", console.warn);
bot.on("error", console.error);
bot.on("ready", () => console.log(`${bot.user.tag} ¡bot preparado!`));
bot.on("shardDisconnect", (event, id) => console.log(`Shard ${id} desconectado (${event.code}) ${event}, intentando reconectar`));
bot.on("shardReconnecting", (id) => console.log(`Shard ${id} reconectando...`));

bot.on("message", async (msg) => { // eslint-disable-line
    if (msg.author.bot) return;
    if (!msg.content.startsWith(PREFIX)) return;

    const args = msg.content.split(" ");
    const searchString = args.slice(1).join(" ");
    const url = args[1] ? args[1].replace(/<(.+)>/g, "$1") : "";
    const serverQueue = queue.get(msg.guild.id);

    let command = msg.content.toLowerCase().split(" ")[0];
    command = command.slice(PREFIX.length);

    if (command === "ayuda" || command == "help") {
        const helpembed = new Discord.MessageEmbed()
          .setThumbnail('https://imgur.com/RiY2UEL.png')
            .setColor("#5d0580")
            .setTitle('🧐Lista de comandos💡')
            .setDescription(`


> \`play / p\` > **\`play / p [título o URL]\`**
> \`buscar / sc \` > **\`buscar / sc [título]\`**
> \`skip / saltar\`
> \`stop / parar \`  
> \`resume / reanudar\`
> \`renow / np\` 
> \`cola / queue\` 
> \`volumen / vol\`
> \`loop \` `)
        
.setFooter("©️ 2020 AAAIMX Development", "https://imgur.com/LlC98uo.jpg");
        msg.channel.send(helpembed);
    }
    if (command === "play" || command === "p") {
        const voiceChannel = msg.member.voice.channel;
        if (!voiceChannel) return msg.channel.send("Lo siento, pero debes estar en un canal de voz para reproducir canciones 😅");
        const permissions = voiceChannel.permissionsFor(msg.client.user);
        if (!permissions.has("CONNECT")) {
            return msg.channel.send("Lo siento, pero necesito el permiso *CONNECT* para hacer eso 🤨");
        }
        if (!permissions.has("SPEAK")) {
            return msg.channel.send("Lo siento, pero necesito el permiso *SPEAK* para hacer eso 🤨");
        }
        if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
            const playlist = await youtube.getPlaylist(url);
            const videos = await playlist.getVideos();
            for (const video of Object.values(videos)) {
                const video2 = await youtube.getVideoByID(video.id); // eslint-disable-line no-await-in-loop
                await handleVideo(video2, msg, voiceChannel, true); // eslint-disable-line no-await-in-loop
            }
            return msg.channel.send(`✅ **|**  Playlist: **\`${playlist.title}\`** ¡ha sido agregada a la cola! 😉`);
        } else {
            try {
                var video = await youtube.getVideo(url);
            } catch (error) {
                try {
                    var videos = await youtube.searchVideos(searchString, 10);
                    var video = await youtube.getVideoByID(videos[0].id);
                    if (!video) return msg.channel.send("Lo siento, pero creo que eso no existe 😓");
                } catch (err) {
                    console.error(err);
                    return msg.channel.send("Lo siento, pero creo que eso no existe 😓");
                }
            }
            return handleVideo(video, msg, voiceChannel);
        }
    }
    if (command === "buscar" || command === "sc") {
        const voiceChannel = msg.member.voice.channel;
        if (!voiceChannel) return msg.channel.send("Lo siento, pero debes estar en un canal de voz para reproducir canciones 😅");
        const permissions = voiceChannel.permissionsFor(msg.client.user);
        if (!permissions.has("CONNECT")) {
            return msg.channel.send("Lo siento, pero necesito el permiso *CONNECT* para hacer eso 🤨");
        }
        if (!permissions.has("SPEAK")) {
            return msg.channel.send("Lo siento, pero necesito el permiso *SPEAK* para hacer eso 🤨");
        }
        if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
            const playlist = await youtube.getPlaylist(url);
            const videos = await playlist.getVideos();
            for (const video of Object.values(videos)) {
                const video2 = await youtube.getVideoByID(video.id); // eslint-disable-line no-await-in-loop
                await handleVideo(video2, msg, voiceChannel, true); // eslint-disable-line no-await-in-loop
            }
            return msg.channel.send(`✅ **|**  Playlist: **\`${playlist.title}\`** ha sido agregada a la cola! 😉`);
        } else {
            try {
                var video = await youtube.getVideo(url);
            } catch (error) {
                try {
                    var videos = await youtube.searchVideos(searchString, 10);
                    let index = 0;
                    msg.channel.send(`

__**Selecciona una canción**__

${videos.map(video2 => `**\`${++index}\`  |**  ${video2.title}`).join("\n")}

Escribe un número del 1 al 10 para sleccionar la canción que desees.
					`);
                  
                    // eslint-disable-next-line max-depth
                    try {
                        var response = await msg.channel.awaitMessages(msg2 => msg2.content > 0 && msg2.content < 11, {
                            max: 1,
                            time: 10000,
                            errors: ["time"]
                        });
                    } catch (err) {
                        console.error(err);
                        return msg.channel.send("Creo que no has seleccionado nada, cancelaremos ésta búsqueda 😶");
                    }
                    const videoIndex = parseInt(response.first().content);
                    var video = await youtube.getVideoByID(videos[videoIndex - 1].id);
                } catch (err) {
                    console.error(err);
                    return msg.channel.send("Lo siento, pero creo que eso no existe 😓");
                }
            }
            return handleVideo(video, msg, voiceChannel);
        }

    } else if (command === "skip" || command === "saltar") {
        if (!msg.member.voice.channel) return msg.channel.send("Lo siento, pero debes estar en un canal de voz para reproducir canciones 😅");
        if (!serverQueue) return msg.channel.send("No hay nada que pueda saltar, que raro 🤔");
        serverQueue.connection.dispatcher.end("¡Se ha saltado la canción!");
        return msg.channel.send("⏭️  **|**  ¡Se ha saltado la canción!");

    } else if (command === "stop" || command === "parar") {
        if (!msg.member.voice.channel) return msg.channel.send("Lo siento, pero debes estar en un canal de voz para reproducir canciones 😅");
        if (!serverQueue) return msg.channel.send("No hay ninguna canción que pueda parar, que raro 🤔");
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end("¡Se ha parado la canción!");
        return msg.channel.send("⏹️  **|**  ¡Se ha parado la canción!");

    } else if (command === "volumen" || command === "vol") {
        if (!msg.member.voice.channel) return msg.channel.send("Lo siento, pero debes estar en un canal de voz para reproducir canciones 😅");
        if (!serverQueue) return msg.channel.send("No hay nada para reproducir 😐");
        if (!args[1]) return msg.channel.send(`The current volume is: **\`${serverQueue.volume}%\`**`);
        if (isNaN(args[1]) || args[1] > 100) return msg.channel.send("El volumen debe estar entre 1 y 100 😅");
        serverQueue.volume = args[1];
        serverQueue.connection.dispatcher.setVolume(args[1] / 100);
        return msg.channel.send(`He puesto el volumen en: **\`${args[1]}%\`**`);

    } else if (command === "renow" || command === "np") {
        if (!serverQueue) return msg.channel.send("No se está reproduciendo nada 🤔");
        return msg.channel.send(`🎶  **|**  Reproduciendo ahora: **\`${serverQueue.songs[0].title}\`**`);

    } else if (command === "cola" || command === "queue") {
        if (!serverQueue) return msg.channel.send("No hay nada en la cola 😶");
        return msg.channel.send(`
__**Cola**__

${serverQueue.songs.map(song => `**-** ${song.title}`).join("\n")}

**Reproduciendo ahora \`${serverQueue.songs[0].title}\`**
        `);

    } else if (command === "pause" || command === "pausa") {
        if (serverQueue && serverQueue.playing) {
            serverQueue.playing = false;
            serverQueue.connection.dispatcher.pause();
            return msg.channel.send("⏸  **|**  ¡Se ha pausado la canción!");
        }
        return msg.channel.send("No hay nada que reproducir 🤨");

    } else if (command === "resume" || command === 'reanudar') {
        if (serverQueue && !serverQueue.playing) {
            serverQueue.playing = true;
            serverQueue.connection.dispatcher.resume();
            return msg.channel.send("▶  **|**  ¡Reanudando tu canción! ");
        }
        return msg.channel.send("No hay nada que reproducir 🙃");
    } else if (command === "loop") {
        if (serverQueue) {
            serverQueue.loop = !serverQueue.loop;
            return msg.channel.send(` 🔁**|** Repetición: ${serverQueue.loop === true ? "Activada" : "Desactivada"}!`);
        };
        return msg.channel.send("No hay nada que reproducir...");
    }
});

async function handleVideo(video, msg, voiceChannel, playlist = false) {
    const serverQueue = queue.get(msg.guild.id);
    const song = {
        id: video.id,
        title: Util.escapeMarkdown(video.title),
        url: `https://www.youtube.com/watch?v=${video.id}`
    };
    if (!serverQueue) {
        const queueConstruct = {
            textChannel: msg.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 100,
            playing: true,
            loop: false
        };
        queue.set(msg.guild.id, queueConstruct);

        queueConstruct.songs.push(song);

        try {
            var connection = await voiceChannel.join();
            queueConstruct.connection = connection;
            play(msg.guild, queueConstruct.songs[0]);
        } catch (error) {
            console.error(`NO he podido ingresar al canal de voz: ${error}`);
            queue.delete(msg.guild.id);
            return msg.channel.send(`NO he podido ingresar al canal de voz: **\`${error}\`**`);
        }
    } else {
        serverQueue.songs.push(song);
        if (playlist) return;
        else return msg.channel.send(`🔢 **|** **\`${song.title}\`** ¡ha sido agregada a la cola!`);
    }
    return;
}

function play(guild, song) {
    const serverQueue = queue.get(guild.id);

    if (!song) {
        serverQueue.voiceChannel.leave();
        return queue.delete(guild.id);
    }

    const dispatcher = serverQueue.connection.play(ytdl(song.url))
        .on("finish", () => {
            const shiffed = serverQueue.songs.shift();
            if (serverQueue.loop === true) {
                serverQueue.songs.push(shiffed);
            };
            play(guild, serverQueue.songs[0]);
        })
        .on("error", error => console.error(error));
    dispatcher.setVolume(serverQueue.volume / 100);

    serverQueue.textChannel.send({
        embed: {
            color: "RANDOM",
            description: `🎶  **|**  Reproduciendo ahora: **\`${song.title}\`**`
        }
    });
}

bot.login(TOKEN);
