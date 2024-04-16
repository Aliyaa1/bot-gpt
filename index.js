// importe le module dotenv et le configure pour charger les variables d'environnement depuis .env
require('dotenv').config();

// importe les modules Discord.js/OpenAI
const { Client, IntentsBitField } = require('discord.js');
const OpenAI = require('openai');

// crée une instance de l'API OpenAI en utilisant la clé d'API stockée dans les var d'environnement
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// créer une instance du client Discord
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    // IntentsBitField.Flags.Guilds: cette intention indique que le bot souhaite recevoir des événements liés aux serveurs (guilds) auxquels il est connecté. ca inclut des events tels que la création ou la suppression de serveurs
    IntentsBitField.Flags.GuildMessages,
    // cette intention indique que le bot souhaite recevoir des events liés aux msg dans les serveurs auxquels il est connecte. ca inclut des events tels que la réception de nouveaux msg, la modif de msg existant...
    IntentsBitField.Flags.MessageContent,
    // cette intention indique que le bot souhaite accéder au contenu des msg. ca signifie qu'il souhaite recevoir des informations sur le texte contenu dans les msg,essentiel pour la fonctionnalité de réponse 
  ],
});

// evnts déclenché lorsque le bot est prêt
client.on('ready', () => {
  console.log('Le Bot est en ligne');
});
// importation de la bibliotheque child_process pour exec des commandes systeme
const {exec} = require('child_process');
const { error } = require('console');
const { stdout, stderr } = require('process');

// event déclenché lorsqu'un msg est envoyé dans un serveur discord
client.on('messageCreate', async (message) => {
  // verif si l'auteur du message est un bot /si le canal n'est pas celui spécifié dans les variables d'environnement ou si le msg commence par '!'
  if (message.author.bot || message.channel.id !== process.env.CHANNEL_ID || message.content.startsWith('!')) {
    return;
  }

  // initialiser un journal de conv avec un msg système
  let conversationLog = [{ role: 'system', content: 'You are a friendly chatbot.' }];

  try {
    // indique que le bot est en train d'écrire 
       await message.channel.sendTyping();

    // recup les 15 messages précédents dans le canal
    const prevMessages = await message.channel.messages.fetch({ limit: 15 });

    // inverse l'ordre des msg pour commencer par le plus ancien
    prevMessages.reverse().forEach((msg) => {
      // ignore les messages commençant par '!' ou les messages d'autres bots 
      if (msg.content.startsWith('!') || (msg.author.bot && msg.author.id !== client.user.id)) {
        return;
      }

      // determine le rôle (user ou assistant(=bot)) du message et nettoie le nom d'utilisateur
      const role = msg.author.id === client.user.id ? 'assistant' : 'user';
      const name = msg.author.username.replace(/\s+/g, '_').replace(/[^\w\s]/gi, '');

      // ajoute le msg au journal de conversation(avec role, contenu, et nom user)
      conversationLog.push({ role, content: msg.content, name });
    });

    // genere reponse en envoyant journal de conv a API openai
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5',
      messages: conversationLog
    });

    // envoi la première reponse générée en réponse au message (si il y a reponse)
    if (completion.choices.length > 0 && completion.choices[0].message) {
      await message.reply(completion.choices[0].message);
    }
  } catch (error) {
    // catch les erreurs en affichant un msg d'erreur dans la console
    console.error(`Error: ${error.message}`);
  }

  //recuperation requete du channel et traitement ligne de commandes
if(message.content.startsWith('/')){
  const commande = message.content.slice('/'.length).trim();

  exec(commande, (error, stdout, stderr)=> {
    if(error) {
      //error envoyé dans console
      console.error(`Erreur d'exécution de la commande: ${error.message}`);
      //error envoyé dans channel 
    message.reply(`Erreur d'exécution de la commande: ${error.message}`);
    return;
    }
    if (stderr){
      console.error(`Erreur d'exécution de la commande : ${stderr}`);
      message.reply(`Erreur d'exécution de la commande: ${stderr}`);
      return;
    }
    console.log(`Résultat : ${stdout}`);
    message.reply(`Résultat : ${stdout}`);
  });

}
});

// connecte le bot en utilisant le token
client.login(process.env.TOKEN);