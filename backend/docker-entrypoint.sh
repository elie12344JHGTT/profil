#!/bin/sh
# Régénère le client sur le volume monté, puis lance le serveur de développement.
set -eu

cd /app
npx prisma generate
exec "$@"
