"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_module_loader_1 = require("discord-module-loader");
exports.default = new discord_module_loader_1.DiscordCommand({
    command: {
        name: 'ping',
        description: 'Отвечает с Pong!',
    },
    execute: async (interaction) => {
        await interaction.reply('Понг!');
    },
});
