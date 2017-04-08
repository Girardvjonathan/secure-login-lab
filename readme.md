# Laboratoire #5 du cours GTI-619 - Équipe 4A
Code basé sur un tutoriel. Repo accessible ici:
https://github.com/bradtraversy/loginapp

## Prérequis
Avoir nodejs d'installé et avoir une connexion internet active. **Le serveur ne fonctionne pas correctement lorsque l'ordinateur hôte est connecté sur le réseau wifi privé de l'ÉTS**.

## Procédure d'installation
1. Cloner le projet.
2. Télécharger les certificats SSL du serveur à cet endroit : https://drive.google.com/open?id=0B_Qy_iFC7cj3SkNVRHpSM09oYzA.
3. Dézipper l'archive de certificats SSL à la racine du répertoire du projet.
2. Lancer la commande `npm install` afin d'installer les packages node nécessaires.
3. À la racine du dossier, lancer la commande `npm start`.
4. Dans un navigateur, aller à l'adresse suivante : https://localhost:3000.

## Liste des utilisateurs
Rôle | Username | Password | Email
--- | --- | --- | ---
Administrateur | admin1 | admin1 | admin1@mailinator.com
Administrateur | admin2 | admin2 | admin2@mailinator.com
Préposé aux clients résidentiels | Utilisateur1 | Utilisateur1 | Utilisateur1@mailinator.com
Préposé aux clients d'affaires | Utilisateur2 | Utilisateur2 | Utilisateur2@mailinator.com

## Consulter la base de données
Aller sur le site de [mLab](https://mlab.com/) avec ces identifiants : 
- user: gti619
- password: gti619

## Remarque sur le two-factor authentication
Le service [Twilio](https://www.twilio.com/) a été utilisé afin d'envoyer les codes de vérification par SMS. Toutefois, il s'agit d'un compte d'essai et les numéros de téléphone destinataires des messages SMS doivent être manuellement entrés dans la liste de numéros de téléphone vérifiés. Cette opération peut se faire à cette adresse : https://www.twilio.com/console/phone-numbers/verified. Cette mesure a été adoptée par Twilio afin que les gens ne se créent pas des comptes d'essai dans l'unique but d'envoyer du spam.

Les informations pour se connecter au compte Twilio sont les suivantes : 
- user: gti619.loginapp@gmail.com
- password: 619gtigti619gti619
