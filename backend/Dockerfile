FROM node:20

# Installer nødvendige værktøjer
RUN apt-get update && apt-get install -y \
    curl \
    git \
    pandoc \
    chromium \
    fonts-liberation \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libxshmfence1 \
    libxkbcommon0 \
    && ln -s /usr/bin/chromium /usr/bin/chromium-browser \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Kopier package files og installer
COPY package*.json ./
RUN npm install

# Installer Gemini CLI globalt i containeren
RUN npm install -g @google/gemini-cli

# Kopier koden
COPY . .

# Eksponer porten
EXPOSE 3002

# Start server og worker øjeblikkeligt, og generer dokumentation i baggrunden efter 5 sekunder
CMD ["sh", "-c", "node server.js & node worker.js & (sleep 5; npm run docs) & wait"]
