FROM node:20-slim

RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH
WORKDIR $HOME/app

COPY --chown=user package*.json ./
RUN npm install

COPY --chown=user . .

EXPOSE 7860
CMD ["node", "server.js"]
