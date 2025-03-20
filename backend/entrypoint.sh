#!/usr/bin/env sh

set -e

# alembic upgrade head
/code/.venv/bin/flask --app app.wsgi:application db upgrade
/code/.venv/bin/gunicorn --config ./gunicorn_config.py app.wsgi:application
