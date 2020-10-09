---
date: '2013-03-30'
title: Raspberry Pi - AirPlay
---

Heute wollen wir uns einmal über die Medien-Tauglichkeit des Raspberry`s unterhalten. Die Apple-Jünger unter euch wird es gefallen - heute rüsten wir den Rasperry mit AirPlay aus.

Alles was wir dazu brauchen: Raspberry Pi, Netzwerkkabel oder USB-Wlan Stick, 3.5 Klinke Soundsystem (für mehr Qualität bieten sich USB Systeme an), ein iDevice oder iTunes.

## Schritt 1 - Vorbereiten

Als erstes aktualisieren wir die Paketlisten:

```bash
sudo apt update
```

Danach richten wir den Klinke Ausgang als Standard ein. In den meisten Fällen wird der Ton ja über den HDMI Port ausgegeben.

```bash
amixer cset numid=3 1
```

Dabei steht 0 für Automatisch, 1 für Kopfhörer - also Klinke und 2 für den HDMI Ausgang.

## Schritt 2 - Die Paketinstallation

Für unseren "AirPi" benutzen wir Shairport welches wir mit ein paar zusätzlichen Paketen direkt von Github installieren können. Dazu müssen wir erst einmal Git installieren. Das machen wir wie folgt:

```bash
sudo apt install git libao-dev libssl-dev libcrypt-openssl-rsa-perl libio-socket-inet6-perl libwww-perl avahi-utils
```

Jetzt laden wir Shairport mit diesem Befehl herunter:

```bash
git clone https://github.com/albertz/shairport.git shairport *
```

Dann wechseln wir in den Shairport Ordner und compilieren:

```bash
cd shairport
sudo make
```

## Schritt 3 - Shairport automatisch starten lassen

Wir installieren es mit

```bash
sudo make install
```

Und kopieren die Init-Datei in das Startverzeichnis

```bash
sudo cp shairport.init.sample /etc/init.d/shairport
```

Dann wechseln wir in das init.d Verzeichnis und weisen Shairport die benötigten Rechte zu

```bash
cd /etc/init.d
sudo chmod a+x shairport
sudo update-rc.d shairport defaults
```

Jetzt bearbeiten wir die Einstellungen (in /etc/init.d)

Öffnen mit

```bash
sudo nano shairport
```

Und ändern `DAEMON_ARGS` von

```bash
NAME=shairport
DAEMON="/usr/local/bin/shairport.pl"
PIDFILE=/var/run/$NAME.pid
DAEMON_ARGS="-w $PIDFILE"
```

zu

```bash
NAME=shairport
DAEMON="/usr/local/bin/shairport.pl"
PIDFILE=/var/run/$NAME.pid
DAEMON_ARGS="-w $PIDFILE -a NameDesAirPi"
```

Gespeichert wird, wie üblich mit `STRG+O` und verlassen mit `STRG+X`

## Schritt 4 - Starten

So. Damit wären wir fertig und können jetzt starten. Ganz einfach per:

```bash
sudo /etc/init.d/shairport start
```

Viel Spaß mit eurem AirPi ;)
