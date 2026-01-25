# digistamp

## 1. Repository klonen

1. Ordner anlegen, wo das Projekt sein soll  
2. Ordner mit **VS Code** öffnen  
3. In VS Code ein Terminal öffnen (Menü: Terminal → Neues Terminal)  
4. Folgendes ausführen:
   ```bash
   git clone https://github.com/sm2502/digistamp.git
   cd digistamp
   ```

------------------------------------------------------------------------

## 2. Auf den richtigen Branch wechseln

Nach dem Klonen bitte **unbedingt** ausführen:

``` bash
git fetch
git checkout dev
git pull
```

Jetzt sollte der aktive Branch dev sein.\
Kann man prüfen mit:

``` bash
git branch
```

------------------------------------------------------------------------

## Programmieren 

1.  Zuerst synchronisieren im Terminal von VS Code:

    ``` bash
    git pull
    ```

2.  Dann normal programmieren.
3.  Am Ende seitlich beim GitHub Zeichen commiten

------------------------------------------------------------------------

## 4. Lokales Backend starten

Zum Testen vom Server im VS Code Terminal:

``` bash
cd backend
npm install
node server.js
```

Danach  <http://localhost:3000> öffnen\ 

------------------------------------------------------------------------

## 5. Wichtig

  **Nicht direkt auf `main` arbeiten sondern immer auf `dev`**\

------------------------------------------------------------------------
