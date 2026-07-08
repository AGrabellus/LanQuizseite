# Entwicklung

Für die Entwicklung werden Node.js und npm benötigt.

- Node.js: 18 oder 20 LTS (empfohlen)
- npm: 9+ (kommt meist mit Node.js)

Beispiel in bash:

```bash
nvm install --lts
nvm use --lts
npm install -g @angular/cli@17
cd /pfad/zum/projekt
npm install
npm start
```

Damit die Dateien in diesem Ordner für die Quizze erkannt werden, bei NEUEN Dateien im assets Ordner ausführen:

```bash
npm run maniFestErstellen
```

## Neue Dateien hinterlegen

Neue Inhalte für die Quizze kommen in den Ordner

```text
src/assets/resources
```

beispielsweise unter:

```text
src/assets/resources/Anklickbar
```
