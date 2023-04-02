import { DiscordCommand } from 'discord-module-loader';
import { ChatInputCommandInteraction } from 'discord.js';

export default new DiscordCommand({
  command: {
    name: 'ping',
    description: 'Ответы с Понг!',
  },
  execute: async (interaction: ChatInputCommandInteraction) => {
    await interaction.reply('Понг!');
  },
});
