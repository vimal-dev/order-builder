#!/usr/bin/env sh

set -e

# alembic upgrade head
flask db upgrade
flask --app app.wsgi run --host=0.0.0.0
