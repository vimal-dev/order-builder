FROM python:3.12-alpine AS base

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

ARG USERNAME=appuser
ARG USER_UID=1000
ARG USER_GID=$USER_UID

RUN addgroup --gid $USER_GID $USERNAME
RUN adduser --disabled-password --gecos '' -u $USER_UID -G $USERNAME $USERNAME

# RUN adduser --disabled-password --gecos '' appuser

RUN apk add --update --no-cache --virtual .tmp-build-deps \
  gcc libc-dev linux-headers pkgconfig mariadb-dev libmagic

# RUN apk add --update --no-cache --virtual .tmp-build-deps \
#  gcc libc-dev linux-headers postgresql-dev \
#  && apk add libffi-dev

# Install dependencies only when needed
FROM base AS builder

WORKDIR /code

RUN pip install --upgrade pip
RUN pip install poetry poetry-plugin-export

COPY pyproject.toml poetry.lock ./
RUN poetry export --without-hashes --without dev -f requirements.txt -o requirements.txt && \
  chown appuser:appuser requirements.txt

RUN python -m venv .venv
ENV PATH=.venv/bin:$PATH

RUN pip install -r requirements.txt

FROM base AS runner

WORKDIR /code

COPY --from=builder /code/.venv ./.venv
ENV PATH=.venv/bin:$PATH

EXPOSE 5000

USER appuser
COPY --chown=appuser:appuser app app
COPY --chown=appuser:appuser gunicorn_config.py gunicorn_config.py
COPY --chown=appuser:appuser entrypoint.sh entrypoint.sh
COPY --chown=appuser:appuser entrypoint-worker.sh .
COPY --chown=appuser:appuser migrations migrations

# CMD ["gunicorn", "--config", "./gunicorn_config.py", "app.wsgi"]

ENTRYPOINT ["/bin/sh", "entrypoint.sh"]
