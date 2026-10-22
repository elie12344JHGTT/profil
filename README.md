# Vodcast

Première tranche d'une application de podcast vidéo : monorepo, API Node.js et PostgreSQL. Le client React Native et les routes métier viendront ensuite.

Les identifiants `vodcast` / `vodcast` / `vodcast` de `.env.example` servent uniquement au Docker local.

Le dépôt contient aussi le site statique déjà publié à la racine (`index.html`, CSS, images). Cette tranche ne le modifie pas.

## Arborescence

```
.
├── backend/                  API Node.js, Express et TypeScript
│   ├── Dockerfile            image de développement (nodemon + tsx)
│   ├── nodemon.json
│   ├── docker-entrypoint.sh
│   ├── prisma.config.ts      connexion Prisma 7
│   ├── prisma/schema.prisma
│   ├── prisma/migrations/    migration SQL initiale
│   └── src/
│       ├── index.ts          GET /health
│       └── services/youtube/ métadonnées YouTube Data API v3
├── frontend/                 emplacement réservé (README seulement)
├── docker-compose.yml        services db (PostgreSQL 16) et api
├── .env.example
└── .gitignore
```

## Démarrage

1. Cloner le dépôt

```bash
git clone https://github.com/elie12344JHGTT/profil.git
cd profil
```

2. Copier l'environnement et renseigner la clé YouTube

```bash
cp .env.example .env
```

Ouvrir `.env` et remplacer `YOUTUBE_API_KEY`. La valeur `remplacez-moi` suffit pour démarrer l'API ; elle ne suffit pas pour interroger YouTube. Si vous changez `POSTGRES_USER`, `POSTGRES_PASSWORD` ou `POSTGRES_DB`, alignez aussi `DATABASE_URL`. L'hôte reste `db` : c'est le nom du service Compose, vu depuis le conteneur `api`.

3. Construire et démarrer

```bash
docker compose up --build
```

PostgreSQL est publié sur le port **5432**, l'API sur le port **3000**. Laissez cette commande active (ou ouvrez un second terminal pour la suite). Pour tout lancer en arrière-plan : `docker compose up --build -d`.

4. Appliquer le schéma Prisma dans le conteneur `api`

La migration initiale est versionnée dans `backend/prisma/migrations`. Elle a été produite avec `prisma migrate diff` (sans base vivante). Appliquez-la avec :

```bash
docker compose exec api npm run db:migrate
```

Ce script exécute `prisma migrate deploy`.

Pour synchroniser le schéma sans passer par l'historique de migration :

```bash
docker compose exec api npm run db:push
```

Ce script exécute `prisma db push`.

Une future migration de développement se crée avec `docker compose exec api npm run db:migrate:dev` (`prisma migrate dev`). Le client TypeScript se régénère au démarrage du conteneur (`prisma generate`) et à la demande avec `docker compose exec api npm run db:generate`.

5. Vérifier la santé de l'API

Attendez le journal `API Vodcast à l'écoute sur le port 3000`, puis :

```bash
curl http://localhost:3000/health
```

Réponse attendue : `{"status":"ok"}`.

## Scripts utiles dans `backend/`

| Script | Commande |
| --- | --- |
| `npm run dev` | serveur TypeScript avec rechargement (nodemon + tsx) |
| `npm run build` | `tsc --noEmit` |
| `npm test` | parseur d'identifiant, parseur de durée, service YouTube (sans réseau) |
| `npm run db:migrate` | `prisma migrate deploy` |
| `npm run db:push` | `prisma db push` |

## Note pour la suite

Le lecteur YouTube devra rester visible. L'API iframe standard n'est pas prévue pour une lecture audio seule en arrière-plan.

## Reporté

- Application React Native CLI (`frontend/` est un emplacement vide)
- Composant lecteur YouTube
- Routes podcasts, épisodes, chapitres et progression de lecture

## Choix techniques

- Node.js 22, Express 5, TypeScript 5.9 (`strict`)
- Prisma ORM **7.10.1**, dernière version stable (la 8.0 est une release candidate). Prisma 7 place `DATABASE_URL` dans `prisma.config.ts` et génère le client dans `backend/src/generated/prisma` (ignoré par Git).
- Rechargement à chaud : **nodemon** (polling, pour que Docker voie les changements) lance **tsx**. Prisma 7 demande `"type": "module"` ; ts-node-dev 2 charge le projet avec un `require` CommonJS et ne le démarre pas.
- L'adaptateur PostgreSQL (`@prisma/adapter-pg`) sera branché quand une route ouvrira le client. Cette tranche ne fait qu'exposer le schéma, la migration et `GET /health`.
