WIP

Code basé sur un tuto. Repo accessible ici:
https://github.com/bradtraversy/loginapp

Gestion de session utiliser JWT - json web token
proteger lors de la communication == https?


Protection contre bruteforce - lock ou timeout

Si framework possible utiliser passport



# Features a faire

## Protocole de communication et d’échange d’information.

## Protection Bruteforce

## Posibilité de changer de mdp (périodique ?)

## Une politique de mot de passe configurable

Longueur 10 char minimum max 128
Une maj et une miniscule
un caractere special (" !"#$%&'()*+,-./:;<=>?@[\]^_`{|}~") - owasp
ou un chiffre
--not more than 2 identical characters in a row (e.g., 111 not allowed) -- non necessaire mais parler dans rapport
-https://www.owasp.org/index.php/Authentication_Cheat_Sheet


## Journalisation des connexions, des changements reliés à la sécurité.

## Réauthentification pour certaines fonctions critiques.



# Feature fini

* Stocker mdp de manière sécuritaire
* Protection de l’identifiant de session
* Délais d’inactivité (verifier!)
* Stockage sécurisé des informations de la session (côté serveur)
