  //recuperation requete du channel et traitement ligne de commandes

const {exec} = require('child_process');
const { error } = require('console');
const { stderr } = require('process');

function slashCommands(message) {
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
        message.reply(`ok`);
      });
    }
