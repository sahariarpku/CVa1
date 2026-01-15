FROM ghcr.io/puppeteer/puppeteer:21.5.2

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
USER root
RUN npm install
USER pptruser

# Copy app source
COPY . .

# Expose port
EXPOSE 5001

# Start the server
CMD [ "node", "server.js" ]
