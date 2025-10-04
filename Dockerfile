FROM node:20.18.0-bookworm-slim AS assets
LABEL maintainer="Tam Le <tamsgit@gmail.com>"
# [original] LABEL maintainer="Nick Janetakis <nick.janetakis@gmail.com>"

WORKDIR /app/assets

ARG UID=1000
ARG GID=1000

RUN apt-get update \
  && apt-get install -y --no-install-recommends build-essential \
  && rm -rf /var/lib/apt/lists/* /usr/share/doc /usr/share/man \
  && apt-get clean \
  && groupmod -g "${GID}" node && usermod -u "${UID}" -g "${GID}" node \
  && mkdir -p /node_modules && chown node:node -R /node_modules /app

USER node

COPY --chown=node:node assets/package.json assets/*yarn* ./

RUN yarn install && yarn cache clean

ARG NODE_ENV="production"
ARG VITE_API_BASE_URL=""
ENV PATH="${PATH}:/node_modules/.bin" \
    USER="node" \
    VITE_API_BASE_URL="${VITE_API_BASE_URL}"

COPY --chown=node:node . ..

# Ensure we build with the production flag
RUN yarn run vite build --outDir=/app/assets/dist --emptyOutDir

# Fix to copy the built assets to a shared location
RUN cp -r /app/assets/dist/* /app/public_collected/ || mkdir -p /app/public_collected/ && cp -r /app/assets/dist/* /app/public_collected/

# Create backgrounds directory and copy SVG files from design-system
RUN mkdir -p /app/public/images/backgrounds && \
    cp -r /app/design-system/backgrounds/*.svg /app/public/images/backgrounds/

CMD ["bash"]

###############################################################################

FROM python:3.13.0-slim-bookworm AS app
LABEL maintainer="Tam Le <tamsgit@gmail.com>"
# [original] LABEL maintainer="Nick Janetakis <nick.janetakis@gmail.com>"

WORKDIR /app

ARG UID=1000
ARG GID=1000

RUN apt-get update \
  && apt-get install -y --no-install-recommends build-essential curl libpq-dev \
  && rm -rf /var/lib/apt/lists/* /usr/share/doc /usr/share/man \
  && apt-get clean \
  && groupadd -g "${GID}" python \
  && useradd --create-home --no-log-init -u "${UID}" -g "${GID}" python \
  && mkdir -p /public_collected public \
  && chown python:python -R /public_collected /app

USER python

COPY --chown=python:python requirements*.txt ./
COPY --chown=python:python bin/ ./bin

RUN chmod 0755 bin/* && bin/pip3-install

ARG DEBUG="false"
ENV DEBUG="${DEBUG}" \
    PYTHONUNBUFFERED="true" \
    PYTHONPATH="." \
    PATH="${PATH}:/home/python/.local/bin" \
    USER="python"

# COPY main app code
COPY --chown=python:python . .

WORKDIR /app/src

# Run collectstatic WITHOUT --clear first, to gather admin etc.
RUN SECRET_KEY=dummyvalue python3 manage.py collectstatic --no-input

# Copy the built frontend assets directly to public_collected after collectstatic
COPY --chown=python:python --from=assets /app/assets/dist/ /public_collected/

# Copy static images to public_collected/images directory
RUN mkdir -p /public_collected/images/
COPY --chown=python:python --from=assets /app/assets/static/images/ /public_collected/images/
# Copy logo and favicon files from public/images directory
COPY --chown=python:python --from=assets /app/public/images/ /public_collected/images/

# Copy background SVGs to public_collected/images/backgrounds
RUN mkdir -p /public_collected/images/backgrounds/
COPY --chown=python:python --from=assets /app/public/images/backgrounds/ /public_collected/images/backgrounds/

# Create uploads directory in public_collected
RUN mkdir -p /public_collected/uploads/ /public_collected/media/uploads/

ENTRYPOINT ["/app/bin/docker-entrypoint-web"]

EXPOSE 8000

CMD ["gunicorn", "-c", "python:config.gunicorn", "config.wsgi"]
