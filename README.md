# mywebsite

Persönliche Website von Justus Thierling. Reines HTML, CSS und JavaScript: kein Framework, kein Build, keine Abhängigkeiten.

## Aufbau

| Pfad | Inhalt |
| --- | --- |
| `index.html` | Startseite |
| `assets/site.css` | Gemeinsames Design (Farben, Schriften, Buttons) |
| `assets/fonts/` | Schriften Fraunces und Outfit, selbst gehostet (SIL Open Font License) |
| `assets/favicon.svg` | Icon im Browser-Tab |
| `vercel.json` | Sicherheits-Header und Adressen mit Schrägstrich am Ende |

Neue Unterseite: Ordner anlegen, darin eine `index.html`. Der Ordner `beispiel/` ist dann unter `/beispiel/` erreichbar.
Pfade in Unterseiten relativ schreiben, also `../assets/site.css`.

## Lokal ansehen

Im Terminal im Repo-Ordner:

```bash
python3 -m http.server 8000
```

Dann im Browser `http://localhost:8000` öffnen. Ein Doppelklick auf die HTML-Datei reicht nicht, weil Seiten Dateien nachladen.

## Veröffentlichen

Die Seite braucht keinen Build. Bei Vercel das Repo importieren, als Framework "Other" wählen, Build Command leer lassen, Output Directory ist der Repo-Ordner selbst. Jeder Push auf `main` geht dann automatisch live.

Keine Tracker, keine Cookies, keine externen Skripte.
