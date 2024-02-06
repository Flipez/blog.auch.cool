---
date: '2013-03-17'
title: Raspberry Pi - Die ersten Schritte
---

Heute wollen wir uns einmal um die minimal Installation eines Raspbian\`s auf dem Raspberry kümmern. Dazu brauchen wir ein paar Dinge:

*   Raspberry Pi
*   SD Karte + Kartenleser
*   HDMI fähigen Monitor / Fernseher
*   USB - Tastatur
*   Netzwerkkabel

## Schritt 1 - Die SD Karte vorbereiten

Als ersten formatieren wir die SD Karte ins FAT32 Format. Danach laden wir uns den Raspbian Installier herunter ([raspbian.org](http://www.raspbian.org/RaspbianInstaller "Raspian.org"))

Dieser Installer führt die ersten Schritte mit Daten von der SD Karte aus und läd\` dann die benötigten Daten nach. Deshalb immer auf die Internetverbindung achten.

Diese Daten entpacken wir dann direkt auf die SD Karte. Somit währen wir mit der Karte auch schon fertig und stecken sie in den Raspberry.

## Schritt 2 - Die Raspbian Installation

Wir versorgen den Raspberry mit Internet, einer Tastatur sowie einem Monitor und geben ihm per USB noch etwas Saft.

Jetzt sollte direkt der Installer starten. Dieser stellt uns jetzt einige Fragen. Die nachfolgenden Schritte sind in der Regel zutreffend, können aber im Einzelfall bei euch anders sein.

*   Select language: **Deutsch**
*   Select your location: **Deutschland**
*   Configure the keyboard: **Deutsch**
*   Configure the network: Hier einen Namen für das Gerät eingeben. z.B **Raspberry**
*   Configure the network: Dieser Punkt kann einfach mit **Enter** übersprungen werden
*   Choose a mirror of the Debian archive: **mirrordirector.raspbian.org**
*   Choose a mirror of the Debian archive: **/raspbian/**
*   Choose a mirror of the Debian archive: Die Frage nach einem Proxy kann in den meisten Fällen mit **Enter** übersprungen werden
*   Jetzt werden wir gefragt ob wir die Installation ohne Kernel fortsetzen wollen. Das beantworten wir mit **&lt;Yes&gt;**

Der Installer läd jetzt weitere Daten vom Webserver. Idealer Zeitpunkt den Kaffee anzusetzen.... Sind wir von der Kaffeemaschine zurück, können wir auch schon die Userdaten eingeben.

*   Root Passwort ( Der root - Benutzer wird später zum Installieren von Paketen und bearbeiten von Dateien benötigt. )
*   Vollständiger Name
*   Benutzername
*   Passwort für den Benutzer

Jetzt stellen wir die Zeitzone ein ( in DE sollte das Berlin sein ).

Dann schlägt uns der Installer vor, wie wir die Speicherkarte partitionieren können. Das könnte so aussehen:

*   1 primary 78.6 MB B f fat32 /rpiboot
*   2 primary 255.9 MB f swap swap
*   3 primary 3.6 GB f ext3 /

Das bejahen wir mit **&lt;Finish partitioning and write changes to disk&gt;** und bestätigen mit **&lt;Yes&gt;**

Jetzt wird das Grundsystem installiert und eingerichtet. Perfekt um den inzwischen fertigen Kaffee zu holen...

Meist kann das security.debian.org repository nicht erreicht werden. Mit **&lt;Continue&gt;** bestätigen und die Frage nach Informationen mit **&lt;Yes&gt; oder &lt;No&gt;** beantworten - wie ihr wollt.

Jetzt werden wir gefragt welche Software wir mit Installieren wollen. Wir belassen es in diesem Fall bei den bereits ausgewählten:

*   SSH server
*   Standard system utilities
Diese werden jetzt installiert. Der Kaffee sollte Trink-Temperatur haben - schmecken lassen!

Danach bestätigen wir noch einmal mit **&lt;Continue&gt;**, der Raspberry sollte nun neustarten.

### Willkommen in der Welt des Raspbian ;)

Weiterführend kann [hier](/blog/2013/03-18-raspberry-pi-remote "Raspberry Pi - Fernzugriff einrichten") der Fernzugriff eingerichtet werden.
