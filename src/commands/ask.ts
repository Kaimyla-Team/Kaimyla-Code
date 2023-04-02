import { DiscordCommand } from 'discord-module-loader';
import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
} from 'discord.js';

import { getChatResponse } from '@/lib/openai';

export default new DiscordCommand({
  command: {
    name: 'ask',
    description: 'Спросите что-нибудь у Kaimyla!',
    options: [
      {
        type: ApplicationCommandOptionType.String,
        name: 'message',
        description: 'Сообщение для бота.',
        required: true,
      },
    ],
  },
  execute: async (interaction: ChatInputCommandInteraction) => {
    const message = interaction.options.getString('message');

    if (!message || message.length === 0) {
      await interaction.reply({
        content: 'Вы должны что-то спросить у Kaimyla чтобы начать разговор!',
        ephemeral: true,
      });

      return;
    }

    await interaction.deferReply();

    try {
      const response = await getChatResponse([
        { role: 'user', content: message },
      ]);

      await interaction.editReply(response);
    } catch (err) {
      if (err instanceof Error) {
        await interaction.editReply(err.message);
      }
    }
  },
});
