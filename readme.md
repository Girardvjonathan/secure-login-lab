WIP

Code basé sur un tuto. Repo accessible ici:
https://github.com/bradtraversy/loginapp

Gestion de session utiliser JWT - json web token
proteger lors de la communication == https?


Protection contre bruteforce - lock ou timeout

Si framework possible utiliser passport



# Features a faire

## Protocole de communication et d’échange d’information.
 Ask question about that (https?)
 essayer https ou sinon cryptage genre btoa ou plus pousser

## Protection Bruteforce
http://stackoverflow.com/questions/19690950/preventing-brute-force-using-node-and-express-js

## Posibilité de changer de mdp
Reinitialiser le mdp -- poser question pourquoi parametrable
-- Jai sa dans un autre projet -- https://github.com/Girardvjonathan/Potatowl


## Une politique de mot de passe configurable

Regex pour strategie de validation de mdp, car the following est parametrable:

Longueur 10 char minimum max 128
Une maj et une miniscule
un caractere special (" !"#$%&'()*+,-./:;<=>?@[\]^_`{|}~") - owasp
ou un chiffre
--not more than 2 identical characters in a row (e.g., 111 not allowed) -- non necessaire mais parler dans rapport
-https://www.owasp.org/index.php/Authentication_Cheat_Sheet

## Stocker mdp de manière sécuritaire
Ajouter colonne pour le salt et la fonction de hashage
-- voir si on peut changer la fonction de hashage avec bcryptjs sinon pt changer ?!

## Journalisation des connexions, des changements reliés à la sécurité.
Ajouter model log et creer de nouvelle entree lors du login et autres changement de securiter


## Réauthentification pour certaines fonctions critiques.
Demander si il faut en faire plusieurs ?
Faire les deux marquer au minimum

flag authentifier pour faire changement important (delete session , relog, peut faire action car flag)

## Protection de l’identifiant de session
poser question a propos de pas pouvoir voler le cookies js
• Utiliser les attributs « secure » et « HttpOnly »
voir le document du cour -- https://cours.etsmtl.ca/gti619/ doc gestion de session

## Délais d’inactivité (a verifier!)
avec express ou passport (pt que passport le fait par defaut)
http://stackoverflow.com/questions/17991050/how-to-set-the-session-timeout-after-log-in-passportjs


## Stockage sécurisé des informations de la session (côté serveur)
vérifier comment sa fonctionne avec 'express-session'



# Feature fini

* nada

