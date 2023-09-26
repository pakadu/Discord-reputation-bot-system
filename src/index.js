require('dotenv').config();
const { Client, Intents, IntentsBitField, MessageEmbed } = require('discord.js');
const mongoose = require('mongoose');
const path = require('path');

const registerCommandsPath = path.join(__dirname, 'register-commands.js');
require(registerCommandsPath);

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
});

client.on('ready', (c) => {
    console.log(`🖐🏿 **${c.user.username} je UPPPP**`);
});

const userSchema = new mongoose.Schema({
    userId: String,
    username: String,
    reputation: Number,
});

const User = mongoose.model('User', userSchema);

const logSchema = new mongoose.Schema({
    commandName: String,
    username: String,
    amount: Number,
    oldPoints: Number,
    newPoints: Number,
    reason: String,
    timestamp: Date,
});

const Log = mongoose.model('Log', logSchema);

const peakSchema = new mongoose.Schema({
    userId: String,
    username: String,
    peakReputation: Number,
});

const Peak = mongoose.model('Peak', peakSchema);

client.on('messageCreate', async (message) => {
    if (message.content.startsWith('/rep')) {
        const requestMessageId = message.content.split(' ')[1];

        if (!requestMessageId) {
            message.reply('Please provide a valid message ID.');
            return;
        }

        const requestMessage = await message.channel.messages.fetch(requestMessageId);

        if (!requestMessage) {
            message.reply('Could not find the request message.');
            return;
        }

        if (requestMessage.reactions.cache.size >= 5) {
            const repCommand = `rep ${requestMessage.author.id} 1 YourReasonHere`;
            client.emit('messageCreate', message.replicate({ content: repCommand }));
        } else {
            message.reply('The request message does not have enough reactions.');
        }
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName, options, user } = interaction;

    if (commandName === 'rep' || commandName === 'prep') {
        const targetUser = options.getUser('user');
        const amount = options.getInteger('kolicina');
        const reason = options.getString('razlog');
        const authorUsername = user.username;

        try {
            let user = await User.findOne({ userId: targetUser.id });
            if (!user) {
                user = new User({
                    userId: targetUser.id,
                    username: targetUser.username,
                    reputation: 0,
                });
            }

            const previousReputation = user.reputation;

            if (commandName === 'rep') {
                user.reputation -= amount;
            } else {
                user.reputation += amount;
            }

            await user.save();

            const reputationChange = commandName === 'rep' ? amount * -1 : amount;

            interaction.reply(`**REPUTACIJA  <@${targetUser.id}> razlog:** ${reason}\n${commandName === 'rep' ? '**ODUZETO**' : '**DODATO**'}: ${reputationChange}\n**Trenutna reputacija:** ${user.reputation}`);

            const logEntry = new Log({
                commandName: commandName,
                username: authorUsername,
                amount: amount,
                oldPoints: previousReputation,
                newPoints: user.reputation,
                reason: reason,
                timestamp: new Date(),
            });
            await logEntry.save();

            // Check if the user's reputation is a new peak
            const peak = await Peak.findOne({ userId: targetUser.id });
            if (!peak || user.reputation < peak.peakReputation) {
                const newPeak = new Peak({
                    userId: targetUser.id,
                    username: targetUser.username,
                    peakReputation: user.reputation,
                });
                await newPeak.save();
            }
        } catch (error) {
            console.error(`**Greška prilikom ažuriranja reputacije korisnika:** ${error}`);
            interaction.reply('**Došlo je do greške prilikom ažuriranja reputacije korisnika.**');
        }
    } else if (commandName === 'profile') {
        const targetUser = options.getUser('user');

        try {
            let user = await User.findOne({ userId: targetUser.id });
            if (!user) {
                user = new User({
                    userId: targetUser.id,
                    username: targetUser.username,
                    reputation: 0,
                });
            }

            interaction.reply(`Ukupan broj **REPUTACIJE** <@${targetUser.id}>:** ${user.reputation}**`);
        } catch (error) {
            console.error(`**Greška prilikom prikaza ukupnog broja reputacionih poena:** ${error}`);
            interaction.reply('**Došlo je do greške prilikom prikaza ukupnog broja reputacionih poena.**');
        }
    } else if (commandName === 'leaderboard') {
        try {
            const users = await User.find({ reputation: { $ne: 0 } }).sort({ reputation: 1 });
    
            const leaderboardEmbed = {
                title: '**Leaderboard**',
                fields: users.map((user, index) => ({
                    name: `#${index + 1} ${user.username}`,
                    value: `**Reputacija:** ${user.reputation}`,
                })),
            };
    
            interaction.reply({ embeds: [leaderboardEmbed] });
        } catch (error) {
            console.error(`**Greška prilikom prikaza leaderboard** ${error}`);
            interaction.reply('**Došlo je do greške prilikom prikaza leaderboard-a.**');
        }
    
    } else if (commandName === 'peak') {
        try {
            // Find the user with the lowest peak reputation
            const lowestPeakUser = await Peak.findOne({}, {}, { sort: { 'peakReputation': 1 } });

            if (!lowestPeakUser) {
                interaction.reply('ERROR');
            } else {
                interaction.reply(`NAJGORI MLS CLAN :speaking_head:  <@${lowestPeakUser.userId}> SA REPUTACIJOM: **${lowestPeakUser.peakReputation}**`);
            }
        } catch (error) {
            console.error(`Error retrieving the lowest peak reputation user: ${error}`);
            interaction.reply('An error occurred while retrieving the lowest peak reputation user.');
        }
    }
});

(async () => {
    try {
        mongoose.set('strictQuery', false);
        await mongoose.connect(process.env.MONGODB_URI, {});
        console.log('**Connected to DB.**');

        client.login(process.env.TOKEN);
    } catch (error) {
        console.log(`**Error:** ${error}`);
    }
})();
