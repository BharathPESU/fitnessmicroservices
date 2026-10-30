FROM nginx:alpine

# Copy custom Nginx configuration with SPA support
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy Vite production build
COPY dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]