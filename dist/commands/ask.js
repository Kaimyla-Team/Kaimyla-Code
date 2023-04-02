"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_module_loader_1 = require("discord-module-loader");
const discord_js_1 = require("discord.js");
const openai_1 = require("../lib/openai");
exports.default = new discord_module_loader_1.DiscordCommand({
    command: {
        name: 'ask',
        description: 'Спросите что-нибудь у Kaimyla!',
        options: [
            {
                type: discord_js_1.ApplicationCommandOptionType.String,
                name: 'message',
                description: 'Сообщение, которое нужно сказать боту.',
                required: true,
            },
        ],
    },
    execute: async (interaction) => {
        const message = interaction.options.getString('message');
        if (!message || message.length === 0) {
            await interaction.reply({
                content: 'Вы должны спросить что-то у Kaimyla чтобы начать разговор!',
                ephemeral: true,
            });
            return;
        }
        await interaction.deferReply();
        try {
            const response = await (0, openai_1.getChatResponse)([
                { role: 'user', content: message },
            ]);
            await interaction.editReply(response);
        }
        catch (err) {
            if (err instanceof Error) {
                await interaction.editReply(err.message);
            }
        }
    },
});
