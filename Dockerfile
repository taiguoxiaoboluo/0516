FROM mcr.microsoft.com/playwright:v1.59.1-noble

WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

COPY package*.json ./
RUN npm ci --omit=dev && chown -R pwuser:pwuser /app

COPY --chown=pwuser:pwuser . .

USER pwuser

EXPOSE 3000

CMD ["npm", "run", "web:public"]
