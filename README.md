# WebAPIDuCercueil
## Installation
### PostgreSQL
- Installer PostgreSQL 17 avec les outils de ligne de commande
- (je vais faire un fichier bat pour faire toutes les actions ci-dessous)
- Ajouter à la varibable d'environnement Path le répertoire ``C:\Program Files\PostgreSQL\17\bin`` parceque visblement personne n'a penser à le faire dans l'installer
- Remplacer la ligne :  
	``host all all 127.0.0.1/32 md5``
	par 
	``host all all 127.0.0.1/32 trust``
	dans le fichier : ``C:\Program Files\PostgreSQL\17\data\pg_hba.conf``pour ne pas voir à gérer des mots de passe.
- Lancer la commande ``psql -U postgres -f InitializeDB.sql``

Pour se connecter à la base de données : ``psql -h localhost -p 5432 -U admin1 -d foodydb``
Pour supprimer complètement la base de données : ``psql -U postgres -f InitializeDB.sql``

### ExpressJS
Il n'y a qu'a lancer la commande ``npm start`` pour lancer l'API sur l'URL http://127.0.0.1:3000/