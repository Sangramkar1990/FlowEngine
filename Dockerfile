# Use official Node.js image
FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm install

# Copy app source
COPY . .

# Copy and use entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/

# Make it executable
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"] 

# Expose the server port
EXPOSE 5000

# Run the server
CMD [ "npm", "start" ]
