FROM node:22

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
        curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*



WORKDIR /workspaces/frontend

COPY package*.json ./
RUN npm install
COPY . .
CMD ["sh", "-c", "npm run dev -- --hostname 0.0.0.0"]