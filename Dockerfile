# Use official Node.js image
FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm install

# Copy app source
COPY . .

# Expose the server port
EXPOSE 5000

# Run the server
CMD [ "npm", "start" ]
