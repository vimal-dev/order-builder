#!/usr/bin/env sh

set -e

# alembic upgrade head
flask --app app.wsgi:application db upgrade
flask --app app.wsgi:application run --host=0.0.0.0
