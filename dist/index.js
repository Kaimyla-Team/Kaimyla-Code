"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const discord_module_loader_1 = tslib_1.__importDefault(require("discord-module-loader"));
const discord_js_1 = require("discord.js");
const path_1 = tslib_1.__importDefault(require("path"));
const sequelize_1 = require("sequelize");
const toad_scheduler_1 = require("toad-scheduler");
const config_1 = tslib_1.__importDefault(require("./config"));
const express = require('express')
const app = express();
const port = 6969

app.get('/', (req, res) => res.send('Odd is better.'))

app.listen(port, () =>
console.log(`Your app is listening a http://localhost:${port}`)
);
const sequelize_2 = tslib_1.__importDefault(require("./lib/sequelize"));
const conversation_1 = tslib_1.__importDefault(require("./models/conversation"));
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.DirectMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
    ],
    partials: [discord_js_1.Partials.Channel],
});
const moduleLoader = new discord_module_loader_1.default(client);
const scheduler = new toad_scheduler_1.ToadScheduler();
client.on('ready', async () => {
    if (!client.user || !client.application) {
        return;
    }
    try {
        await sequelize_2.default.authenticate();
        await conversation_1.default.sync();
    }
    catch (err) {
        console.error('Unable to connect to the database:', err);
        process.exit(1);
    }
    try {
        const isTsNode = process.argv[0].includes('ts-node');
        if (isTsNode) {
            require('./load-modules');
        }
        const modulesDir = isTsNode ? '.ts-node' : 'dist';
        const commandsPath = path_1.default.join(__dirname, `../${modulesDir}`, 'commands');
        const eventsPath = path_1.default.join(__dirname, `../${modulesDir}`, 'events');
        await moduleLoader.loadCommands(commandsPath);
        await moduleLoader.loadEvents(eventsPath);
        await moduleLoader.updateSlashCommands();
    }
    catch (err) {
        console.error(err);
        process.exit(1);
    }
    const task = new toad_scheduler_1.AsyncTask('prune-conversations', async () => {
        try {
            const conversations = await conversation_1.default.findAll({
                where: {
                    expiresAt: {
                        [sequelize_1.Op.ne]: null,
                        [sequelize_1.Op.lt]: new Date(),
                    },
                },
            });
            for (const conversation of conversations) {
                const thread = (await client.channels.cache.get(conversation.get('threadId')));
                if (thread) {
                    const interaction = await thread.parent?.messages.fetch(conversation.get('interactionId'));
                    if (interaction && interaction.embeds.length > 0) {
                        const embed = interaction.embeds[0];
                        await interaction?.edit({
                            embeds: [
                                new discord_js_1.EmbedBuilder()
                                    .setColor(discord_js_1.Colors.Yellow)
                                    .setTitle('Conversation deleted due to inactivity.')
                                    .setDescription(embed.description)
                                    .addFields(embed.fields),
                            ],
                        });
                    }
                    await (await thread.fetchStarterMessage())?.delete();
                    await thread.delete();
                }
                await conversation.destroy();
            }
            if (conversations.length > 0) {
                console.log(`Pruned ${conversations.length} expired conversations.`);
            }
        }
        catch (err) {
            console.error(err);
        }
    }, (err) => {
        console.error(err);
    });
    const job = new toad_scheduler_1.SimpleIntervalJob({
        minutes: 1,
        runImmediately: true,
    }, task);
    scheduler.addSimpleIntervalJob(job);
    console.log(`Logged in as ${client.user.tag}!`);
    console.log(`You can invite this bot with the following URL: ${config_1.default.bot.invite_url}\n`);
});
client.login(config_1.default.discord.token);
