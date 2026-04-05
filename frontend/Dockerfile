FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# Kør Vite og generer dokumentation i baggrunden efter 10 sekunder
CMD ["sh", "-c", "npm run dev -- --host 0.0.0.0 --port 3000 & (sleep 10; npm run docs) & wait"]
