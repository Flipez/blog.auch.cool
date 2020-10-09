---
date: "2015-11-17"
title: Let's encrypt - Free, automated and open
description: Wie benutzt man eigentlich Let's encrypt?
featured: 'le-logo-wide.png'
featuredpath: 'date'
categories: ['Security', 'SSL', "Let's encrypt"]
author: Robert
---

Seit einiger Zeit gibt es nun schon Let's Encrypt. Und seit einigen Wochen auch eine Betaphase die Anfang Dezember öffentlich wird.

Ich fasse mich hier jetzt einfach mal kurz und zeige wie man sich in wenigen Schritten seine Zertifikate automatisiert generieren kann.

Als ersten müssen wir natürlich den Client von Let's Encrypt installieren - aktuell (und vermutlich wird das so bleiben) ist es nur per Api möglich Zertifikate zu erstellen.

```bash
pacman -S letsencrypt
```

Jetzt passen wir die Einstellungen im nginx an. Das ist am Anfang ein wenig Aufwand - der sich aber lohnt da man das Setup so eigentlich nicht mehr verändern muss.

Um den Prozess ohne Ausfall des Webservers durchzuführen muss die Domain über eine spezielle URL ereichbar sein. In meinem Beispiel sähe das so aus:

```nginx
server {
  listen 80 default_server;
  listen [::]:80;
  server_name www.flipez.net flipez.net;

  location '/.well-known/acme-challenge' {
      default_type "text/plain";
      root /tmp/letsencrypt-auto;
  }

  location / {
      return 301 https://$server_name$request_uri;
  }
}
```

Ihr müsst natürlich die Domain sowie ggf. das Verzeichnis so anpassen, wie ihr es mögt. In meinem Fall ist die Domain für Testzwecke und nicht stark konfiguriert. Ihr müsst also die Integration unter Umständen etwas anders vornehmen. Am Ende ist es wichtig das die URL entsprechend erreichbar ist.

Nun zu den SSL Einstellungen. Auch hier müsst ihr wieder an eure Konfiguration anpassen:


```nginx
ssl on;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_protocols TLSv1.2;
ssl_prefer_server_ciphers on;
ssl_stapling on;
ssl_stapling_verify on;
ssl_dhparam ssl/dhparam.pem;
ssl_ciphers AES256+EECDH:AES256+EDH:!aNULL;    
add_header Strict-Transport-Security "max-age=31536000; includeSubdomains";
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
ssl_certificate /etc/letsencrypt/live/flipez.net/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/flipez.net/privkey.pem;
```

Beachtet, dass ihr mit den Einstellungen zwar  ein A+ Rating bei SSL-Labs bekommt, ggf aber nicht alle eure Besucher unterstützt.

In den letzten zwei Zeilen fällt dann auch schon ins Auge, wo die Zertifikate abgelegt werden (sollen).

Das war es auch schon im nginx. Nun geht es an die Konsole:

Stellt zuerst sicher, dass das Verzeichnis des Servers existiert:

```bash
mkdir -p /tmp/letsencrypt-auto
```

Nun könnt ihr den Client die Arbeit überlassen:
```bash
letsencrypt certonly \
  --server https://acme-v01.api.letsencrypt.org/directory \
  -a webroot \
  --webroot-path=/tmp/letsencrypt-auto \
  --agree-dev-preview \
  -d www.flipez.net \
  -d flipez.net
```
Auch hier ist natürlich offensichtlich, dass Anpassungen vorgenommen werden müssen. Wer nur erneuern möchte hängt noch ein `--renew` an.
Wenn alles klappt quittiert Let's Encrypt mit Congratulations [...] und erklärt dabei noch einmal kurz, wie awesome ihr eigentlich seid.

Dannach mit einem Tool der Wahl den nginx neu starten:
```bash
nginx -s reload
systemctl reload nginx
```

Damit das alles dann auch schön automatisch passiert legen wir uns noch eine Systemd-Datei sowie den passenden Timer an.

```ini
# /etc/systemd/system/letsencrypt.service
[Unit]
Description=renew certificates for flipez.net

[Service]
Type=simple
ExecStart=/usr/bin/mkdir -p /tmp/letsencrypt-auto
ExecStart=/usr/bin/letsencrypt --renew certonly \
	--server https://acme-v01.api.letsencrypt.org/directory \
	-a webroot --webroot-path=/tmp/letsencrypt-auto \
	--agree-dev-preview -d www.flipez.net -d flipez.net
ExecStart=/usr/bin/nginx -s reload
[Install]
WantedBy=multi-user.target
```

Und dann noch den passenden Timer
```ini
# /etc/systemd/system/letsencrypt.timer
[Unit]
Description=run cert renew every month

[Timer]
OnUnitActiveSec=monthly
Unit=letsencrypt.service

[Install]
WantedBy=multi-user.target
```

So werden die Zertifikate jeden Monat einmal rotiert. Das kann man natürlich je nach belieben anpassen. Wem die Sache mit dem nginx zu kompliziert ist kann natürlich auch den Webserver nach jeder Rotation neustarten. Wie das funktioniert hat [Konrad in seinem Blog](https://www.konradmallok.de/#!/blog/53) beschrieben.
