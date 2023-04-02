"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTextFlagged = exports.getModeratedChatMessages = exports.getChatResponse = void 0;
const tslib_1 = require("tslib");
const gpt_3_encoder_1 = require("gpt-3-encoder");
const openai_1 = require("openai");
const config_1 = tslib_1.__importDefault(require("../config"));
const configuration = new openai_1.Configuration({ apiKey: config_1.default.openai.api_key });
const openai = new openai_1.OpenAIApi(configuration);
async function getChatResponse(messages) {
    const latestMessage = messages.pop();
    if (await isTextFlagged(latestMessage.content)) {
        throw new Error('Ваше сообщение заблокировано модерацией.');
    }
    const chatMessages = [
        {
            role: 'system',
            content: config_1.default.bot.instructions,
        },
        ...(await getModeratedChatMessages(messages)),
        latestMessage,
    ];
    const input = chatMessages.map((message) => message.content).join('\n');
    if ((0, gpt_3_encoder_1.encode)(input).length > config_1.default.openai.max_tokens) {
        throw new Error('Запрос превысил лимит токенов! Попробуйте еще раз с более коротким сообщением или начните другой разговор с помощью команды `/chat`.');
    }
    try {
        const completion = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: chatMessages,
            temperature: config_1.default.openai.temperature,
            top_p: config_1.default.openai.top_p,
            frequency_penalty: config_1.default.openai.frequency_penalty,
            presence_penalty: config_1.default.openai.presence_penalty,
            max_tokens: config_1.default.openai.max_tokens,
        });
        const message = completion.data.choices[0].message;
        if (message) {
            return message.content;
        }
    }
    catch (err) {
        console.error(err);
    }
    throw new Error('При обработке ответа произошла ошибка.');
}
exports.getChatResponse = getChatResponse;
async function getModeratedChatMessages(messages) {
    const moderatedMessages = [];
    if (messages.length === 0) {
        return moderatedMessages;
    }
    const moderation = await openai.createModeration({
        input: messages.map((message) => message.role === 'user' ? message.content : ''),
    });
    moderation.data.results.forEach((result, index) => {
        const message = messages[index];
        if (message.role === 'user' && result.flagged) {
            return;
        }
        if (message.role === 'assistant' &&
            message.content === 'Ваше сообщение заблокировано модерацией.') {
            return;
        }
        moderatedMessages.push(message);
    });
    return moderatedMessages;
}
exports.getModeratedChatMessages = getModeratedChatMessages;
async function isTextFlagged(input) {
    try {
        const moderation = await openai.createModeration({
            input,
        });
        return moderation.data.results[0].flagged;
    }
    catch (err) {
        console.error(err);
    }
    return false;
}
exports.isTextFlagged = isTextFlagged;
