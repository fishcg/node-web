FROM node:24.13.0-alpine

WORKDIR /home/www/node-web

COPY package.json package-lock.json entrypoint.sh ./

RUN npm install pnpm -g && pnpm install

COPY . .

RUN chmod +x ./entrypoint.sh \
    && mkdir .runtime \
    && chmod -R a+w .runtime \
    && chmod -R a+w public

USER nobody

ENTRYPOINT ["./entrypoint.sh"]
