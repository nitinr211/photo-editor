# Use Apache as the base image
FROM httpd:alpine

# Set the working directory to the Apache document root
WORKDIR /usr/local/apache2/htdocs/

# Copy all files from the current directory into the container's document root
COPY . .

# Expose port 80 for serving the static app
EXPOSE 80

# Apache starts automatically, no need for CMD
