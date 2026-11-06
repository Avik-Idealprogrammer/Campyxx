FROM nginx:stable-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html app.js api-client.js styles.css booking-rules.js portal-login.html portal-login.css portal-login.js student-portal.html student-portal.css student-portal.js faculty-portal.html faculty-portal.css faculty-portal.js admin-portal.html admin-portal.css admin-portal.js 404.html /usr/share/nginx/html/
COPY assets/*.webp /usr/share/nginx/html/assets/
COPY admin/login/ /usr/share/nginx/html/admin/login/

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O - http://127.0.0.1/health || exit 1