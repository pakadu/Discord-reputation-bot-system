require('dotenv').config();
const { REST, Routes,ApplicationCommandOptionType } = require('discord.js');

const commands = [
  {
    name: 'rep',
    description: 'Dodeljuje negativne reputacione poene korisniku.',
    options: [
      {
        name: 'user',
        description: 'Korisnik kome se dodeljuju negativni reputacioni poeni.',
        type: 6, // USER
        required: true,
      },
      {
        name: 'kolicina',
        description: 'Iznos negativnih reputacionih poena (1-5).',
        type: 4, // NUMBER
        required: true,
        choices: [
          {
            name: '-1',
            value: 1,
          },
          {
            name: '-2',
            value: 2,
          },
          {
            name: '-3',
            value: 3,
          },
          {
            name: '-4',
            value: 4,
          },
          {
            name: '-5',
            value: 5,
          },
        ],
      },
      {
        name: 'razlog',
        description: 'Razlog dodele negativnih reputacionih poena.',
        type: 3, // STRING
        required: true,
      },
    ],
  },
  {
    name: 'prep',
    description: 'Dodeljuje pozitivne reputacione poene korisniku.',
    options: [
      {
        name: 'user',
        description: 'Korisnik kome se dodeljuju pozitivni reputacioni poeni.',
        type: 6, // USER
        required: true,
      },
      {
        name: 'kolicina',
        description: 'Iznos pozitivnih reputacionih poena (1-3).',
        type: 4, // NUMBER
        required: true,
        choices: [
          {
            name: '+1',
            value: 1,
          },
          {
            name: '+2',
            value: 2,
          },
          {
            name: '+3',
            value: 3,
          },
        ],
      },
      {
        name: 'razlog',
        description: 'Razlog dodele pozitivnih reputacionih poena.',
        type: 3, // STRING
        required: true,
      },
    ],
  },
  
  {
    name: 'leaderboard',
    description: 'Prikazuje najgoreg MLS membera',
    
  },
  {
    name: 'peak',
    description: 'PEAK NAJGOREG MLS MEMBERA ALLTIME',
  },
  {
    name: 'help',
    description: 'Prikazuje kako si glup',
  },
  {
    name: 'profile',
    description: 'PROVERI xxxxx',
    options:[
    {
      name: 'user',
      description: 'xxxx',
      type: 6, // USER
      required: true,
    },
  ]
  },
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Registruju se slash komande...');

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log('Slash komande su uspešno registrovane!');
  } catch (error) {
    console.error(`Došlo je do greške: ${error.message}`);
  }
})();
