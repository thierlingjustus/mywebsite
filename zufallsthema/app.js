/*
  1 Minute reden
  Thema ziehen, 10 Minuten recherchieren, 1 Minute sprechen.

  Kein Tracking, keine Cookies, keine externen Skripte.
  Gespeichert wird nur im localStorage des Browsers. Wenn das nicht geht, läuft die Seite trotzdem.
  Die Themen kommen aus themen.md im selben Ordner.
*/
(function () {
  "use strict";

  var SPEICHER_KEY = "einminutereden.v1";
  var RECHERCHE_MS = 10 * 60 * 1000;
  var SPRECHEN_MS = 60 * 1000;
  var WARNUNG_MS = 60 * 1000;
  var SLOT_MS = 2000;
  var BOOST_KATEGORIE = "menschen & gespräche";
  var BOOST_FAKTOR = 3;
  var EIGENE_KATEGORIE = "Eigene Themen";

  function claudePrompt(titel) {
    return (
      "Thema: " + titel + ". Ich recherchiere selbst und gebe dir gleich Stichpunkte. " +
      "Baue daraus eine Präsentation mit höchstens 5 Folien, ein Gedanke pro Folie, große Schrift, keine Fließtexte. " +
      "Erfinde keine Fakten und nutze nur meine Stichpunkte."
    );
  }

  function $(id) {
    return document.getElementById(id);
  }

  var el = {
    folge: $("folge"),
    filter: $("filter"),
    filterKnopf: $("filter-knopf"),
    filterText: $("filter-text"),
    topfZahl: $("topf-zahl"),
    filterMenue: $("filter-menue"),
    kategorien: $("kategorien"),
    mehrMenschen: $("mehr-menschen"),
    status: $("status"),
    titel: $("titel"),
    meta: $("meta"),
    kategorie: $("kategorie"),
    pruefen: $("pruefen"),
    hinweis: $("hinweis"),
    ansage: $("ansage"),
    ziehen: $("ziehen"),
    ziehenText: $("ziehen-text"),
    naechste: $("naechste"),
    prompt: $("prompt"),
    promptBox: $("prompt-box"),
    promptFeld: $("prompt-feld"),
    einstellungen: $("einstellungen"),
    timer: $("timer"),
    timerStatus: $("timer-status"),
    zeit: $("zeit"),
    balken: $("balken"),
    start: $("start"),
    startText: $("start-text"),
    zuruecksetzen: $("zuruecksetzen"),
    ueberspringen: $("ueberspringen"),
    panel: $("panel"),
    eigene: $("eigene"),
    eigeneInfo: $("eigene-info"),
    toene: $("toene"),
    fortschritt: $("fortschritt"),
    resetAlles: $("reset-alles"),
    resetFrage: $("reset-frage"),
    resetJa: $("reset-ja"),
    resetNein: $("reset-nein"),
    speicherWarnung: $("speicher-warnung"),
    panelFertig: $("panel-fertig"),
    toast: $("toast"),
  };

  /* ---------- Speicher (alles in try/catch) ---------- */

  var speicher = {
    lesen: function () {
      try {
        var roh = window.localStorage.getItem(SPEICHER_KEY);
        return roh ? JSON.parse(roh) : null;
      } catch (e) {
        return null;
      }
    },
    schreiben: function (daten) {
      try {
        window.localStorage.setItem(SPEICHER_KEY, JSON.stringify(daten));
        return true;
      } catch (e) {
        return false;
      }
    },
    verfuegbar: function () {
      try {
        var k = SPEICHER_KEY + ".test";
        window.localStorage.setItem(k, "1");
        window.localStorage.removeItem(k);
        return true;
      } catch (e) {
        return false;
      }
    },
  };

  var zustand = {
    folge: 1,
    gezogen: [],
    aktuell: null,
    aus: [],
    mehrMenschen: false,
    toene: true,
    eigeneText: "",
  };

  function istText(x) {
    return typeof x === "string";
  }

  function laden() {
    var d = speicher.lesen();
    if (!d || typeof d !== "object") return;
    if (typeof d.folge === "number" && d.folge >= 1 && Math.floor(d.folge) === d.folge) zustand.folge = d.folge;
    if (Array.isArray(d.gezogen)) zustand.gezogen = d.gezogen.filter(istText);
    if (Array.isArray(d.aus)) zustand.aus = d.aus.filter(istText);
    if (typeof d.mehrMenschen === "boolean") zustand.mehrMenschen = d.mehrMenschen;
    if (typeof d.toene === "boolean") zustand.toene = d.toene;
    if (istText(d.eigeneText)) zustand.eigeneText = d.eigeneText;
    var a = d.aktuell;
    if (a && typeof a === "object" && istText(a.id) && istText(a.titel)) {
      zustand.aktuell = {
        id: a.id,
        titel: a.titel,
        kategorie: istText(a.kategorie) ? a.kategorie : "",
        hinweis: istText(a.hinweis) ? a.hinweis : "",
        pruefen: a.pruefen === true,
      };
    }
  }

  function sichern() {
    speicher.schreiben(zustand);
  }

  /* ---------- Themen ---------- */

  var dateiThemen = [];
  var themenGeladen = false;
  var themenFehler = false;

  function themaId(titel) {
    return titel.toLocaleLowerCase("de-DE").replace(/\s+/g, " ").trim();
  }

  // Liest Zeilen im Format "Titel | Kategorie | Such-Hinweis".
  // nurUnterUeberschrift: in themen.md zählt erst alles ab der ersten ##-Überschrift.
  function themenLesen(text, nurUnterUeberschrift, standardKategorie) {
    var liste = [];
    var aktiv = !nurUnterUeberschrift;
    var ueberschrift = standardKategorie;
    var zeilen = text.split(/\r?\n/);
    for (var i = 0; i < zeilen.length; i++) {
      var zeile = zeilen[i].trim();
      if (!zeile) continue;
      var kopf = zeile.match(/^#{2,}\s*(.*)$/);
      if (kopf) {
        aktiv = true;
        ueberschrift = kopf[1].trim() || standardKategorie;
        continue;
      }
      if (zeile.charAt(0) === "#" || zeile.charAt(0) === ">" || !aktiv) continue;
      zeile = zeile.replace(/^[-*]\s+/, "");
      var teile = zeile.split("|").map(function (s) {
        return s.trim();
      });
      var roh = teile[0] || "";
      var pruefen = roh.indexOf("(?)") !== -1;
      var titel = roh.replace(/\(\?\)/g, "").replace(/\s+/g, " ").trim();
      if (!titel) continue;
      liste.push({
        id: themaId(titel),
        titel: titel,
        kategorie: teile[1] || ueberschrift || standardKategorie,
        hinweis: teile.slice(2).join(" | ").trim(),
        pruefen: pruefen,
      });
    }
    return liste;
  }

  function eigeneThemen() {
    return themenLesen(zustand.eigeneText, false, EIGENE_KATEGORIE);
  }

  function alleThemen() {
    var gesehen = {};
    var liste = [];
    dateiThemen.concat(eigeneThemen()).forEach(function (t) {
      if (gesehen[t.id]) return;
      gesehen[t.id] = true;
      liste.push(t);
    });
    return liste;
  }

  function alleKategorien() {
    var namen = [];
    alleThemen().forEach(function (t) {
      if (namen.indexOf(t.kategorie) === -1) namen.push(t.kategorie);
    });
    return namen;
  }

  function topf() {
    var gezogen = {};
    zustand.gezogen.forEach(function (id) {
      gezogen[id] = true;
    });
    return alleThemen().filter(function (t) {
      return !gezogen[t.id] && zustand.aus.indexOf(t.kategorie) === -1;
    });
  }

  function gewicht(t) {
    if (zustand.mehrMenschen && t.kategorie.toLocaleLowerCase("de-DE") === BOOST_KATEGORIE) return BOOST_FAKTOR;
    return 1;
  }

  function zufallszahl() {
    try {
      var a = new Uint32Array(1);
      window.crypto.getRandomValues(a);
      return a[0] / 4294967296;
    } catch (e) {
      return Math.random();
    }
  }

  function gewichtetWaehlen(liste) {
    var summe = 0;
    liste.forEach(function (t) {
      summe += gewicht(t);
    });
    var r = zufallszahl() * summe;
    for (var i = 0; i < liste.length; i++) {
      r -= gewicht(liste[i]);
      if (r < 0) return liste[i];
    }
    return liste[liste.length - 1];
  }

  /* ---------- Töne (WebAudio) ---------- */

  var ton = (function () {
    var ctx = null;

    function context() {
      if (!zustand.toene) return null;
      try {
        if (!ctx) {
          var AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return null;
          ctx = new AC();
        }
        if (ctx.state === "suspended") ctx.resume();
        return ctx;
      } catch (e) {
        return null;
      }
    }

    function piep(frequenz, verzoegerung, dauer, lautstaerke) {
      var c = context();
      if (!c) return;
      try {
        var t0 = c.currentTime + verzoegerung;
        var osc = c.createOscillator();
        var gain = c.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(frequenz, t0);
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(lautstaerke || 0.25, t0 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dauer);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(t0);
        osc.stop(t0 + dauer + 0.05);
      } catch (e) {
        /* Ton ist nur Zugabe */
      }
    }

    return {
      entsperren: function () {
        context();
      },
      start: function (verzoegerung) {
        piep(880, verzoegerung || 0, 0.2);
      },
      warnung: function () {
        piep(660, 0, 0.16);
        piep(660, 0.24, 0.16);
      },
      ende: function (schluss) {
        piep(784, 0, 0.24);
        piep(523, 0.26, 0.5);
        if (schluss) piep(392, 0.6, 0.8);
      },
    };
  })();

  /* ---------- Timer ---------- */

  var timer = {
    phase: "recherche",
    laeuft: false,
    rest: RECHERCHE_MS,
    ende: 0,
    warnungGespielt: false,
    intervall: null,
  };

  function phasenDauer(phase) {
    return phase === "sprechen" ? SPRECHEN_MS : RECHERCHE_MS;
  }

  function schleifeStarten() {
    if (timer.intervall) return;
    timer.intervall = window.setInterval(tick, 200);
  }

  function schleifeStoppen() {
    if (!timer.intervall) return;
    window.clearInterval(timer.intervall);
    timer.intervall = null;
  }

  function timerStart() {
    if (!zustand.aktuell || dreht || timer.laeuft || timer.phase === "fertig") return;
    ton.entsperren();
    timer.ende = Date.now() + timer.rest;
    timer.laeuft = true;
    ton.start();
    schleifeStarten();
    renderTimer();
  }

  function timerPause() {
    if (!timer.laeuft) return;
    timer.rest = Math.max(0, timer.ende - Date.now());
    timer.laeuft = false;
    schleifeStoppen();
    renderTimer();
  }

  function timerUmschalten() {
    if (timer.laeuft) timerPause();
    else timerStart();
  }

  function timerZuruecksetzen() {
    schleifeStoppen();
    timer.phase = "recherche";
    timer.laeuft = false;
    timer.rest = RECHERCHE_MS;
    timer.warnungGespielt = false;
    renderTimer();
  }

  function zumSprechen() {
    if (!zustand.aktuell || timer.phase !== "recherche") return;
    ton.entsperren();
    timer.phase = "sprechen";
    timer.rest = SPRECHEN_MS;
    timer.ende = Date.now() + SPRECHEN_MS;
    timer.laeuft = true;
    timer.warnungGespielt = true;
    ton.start();
    schleifeStarten();
    renderTimer();
  }

  function tick() {
    if (!timer.laeuft) return;
    var jetzt = Date.now();
    timer.rest = Math.max(0, timer.ende - jetzt);

    if (timer.phase === "recherche" && !timer.warnungGespielt && timer.rest <= WARNUNG_MS) {
      timer.warnungGespielt = true;
      if (timer.rest > 0) ton.warnung();
    }

    if (timer.rest <= 0 && timer.phase === "recherche") {
      // Recherche vorbei: Sprechen startet direkt. Ende rechnet vom Recherche-Ende,
      // damit die Zeit auch stimmt, wenn der Tab kurz im Hintergrund war.
      ton.ende(false);
      ton.start(1.0);
      timer.phase = "sprechen";
      timer.ende = timer.ende + SPRECHEN_MS;
      timer.rest = Math.max(0, timer.ende - jetzt);
    }

    if (timer.rest <= 0 && timer.phase === "sprechen") {
      ton.ende(true);
      timer.phase = "fertig";
      timer.laeuft = false;
      timer.rest = 0;
      schleifeStoppen();
    }

    renderTimer();
  }

  function zeitText(ms) {
    var s = Math.ceil(ms / 1000);
    var m = Math.floor(s / 60);
    var r = s % 60;
    return m + ":" + (r < 10 ? "0" : "") + r;
  }

  var letzteZeit = "";
  var letzterStatus = "";

  function renderTimer() {
    var hatThema = !!zustand.aktuell && !dreht;
    var gesamt = phasenDauer(timer.phase);
    var zustandName;
    if (!hatThema) zustandName = "gesperrt";
    else if (timer.phase === "fertig") zustandName = "fertig";
    else if (timer.laeuft) zustandName = "laeuft";
    else if (timer.rest < gesamt) zustandName = "pause";
    else zustandName = "bereit";

    el.timer.setAttribute("data-phase", timer.phase);
    el.timer.setAttribute("data-state", zustandName);
    document.body.classList.toggle("is-sprechen", timer.phase === "sprechen" || timer.phase === "fertig");

    var text = zeitText(timer.phase === "fertig" ? 0 : timer.rest);
    if (text !== letzteZeit) {
      letzteZeit = text;
      el.zeit.innerHTML = text
        .split("")
        .map(function (z) {
          return z === ":" ? '<span class="c">:</span>' : '<span class="d">' + z + "</span>";
        })
        .join("");
      el.zeit.setAttribute("aria-label", "Restzeit " + text);
    }

    var anteil = timer.phase === "fertig" ? 1 : 1 - timer.rest / gesamt;
    el.balken.style.transform = "scaleX(" + Math.min(1, Math.max(0, anteil)).toFixed(4) + ")";

    var status;
    if (!hatThema) status = dreht ? "Thema wird gezogen" : "Erst ein Thema ziehen";
    else if (timer.phase === "fertig") status = "Zeit ist um";
    else if (timer.phase === "sprechen") status = timer.laeuft ? "Jetzt sprechen" : "Sprechen pausiert";
    else if (timer.laeuft) status = "Recherche läuft";
    else if (zustandName === "pause") status = "Recherche pausiert";
    else status = "Bereit für die Recherche";
    if (status !== letzterStatus) {
      letzterStatus = status;
      el.timerStatus.textContent = status;
    }

    el.start.disabled = !hatThema || timer.phase === "fertig";
    el.start.classList.toggle("is-running", timer.laeuft);
    el.startText.textContent = timer.laeuft ? "Pause" : zustandName === "pause" ? "Weiter" : "Start";
    el.zuruecksetzen.disabled = !hatThema || zustandName === "bereit";
    el.ueberspringen.hidden = timer.phase !== "recherche";
    el.ueberspringen.disabled = !hatThema;
  }

  /* ---------- Ziehen mit Slot-Animation ---------- */

  var dreht = false;
  var reduzierteBewegung = false;
  try {
    reduzierteBewegung = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {
    reduzierteBewegung = false;
  }

  function slotTakte(gesamtMs) {
    // Erst schnell, dann langsamer werdend, zusammen ungefähr gesamtMs.
    var takte = [];
    var d = 45;
    var summe = 0;
    while (summe + d < gesamtMs) {
      takte.push(d);
      summe += d;
      d = d * 1.11;
    }
    takte.push(Math.max(60, gesamtMs - summe));
    return takte;
  }

  function titelSetzen(text, klasse) {
    el.titel.className = "reel-title";
    void el.titel.offsetWidth; // Animation neu starten
    el.titel.textContent = text;
    if (klasse) el.titel.classList.add(klasse);
  }

  function ziehen() {
    if (dreht || zustand.aktuell || !themenGeladen) return;
    var kandidaten = topf();
    if (!kandidaten.length) {
      render();
      return;
    }
    var ziel = gewichtetWaehlen(kandidaten);
    var anzeige = kandidaten.length > 2 ? kandidaten : alleThemen();
    dreht = true;
    el.promptBox.hidden = true;
    render();

    var takte = slotTakte(reduzierteBewegung ? 500 : SLOT_MS);
    var vorher = "";
    var i = 0;

    function naechsterTakt() {
      if (i < takte.length - 1) {
        var kandidat = anzeige[Math.floor(zufallszahl() * anzeige.length)];
        if (anzeige.length > 1 && kandidat.titel === vorher) {
          kandidat = anzeige[(anzeige.indexOf(kandidat) + 1) % anzeige.length];
        }
        vorher = kandidat.titel;
        titelSetzen(kandidat.titel, "is-spinning");
        window.setTimeout(naechsterTakt, takte[i]);
        i++;
        return;
      }
      window.setTimeout(landen, takte[takte.length - 1]);
    }

    function landen() {
      dreht = false;
      zustand.aktuell = {
        id: ziel.id,
        titel: ziel.titel,
        kategorie: ziel.kategorie,
        hinweis: ziel.hinweis,
        pruefen: ziel.pruefen,
      };
      if (zustand.gezogen.indexOf(ziel.id) === -1) zustand.gezogen.push(ziel.id);
      sichern();
      timerZuruecksetzen();
      render(true);
      el.ansage.textContent = "Thema: " + ziel.titel + ". Kategorie: " + ziel.kategorie + ".";
    }

    naechsterTakt();
  }

  function naechsteFolge() {
    if (dreht || !zustand.aktuell) return;
    zustand.folge += 1;
    zustand.aktuell = null;
    sichern();
    timerZuruecksetzen();
    el.promptBox.hidden = true;
    render();
    zeigeToast("Folge " + zustand.folge + ". Neues Thema ziehen.");
  }

  function allesZuruecksetzen() {
    zustand.folge = 1;
    zustand.gezogen = [];
    zustand.aktuell = null;
    sichern();
    timerZuruecksetzen();
    el.promptBox.hidden = true;
    el.resetFrage.hidden = true;
    el.resetAlles.hidden = false;
    render();
    zeigeToast("Alles zurückgesetzt");
  }

  /* ---------- Claude-Prompt kopieren ---------- */

  function kopierenFallback(text) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "0";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch (e) {
      return false;
    }
  }

  var promptTimeout = null;

  function promptKopieren() {
    if (!zustand.aktuell || dreht) return;
    var text = claudePrompt(zustand.aktuell.titel);

    function erfolg() {
      el.promptBox.hidden = true;
      el.prompt.classList.add("is-done");
      window.clearTimeout(promptTimeout);
      promptTimeout = window.setTimeout(function () {
        el.prompt.classList.remove("is-done");
      }, 2000);
      zeigeToast("Prompt kopiert. Jetzt in Claude einfügen.");
    }

    function fehlschlag() {
      if (kopierenFallback(text)) {
        erfolg();
        return;
      }
      el.promptFeld.value = text;
      el.promptBox.hidden = false;
      el.promptFeld.focus();
      el.promptFeld.select();
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(erfolg, fehlschlag);
        return;
      }
    } catch (e) {
      /* weiter mit Fallback */
    }
    fehlschlag();
  }

  /* ---------- Anzeige ---------- */

  var toastTimeout = null;

  function zeigeToast(text) {
    el.toast.textContent = text;
    el.toast.classList.add("is-visible");
    window.clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(function () {
      el.toast.classList.remove("is-visible");
    }, 2400);
  }

  function laengenKlasse(titel) {
    if (titel.length > 38) return "is-xlong";
    if (titel.length > 20) return "is-long";
    return "";
  }

  function render(gelandet) {
    var offen = topf();
    var alle = alleThemen();
    var a = zustand.aktuell;

    el.folge.textContent = String(zustand.folge);

    if (!dreht) {
      if (a) {
        el.status.textContent = "Dein Thema";
        titelSetzen(a.titel, laengenKlasse(a.titel));
        if (gelandet) el.titel.classList.add("is-landed");
        el.kategorie.textContent = a.kategorie;
        el.pruefen.hidden = !a.pruefen;
        el.meta.hidden = false;
        if (a.hinweis) {
          el.hinweis.innerHTML = "";
          var label = document.createElement("strong");
          label.textContent = "Such-Hinweis: ";
          el.hinweis.appendChild(label);
          el.hinweis.appendChild(document.createTextNode(a.hinweis));
          el.hinweis.hidden = false;
        } else {
          el.hinweis.hidden = true;
        }
      } else {
        el.meta.hidden = true;
        el.hinweis.hidden = true;
        if (!themenGeladen) {
          el.status.textContent = "Lädt";
          titelSetzen("Themen werden geladen", "is-placeholder");
        } else if (!alle.length) {
          el.status.textContent = "Keine Themen";
          titelSetzen("Themenliste fehlt", "is-placeholder");
          el.hinweis.textContent = themenFehler
            ? "themen.md konnte nicht geladen werden. Eigene Themen gehen trotzdem, über Einstellungen."
            : "Ergänze Themen in themen.md oder über Einstellungen.";
          el.hinweis.hidden = false;
        } else if (!offen.length) {
          var gezogenSet = {};
          zustand.gezogen.forEach(function (id) {
            gezogenSet[id] = true;
          });
          var offenGesamt = alle.filter(function (t) {
            return !gezogenSet[t.id];
          }).length;
          var aktiveKategorien = alleKategorien().filter(function (k) {
            return zustand.aus.indexOf(k) === -1;
          }).length;
          if (!aktiveKategorien) {
            el.status.textContent = "Filter";
            titelSetzen("Keine Kategorie ausgewählt", "is-placeholder");
            el.hinweis.textContent = "Wähl oben mindestens eine Kategorie aus.";
          } else if (offenGesamt) {
            el.status.textContent = "Filter";
            titelSetzen("In diesen Kategorien ist alles durch", "is-placeholder");
            el.hinweis.textContent =
              "Wähl oben weitere Kategorien aus. In den anderen " +
              (offenGesamt === 1 ? "ist noch 1 Thema" : "sind noch " + offenGesamt + " Themen") +
              " offen.";
          } else {
            el.status.textContent = "Alle durch";
            titelSetzen("Alle Themen waren schon dran", "is-placeholder");
            el.hinweis.textContent = "Ergänze eigene Themen oder setz in den Einstellungen alles zurück.";
          }
          el.hinweis.hidden = false;
        } else {
          el.status.textContent = "Bereit";
          titelSetzen("Was ist heute dran?", "is-placeholder");
        }
      }
    } else {
      el.status.textContent = "Wird gezogen";
      el.meta.hidden = true;
      el.hinweis.hidden = true;
    }

    var gesperrt = !!a;
    el.ziehen.disabled = dreht || gesperrt || !themenGeladen || !offen.length;
    el.ziehen.classList.toggle("is-locked", gesperrt);
    el.ziehenText.textContent = gesperrt ? "Thema gezogen" : "Thema ziehen";
    el.ziehen.title = gesperrt ? "Neues Thema erst nach Nächste Folge" : "";
    el.naechste.disabled = dreht || !a;
    el.prompt.disabled = dreht || !a;

    el.topfZahl.textContent = themenGeladen ? String(offen.length) : "";
    el.topfZahl.title = offen.length === 1 ? "1 Thema im Topf" : offen.length + " Themen im Topf";

    renderFilter();
    renderPanelInfo();
    renderTimer();
  }

  function renderFilter() {
    var kategorien = alleKategorien();
    var aktiv = kategorien.filter(function (k) {
      return zustand.aus.indexOf(k) === -1;
    });
    if (!kategorien.length || aktiv.length === kategorien.length) el.filterText.textContent = "Alle Kategorien";
    else if (!aktiv.length) el.filterText.textContent = "Keine Kategorie";
    else if (aktiv.length === 1) el.filterText.textContent = aktiv[0];
    else el.filterText.textContent = aktiv.length + " von " + kategorien.length + " Kategorien";

    var gezogen = {};
    zustand.gezogen.forEach(function (id) {
      gezogen[id] = true;
    });
    var offenProKategorie = {};
    alleThemen().forEach(function (t) {
      if (!gezogen[t.id]) offenProKategorie[t.kategorie] = (offenProKategorie[t.kategorie] || 0) + 1;
    });

    // Checkboxen nur neu bauen, wenn sich die Kategorien geändert haben.
    var schluessel = kategorien.join("\n");
    if (schluessel !== filterSchluessel) {
      filterSchluessel = schluessel;
      filterZeilen = {};
      el.kategorien.innerHTML = "";
      kategorien.forEach(function (k) {
        var label = document.createElement("label");
        label.className = "check";
        var input = document.createElement("input");
        input.type = "checkbox";
        input.addEventListener("change", function () {
          if (input.checked) {
            zustand.aus = zustand.aus.filter(function (x) {
              return x !== k;
            });
          } else if (zustand.aus.indexOf(k) === -1) {
            zustand.aus.push(k);
          }
          sichern();
          render();
        });
        var name = document.createElement("span");
        name.className = "check-name";
        name.textContent = k;
        var zahl = document.createElement("span");
        zahl.className = "check-count";
        label.appendChild(input);
        label.appendChild(name);
        label.appendChild(zahl);
        el.kategorien.appendChild(label);
        filterZeilen[k] = { input: input, zahl: zahl };
      });
    }

    kategorien.forEach(function (k) {
      var zeile = filterZeilen[k];
      zeile.input.checked = zustand.aus.indexOf(k) === -1;
      zeile.zahl.textContent = "noch " + (offenProKategorie[k] || 0);
    });

    el.mehrMenschen.checked = zustand.mehrMenschen;
  }

  var filterSchluessel = null;
  var filterZeilen = {};

  function renderPanelInfo() {
    var alle = alleThemen().length;
    var gezogen = zustand.gezogen.length;
    el.fortschritt.textContent =
      "Folge " + zustand.folge + ". " + gezogen + " von " + alle + (alle === 1 ? " Thema" : " Themen") + " schon gezogen.";
    var eigene = eigeneThemen().length;
    el.eigeneInfo.textContent =
      eigene === 0 ? "Noch keine eigenen Themen." : eigene === 1 ? "1 eigenes Thema erkannt." : eigene + " eigene Themen erkannt.";
  }

  /* ---------- Filter-Menü ---------- */

  function filterOeffnen(offen) {
    el.filterMenue.hidden = !offen;
    el.filter.classList.toggle("is-open", offen);
    el.filterKnopf.setAttribute("aria-expanded", offen ? "true" : "false");
  }

  el.filterKnopf.addEventListener("click", function () {
    filterOeffnen(el.filterMenue.hidden);
  });

  document.addEventListener("click", function (e) {
    if (!el.filterMenue.hidden && !el.filter.contains(e.target)) filterOeffnen(false);
  });

  el.mehrMenschen.addEventListener("change", function () {
    zustand.mehrMenschen = el.mehrMenschen.checked;
    sichern();
  });

  /* ---------- Einstellungen ---------- */

  function panelOeffnen() {
    filterOeffnen(false);
    el.resetFrage.hidden = true;
    el.resetAlles.hidden = false;
    el.eigene.value = zustand.eigeneText;
    el.toene.checked = zustand.toene;
    el.speicherWarnung.hidden = speicher.verfuegbar();
    renderPanelInfo();
    try {
      if (typeof el.panel.showModal === "function") el.panel.showModal();
      else el.panel.setAttribute("open", "");
    } catch (e) {
      el.panel.setAttribute("open", "");
    }
  }

  function panelSchliessen() {
    eigeneUebernehmen();
    try {
      if (typeof el.panel.close === "function") el.panel.close();
      else el.panel.removeAttribute("open");
    } catch (e) {
      el.panel.removeAttribute("open");
    }
  }

  function eigeneUebernehmen() {
    if (el.eigene.value === zustand.eigeneText) return;
    zustand.eigeneText = el.eigene.value;
    sichern();
    render();
  }

  var eigeneTimeout = null;
  el.eigene.addEventListener("input", function () {
    window.clearTimeout(eigeneTimeout);
    eigeneTimeout = window.setTimeout(eigeneUebernehmen, 350);
  });

  el.einstellungen.addEventListener("click", panelOeffnen);
  el.panelFertig.addEventListener("click", panelSchliessen);
  el.panel.addEventListener("click", function (e) {
    if (e.target === el.panel) panelSchliessen();
  });
  el.panel.addEventListener("close", eigeneUebernehmen);

  el.toene.addEventListener("change", function () {
    zustand.toene = el.toene.checked;
    sichern();
    if (zustand.toene) ton.start();
  });

  el.resetAlles.addEventListener("click", function () {
    el.resetAlles.hidden = true;
    el.resetFrage.hidden = false;
    el.resetNein.focus();
  });
  el.resetNein.addEventListener("click", function () {
    el.resetFrage.hidden = true;
    el.resetAlles.hidden = false;
    el.resetAlles.focus();
  });
  el.resetJa.addEventListener("click", function () {
    allesZuruecksetzen();
    panelSchliessen();
  });

  /* ---------- Buttons und Tastatur ---------- */

  el.ziehen.addEventListener("click", ziehen);
  el.naechste.addEventListener("click", naechsteFolge);
  el.prompt.addEventListener("click", promptKopieren);
  el.start.addEventListener("click", timerUmschalten);
  el.zuruecksetzen.addEventListener("click", timerZuruecksetzen);
  el.ueberspringen.addEventListener("click", zumSprechen);

  function istEingabe(ziel) {
    if (!ziel || !ziel.closest) return false;
    return !!ziel.closest("input, textarea, select, [contenteditable='true']");
  }

  function istLeertaste(e) {
    return e.code === "Space" || e.key === " " || e.key === "Spacebar";
  }

  var leertasteAbgefangen = false;

  document.addEventListener("keydown", function (e) {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
    if (el.panel.open) return;

    if (e.key === "Escape" && !el.filterMenue.hidden) {
      filterOeffnen(false);
      el.filterKnopf.focus();
      return;
    }

    if (istEingabe(e.target)) return;

    if (istLeertaste(e)) {
      // Leertaste gehört immer der Seite, nicht dem gerade fokussierten Button.
      e.preventDefault();
      leertasteAbgefangen = true;
      if (e.repeat) return;
      if (!zustand.aktuell) ziehen();
      else timerUmschalten();
      return;
    }

    if ((e.key === "n" || e.key === "N") && !e.repeat) {
      naechsteFolge();
    }
  });

  document.addEventListener("keyup", function (e) {
    if (leertasteAbgefangen && istLeertaste(e)) {
      e.preventDefault();
      leertasteAbgefangen = false;
    }
  });

  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) tick();
  });

  /* ---------- Start ---------- */

  laden();
  render();

  function themenLaden() {
    var fertig = function (text) {
      dateiThemen = themenLesen(text, true, "Ohne Kategorie");
      themenGeladen = true;
      render();
    };
    var fehler = function () {
      themenFehler = true;
      themenGeladen = true;
      render();
    };
    try {
      window
        .fetch("themen.md", { cache: "no-cache" })
        .then(function (antwort) {
          if (!antwort.ok) throw new Error("HTTP " + antwort.status);
          return antwort.text();
        })
        .then(fertig, fehler);
    } catch (e) {
      fehler();
    }
  }

  themenLaden();
})();
