---
date: '2014-09-03'
title: Buffalo Linkstation entbricken
---

Heute hab ich es endlich geschafft meine fullbricked LinkStation zu retten. Nach einigem hin und her gab es dann vom Support doch mal eine sinnvolle Anleitung. Ich drösel das hier etwas auf, so das ihr eigentlich direkt loslegen könnt.

###### Was genau war das Problem?

Die LinkstationDuo (LS-WXL) speichert die Daten in irgendeinem völlig kaputten Dateisystem. Noch schlimmer ist eigentlich nur, dass dieses elegante Stück Hardware die Firmware auf den Festplatten speichert. Das ist solange kein Problem wie man keine oder nur eine Platte tauscht. Tauscht man nun aber beide hat man eine etwas zu klobig geratene, lichschwache Diskokugel die fröhlich mit Fehlercodes um sich wirft.

###### Das zeigt sich wie?

In meinem Fall war es ein 6-faches Blinken mit kurzen Pausen, gefolgt von einer langen und wieder von vorn. Irgendwo in endlosen unverständlichen Listen sind die auch dokumentiert.

Fangen wir also an.Wir brauchen folgende Software: Achja, es wird nur Windows supportet...

- [Firmware](http://www.buffalo-technology.com/userfiles/file/downloads/LS-series-fw168_fwwin.zip "Firmware")

- [TFTP Image](http://www.buffalo-technology.com/userfiles/file/downloads/recovery/TFTP%20Boot%20Recovery%20LS-WXL.exe "TFTP Image")

- [NAS Navigator](http://www.buffalo-technology.com/userfiles/file/downloads/NASNavigator2.zip "NAS Navigator")

Wir befinden uns also unter Windows und haben die drei Pakete da oben heruntergeladen (wichtig!). Wir navigieren erst einmal zur Adaptereinstellung unserer primären Netzwerkkarte und ändern diese auf folgende statische Werte:

* IP Adresse: 192.168.11.1
* Subnetz-Maske: 255.255.255.0

Das ist das Subnetz in dem sich die LinkStation meldet wenn sie keine Firmware mehr hat. Jetzt verbinden wir die Linkstation direkt mit dem PC. Spätestens jetzt ist auch das Internet weg. Ganz tief durchatmen, dass wird schon wieder!

Jetzt starten wir das TFTP-Boot.exe Programm und warten bis es sich mit einem "accepting requests.." auf die Lauer gelegt hat. Jetzt starten wir die Linkstation, warten bis diese den üblichen Fehlercode zeigt. Jetzt halten wir den Function-Knopf kurz 2-3 Sekunden gedrückt. Die Linkstation sollte nun Blau blinken. Kurz darauf sollte der TFTP Boot 2 Sätze an Blöcken an die Linkstation übertragen haben.

So, jetzt wird es richtig kaputt. Wir starten den NAS-Navigator und antworten auf die Frage ob wir die IP anpassen wollen mit NEIN! In der Übersicht taucht jetzt die LinkStation auf. Vermutlich mit einer anderen IP als wir es erwartet hätten. Wir ändern also unsere statische, lokale IP auf das Subnetz der Linkstation ab. Wenn zum Beispiel die IP Adresse als: 169.254.127.15 und die Subnetzmaske als: 255.255.0.0 angezeigt werden, müssen wir die IP des PC auf: 169.254.127.16 und die Subnetzmaske auf: 255.255.0.0 ändern.

Jetzt starten wir die LSUpdater.exe welche die LinkStation automatisch erkennen sollte. Dort klicken wir einfach auf Update und hoffen auf das beste.

-- Ich werde hier in den nächsten Tage fortsetzen. Folgen wird ua wie man komplett neue Festplatten ohne oder mit falscher Partitionstabelle einbindet und noch ein paar andere kleine Fehler werden angeführt werden --
