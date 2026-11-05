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

| `zufallsthema/` | Seite für die Serie "1 Minute reden", erreichbar unter `/zufallsthema/` |

Neue Unterseite: Ordner anlegen, darin eine `index.html`. Der Ordner `beispiel/` ist dann unter `/beispiel/` erreichbar.
Pfade in Unterseiten relativ schreiben, also `../assets/site.css`.

## 1 Minute reden: Themen ergänzen

Alle Themen stehen in `zufallsthema/themen.md`. Neues Thema: unter einer passenden Überschrift (beginnt mit `##`) eine Zeile einfügen:

```
Titel | Kategorie | Such-Hinweis für die Recherche
```

- Kategorie und Such-Hinweis sind freiwillig. Fehlt die Kategorie, gilt die Überschrift darüber.
- Eine neue Kategorie taucht automatisch im Filter auf der Seite auf.
- `(?)` im Titel markiert eine Anekdote, die du in der Recherche prüfen willst. Die Seite zeigt dann "Anekdote prüfen" an.
- Speichern, committen, pushen. Nach dem nächsten Deploy ist das Thema drin.
- Ein Thema wird über seinen Titel wiedererkannt. Titel bereits gezogener Themen also nicht mehr ändern, sonst gilt es als neu.

Schnell ein Thema nur für dich: auf der Seite unter Einstellungen bei "Eigene Themen" im selben Format eintragen. Das bleibt nur in deinem Browser.

Auf der Seite: Leertaste zieht ein Thema bzw. startet und pausiert den Timer, N startet die nächste Folge.

## Lokal ansehen

Im Terminal im Repo-Ordner:

```bash
python3 -m http.server 8000
```

Dann im Browser `http://localhost:8000` öffnen. Ein Doppelklick auf die HTML-Datei reicht nicht, weil Seiten Dateien nachladen.

## Veröffentlichen

Die Seite braucht keinen Build. Bei Vercel das Repo importieren, als Framework "Other" wählen, Build Command leer lassen, Output Directory ist der Repo-Ordner selbst. Jeder Push auf `main` geht dann automatisch live.

Keine Tracker, keine Cookies, keine externen Skripte.
