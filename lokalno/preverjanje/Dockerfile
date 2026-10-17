# Vsebnik brskalnik: Playwright (Chromium), axe-core, pixelmatch, pngjs; WordPress doseže prek socat.
FROM mcr.microsoft.com/playwright:v1.56.0-noble

RUN apt-get update \
 && apt-get install -y --no-install-recommends socat \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/preverjanje
RUN npm install --no-save --no-audit --no-fund \
    playwright@1.56.0 axe-core@4.10.2 pixelmatch@6.0.0 pngjs@7.0.0

COPY vstop.sh /usr/local/bin/vstop.sh
RUN chmod +x /usr/local/bin/vstop.sh
ENTRYPOINT ["/usr/local/bin/vstop.sh"]
CMD ["sleep", "infinity"]
