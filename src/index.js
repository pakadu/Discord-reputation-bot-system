require('dotenv').config();
const { Client, Intents, IntentsBitField } = require('discord.js');
const mongoose = require('mongoose');
const path = require('path'); // Import the 'path' module

// Construct an absolute path to register-commands.js
const registerCommandsPath = path.join(__dirname, 'register-commands.js');

// Include the register-commands.js script using the absolute path
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
    reason: String, // **Added reason field**
    timestamp: Date,
});

const Log = mongoose.model('Log', logSchema);

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

            // **Log the command with additional information**
            const logEntry = new Log({
                commandName: commandName,
                username: authorUsername,
                amount: amount,
                oldPoints: previousReputation,
                newPoints: user.reputation,
                reason: reason, // **Log the reason**
                timestamp: new Date(),
            });
            await logEntry.save();
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

            interaction.reply(`**Ukupan broj reputacionije <@${targetUser.id}>:** ${user.reputation}`);
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
