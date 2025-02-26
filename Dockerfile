FROM node:11.1.0-alpine

WORKDIR /home/www/node-web

COPY package.json entrypoint.sh ./

RUN npm install

COPY . .

RUN chmod +x ./entrypoint.sh \
    && mkdir .runtime \
    && chmod -R a+w .runtime \
    && chmod -R a+w public

USER nobody

ENTRYPOINT ["./entrypoint.sh"]
