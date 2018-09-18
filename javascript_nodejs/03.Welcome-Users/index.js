// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
 
const path = require('path');
const restify = require('restify');

const CONFIG_ERROR = 1;

// Import required bot services. See https://aka.ms/bot-services to learn more about the different parts of a bot.
const { BotFrameworkAdapter, MemoryStorage, ConversationState, UserState } = require('botbuilder');
// Import required bot configuration.
const { BotConfiguration } = require('botframework-config');

// This bot's main dialog.
const MainDialog = require('./dialogs/mainDialog');

// Read botFilePath and botFileSecret from .env file.
// Note: Ensure you have a .env file and include botFilePath and botFileSecret.
const ENV_FILE = path.join(__dirname, '.env');
const env = require('dotenv').config({path: ENV_FILE});

// .bot file path
const BOT_FILE = path.join(__dirname, (process.env.botFilePath || ''));
// Read bot configuration from .bot file. 
let botConfig;
try {
    botConfig = BotConfiguration.loadSync(BOT_FILE, process.env.botFileSecret);
} catch (err) {
    console.log(`Error reading bot file. Please ensure you have valid botFilePath and botFileSecret set for your environment`);
    process.exit(CONFIG_ERROR);
}

// Bot configuration section in the .bot file.
// See https://aka.ms/about-bot-file to learn more about .bot file its use and bot configuration.
const BOT_CONFIGURATION = 'Welcome-User-bot';

// Get bot endpoint configuration by service name.
const endpointConfig = botConfig.findServiceByNameOrId(BOT_CONFIGURATION);

// Create adapter. See https://aka.ms/about-bot-adapter to learn more about .bot file its use and bot configuration.
const adapter = new BotFrameworkAdapter({
    appId: endpointConfig.appId || process.env.microsoftAppID,
    appPassword: endpointConfig.appPassword || process.env.microsoftAppPassword
});

// Define state store for your bot. See https://aka.ms/about-bot-state to learn more about bot state.
const memoryStorage = new MemoryStorage();

// CAUTION: The Memory Storage used here is for local bot debugging only. When the bot
// is restarted, anything stored in memory will be gone. 
// For production bots use Azure CosmosDB storage or Azure Blob storage providers. 
// const { CosmosDbStorage } = require('botbuilder-azure');
// const STORAGE_CONFIGURATION = 'CosmosDB'; 
// const cosmosConfig = botConfig.findServiceByNameOrId(STORAGE_CONFIGURATION);
// const cosmosStorage = new CosmosDbStorage({serviceEndpoint: cosmosConfig.connectionString, 
//                                            authKey: ?, 
//                                            databaseId: cosmosConfig.database, 
//                                            collectionId: cosmosConfig.collection});
// const STORAGE_CONFIGURATION = 'BlogStore'; 
// const blobStorageSettings = botConfig.findServiceByNameOrId(STORAGE_CONFIGURATION);
// const blobStorage = new blobStorage({containerName : blobStorageSettings.containerName,
//                                     storageAccountOrConnectionString: blobStorageSettings.storageAccountOrConnectionString});


// Create user state with in-memory storage provider. 
const userState = new UserState(memoryStorage);

// Register user state as a middleware. 
adapter.use(userState);

// Create the main dialog.
const mainDlg = new MainDialog(userState);

// Create HTTP server
let server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log(`\n${server.name} listening to ${server.url}`);
    console.log(`\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator`);
    console.log(`\nTo talk to your bot, open Welcome-User.bot file in the Emulator`);
});

// Listen for incoming requests.
server.post('/api/messages', (req, res) => {
    adapter.processActivity(req, res, async (context) => {
        // Route to main dialog.
        await mainDlg.onTurn(context);        
    });
});