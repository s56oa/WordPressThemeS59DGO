#!/bin/sh
# Obnovi wp-content in bazo iz arhiva Backuply; teče v vsebniku cli kot 33:33 (bin/lokalno.sh obnovi).
# Argument: pot do arhiva v vsebniku (/backup/…). Geslo skrbnika »lokalni« pride v S59DGO_GESLO.
set -eu

arhiv="$1"
ime="$(basename "$arhiv")"
cas="$(date -u -r "$arhiv" +%Y-%m-%dT%H:%M:%SZ)"
html=/var/www/html
obnova=/tmp/obnova
export HOME=/tmp
[ -n "${S59DGO_GESLO:-}" ] || { echo "Manjka S59DGO_GESLO." >&2; exit 1; }

# Staro stanje ne sme preživeti neuspele obnove (preveri_pripravljenost ga zahteva).
rm -f /stanje/stanje-produkcije.json /stanje/stanje-produkcije.json.tmp

# Odjemalec MariaDB 11 privzeto zahteva TLS, strežnik 10.11 ga nima; wp db
# kliče odjemalca z --no-defaults, zato --skip-ssl doda ovoj v PATH.
mkdir -p /tmp/bin
cat > /tmp/bin/mariadb <<'OVOJ'
#!/bin/sh
if [ "${1:-}" = --no-defaults ]; then
  shift
  exec /usr/bin/mariadb --no-defaults --skip-ssl "$@"
fi
exec /usr/bin/mariadb --skip-ssl "$@"
OVOJ
chmod +x /tmp/bin/mariadb
ln -sf mariadb /tmp/bin/mysql
export PATH="/tmp/bin:$PATH"

# Brez mod_rewrite v nastavitvah WP-CLI »rewrite flush --hard« ne zapiše .htaccess.
printf 'apache_modules:\n  - mod_rewrite\n' > /tmp/wp-cli.yml
export WP_CLI_CONFIG_PATH=/tmp/wp-cli.yml

echo "Razpakiram ${ime} …"
rm -rf "$obnova"
mkdir -p "$obnova"
# Tema s59dgo pride iz repozitorija, arhivi Backuply ne sodijo v lokalno kopijo.
tar -xzf "$arhiv" -C "$obnova" \
  --exclude='wp-content/themes/s59dgo' \
  --exclude='wp-content/backuply' \
  --exclude='wp-content/backups_*' \
  softsql.sql wp-content

# Predpona tabel: najkrajša pred »options« (npr. wp_redirection_options ni prava).
predpona="$(grep -o 'CREATE TABLE `[A-Za-z0-9_]*options`' "$obnova/softsql.sql" \
  | sed 's/^CREATE TABLE `\(.*\)options`$/\1/' | awk '{ print length, $0 }' | sort -n | head -n 1 | cut -d' ' -f2)"
[ -n "$predpona" ] || { echo "V softsql.sql ni tabele *options." >&2; exit 1; }
echo "Predpona tabel: ${predpona}"

echo "Počistim wp-content (razen teme s59dgo in lokalnega mu-plugina) …"
mkdir -p "$html/wp-content/themes" "$html/wp-content/mu-plugins"
find "$html/wp-content" -mindepth 1 -maxdepth 1 ! -name themes ! -name mu-plugins -exec rm -rf {} +
find "$html/wp-content/themes" -mindepth 1 -maxdepth 1 ! -name s59dgo -exec rm -rf {} +
find "$html/wp-content/mu-plugins" -mindepth 1 -maxdepth 1 ! -name s59dgo-lokalno.php -exec rm -rf {} +

echo "Kopiram wp-content iz arhiva …"
cp -a "$obnova/wp-content/." "$html/wp-content/"

php_uploads="$(find "$html/wp-content/uploads" -type f \( -iname '*.php' -o -iname '*.php[0-9]' -o -iname '*.phtml' -o -iname '*.phar' \) 2>/dev/null | sed "s#^$html/##" || true)"
if [ -n "$php_uploads" ]; then
  echo "OPOZORILO: .php v uploads/ (preveri na produkciji):"
  printf '%s\n' "$php_uploads" | sed 's/^/  /'
fi

echo "Ustvarim lokalni wp-config.php …"
rm -f "$html/wp-config.php" "$html/.htaccess"
wp config create --path="$html" --dbname=wordpress --dbuser=wordpress --dbpass=wordpress \
  --dbhost=db --dbprefix="$predpona" --locale=sl_SI --skip-check --force --quiet
wp config set WP_DEBUG true --raw --path="$html" --quiet
wp config set WP_DEBUG_LOG '/stanje/debug.log' --path="$html" --quiet
wp config set WP_DEBUG_DISPLAY false --raw --path="$html" --quiet
wp config set WP_ENVIRONMENT_TYPE 'local' --path="$html" --quiet
wp config set WP_HTTP_BLOCK_EXTERNAL true --raw --path="$html" --quiet
wp config set DISABLE_WP_CRON true --raw --path="$html" --quiet
wp config set AUTOMATIC_UPDATER_DISABLED true --raw --path="$html" --quiet

echo "Uvozim bazo …"
wp db reset --yes --path="$html" --quiet
wp db import "$obnova/softsql.sql" --path="$html" --quiet

echo "Zamenjam domene …"
# Od najdaljšega vzorca proti krajšemu, da ne nastane https://http://localhost:8059.
zamenjaj() {
  od="$1"
  na="$2"
  wp search-replace "$od" "$na" --all-tables-with-prefix --precise --quiet --path="$html"
}
zamenjaj 'https://www.s59dgo.si' 'http://localhost:8059'
zamenjaj 'http://www.s59dgo.si' 'http://localhost:8059'
zamenjaj '//www.s59dgo.si' '//localhost:8059'
zamenjaj 'https://s59dgo.si' 'http://localhost:8059'
zamenjaj 'http://s59dgo.si' 'http://localhost:8059'
zamenjaj '//s59dgo.si' '//localhost:8059'
zamenjaj 'https://www.s59dgo.org' 'http://localhost:8059'
zamenjaj 'http://www.s59dgo.org' 'http://localhost:8059'
zamenjaj '//www.s59dgo.org' '//localhost:8059'
zamenjaj 'https://s59dgo.org' 'http://localhost:8059'
zamenjaj 'http://s59dgo.org' 'http://localhost:8059'
zamenjaj '//s59dgo.org' '//localhost:8059'
# Še v JSON ubežane poševnice (bloki, nastavitve vtičnikov), spet od najdaljšega vzorca.
zamenjaj 'https:\/\/www.s59dgo.si' 'http:\/\/localhost:8059'
zamenjaj 'http:\/\/www.s59dgo.si' 'http:\/\/localhost:8059'
zamenjaj '\/\/www.s59dgo.si' '\/\/localhost:8059'
zamenjaj 'https:\/\/s59dgo.si' 'http:\/\/localhost:8059'
zamenjaj 'http:\/\/s59dgo.si' 'http:\/\/localhost:8059'
zamenjaj '\/\/s59dgo.si' '\/\/localhost:8059'
zamenjaj 'https:\/\/www.s59dgo.org' 'http:\/\/localhost:8059'
zamenjaj 'http:\/\/www.s59dgo.org' 'http:\/\/localhost:8059'
zamenjaj '\/\/www.s59dgo.org' '\/\/localhost:8059'
zamenjaj 'https:\/\/s59dgo.org' 'http:\/\/localhost:8059'
zamenjaj 'http:\/\/s59dgo.org' 'http:\/\/localhost:8059'
zamenjaj '\/\/s59dgo.org' '\/\/localhost:8059'

echo "Izklopim two-factor in backuply …"
wp plugin deactivate two-factor backuply --path="$html" --quiet

echo "Nastavim skrbnika lokalni …"
if wp user get lokalni --field=ID --path="$html" >/dev/null 2>&1; then
  wp user update lokalni --user_pass="$S59DGO_GESLO" --role=administrator --skip-email --path="$html" --quiet
else
  wp user create lokalni lokalni@localhost.invalid --role=administrator --user_pass="$S59DGO_GESLO" --path="$html" --quiet
fi

wp rewrite flush --hard --path="$html" --quiet

echo "Zapišem posnetek stanja produkcije …"
wp eval-file /lokalno-wp/stanje-produkcije.php "$ime" "$cas" --path="$html" > /stanje/stanje-produkcije.json.tmp
php -r 'json_decode( (string) file_get_contents( $argv[1] ), true, 512, JSON_THROW_ON_ERROR );' /stanje/stanje-produkcije.json.tmp \
  || { echo "Posnetek stanja ni veljaven JSON." >&2; exit 1; }
mv /stanje/stanje-produkcije.json.tmp /stanje/stanje-produkcije.json

rm -rf "$obnova"
: > /stanje/debug.log
echo "Obnova končana."
