#!/bin/sh
set -e

echo "Running database set up"
npm run db

echo "starting server"
exec npm start