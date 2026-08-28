# Spec: ConferenceFinder — föderiertes A2UI-Vokabular mit Native Federation

Status: Entwurf v3.2, 2026-08-27. Projekt: **ConferenceFinder**. Eigene App ohne Flights-Bezug.
Hintergrundwissen: `docs/book-learnings.md`. Taskzuschnitt folgt später per `/plan` je Meilenstein. Diese Spec wandert als `docs/spec.md` ins Projekt-Repo, sobald es existiert.

## 0. Leitgedanke (Anker für README, Post und Talk)

**Föderierbares Vokabular — föderierbare Primitive für Agentic UI.**

Ein A2UI-Katalog ist die Sprache, in der ein Modell Oberflächen komponiert. Native Federation macht diese Sprache föderierbar: Teams liefern Primitive, Funktionen und Container als Remotes, und das Modell komponiert aus allem, was gerade geladen ist — Anzeigen, Eingaben und deren Verdrahtung, passend zur Anfrage.

Die These in einem Satz: *Die Anfrage bestimmt, welche Ein- und Ausgaben zusammengestellt und wie sie verdrahtet werden; das Vokabular bestimmt, was möglich ist; Native Federation bestimmt, wer Vokabular liefert.*

Der Unterschied zum Plugin-System ist zeigbar, nicht nur behauptbar: Ein Klick in der Karte (Maps-Remote) wechselt Name, Countdown, Distanz, Restkarten-Gauge (Charts-Remote) und Website (Embed-Remote) — verbunden über einen Pfad im Datenmodell, den das Modell gewählt hat, ohne Modellaufruf, ohne dass ein Remote das andere kennt. Ein Plugin-System stellt Widgets nebeneinander; föderiertes Vokabular lässt sie ineinandergreifen.

Was den Unterschied ausmacht, ist subtil, und Charts und Karten hat jeder schon gesehen. Deshalb müssen README und Post das Argument explizit führen: die Formel, der Klick-Kaskaden-Moment, der Live-Moment „Remote dazu → Fähigkeit da", und die Regel, wann sich das lohnt (Abschnitt 1). Die Architektur ist Konvergenz, kein Kompromiss: keine Server-Tools → Agent trivial → statisches Hosting; Client montiert Daten → weniger Tokens und dauerhaft gültige Aufnahmen; Offsets → fiktive Daten → eigene Demo-Seiten.

## 1. Ziel und Pointe

Ein **dynamisches Abfrage-UI**: Der User stellt eine Frage in natürlicher Sprache („Wann ist die nächste Angular-Konferenz in meiner Nähe?"), das Modell komponiert aus einem Katalog die passenden Ein- und Ausgaben und verdrahtet sie über ein gemeinsames Datenmodell. Der Katalog ist **föderiert**: Plattform-Teams liefern neutrales Vokabular als Native-Federation-Remotes — Charts, Karten, Einbettungen. Die Domäne (Konferenzen, Tickets, mein Standort) lebt allein in der Shell.

Die Formel: *Die Anfrage bestimmt, welche Ein-/Ausgaben zusammengestellt und wie sie verdrahtet werden; das Vokabular bestimmt, was möglich ist; Native Federation bestimmt, wer Vokabular liefert.*

Warum das kein Plugin-System ist — die Demo zeigt es, sie behauptet es nicht:

1. **Neutrale Primitive multiplizieren die Antwortmöglichkeiten.** Eine Karte zeigt alles mit Koordinaten, eine Zeitachse alles mit Datum. Mehr Remotes → mehr *Arten* von Antworten auf *beliebige* Fragen.
2. **Primitive verschiedener Remotes sind über Pfade verdrahtet.** `Map.selected → /conf`, `Gauge.value ← /conf/remaining`, `WebFrame.url ← /conf/url`. Kein Remote kennt das andere; die Kopplung ist ein Pfad, den das Modell gewählt hat.
3. **Container eines Remotes halten Primitive eines anderen.** `ChartGrid` (Charts) mit `Map` (Maps) als Kind.
4. **Teams erweitern die Ausdruckssprache.** Katalog-Funktionen (`distance`, `daysUntil`) laufen in gewöhnlichen `Text`-Komponenten.
5. **Domänenaktionen bleiben in der Shell.** „Reservieren" ist ein Basic-`Button` mit `action: reserve`; der Handler gehört der Shell, nicht einem Remote.

Wann sich das lohnt (README-Regel): mehrere Teams, Anfragen quer zu den Teams, UIs, die niemand vorgebaut hat. Fehlt eine Bedingung, reicht ein Widget-Tool.

## 2. Demo-Anfragen (in Steigerung)

| # | Anfrage | Was entsteht | Beweist |
|---|---|---|---|
| 1 | „Welche Angular-Konferenzen gibt es in den nächsten Monaten?" | `Timeline` an `/confs` (vom Client montiert) | Remote liefert Ausgabe-Vokabular |
| 2 | „Zeig sie auf einer Karte" | `Map` an `/confs`, `center ← /me` | zweites Remote, gleicher Pfad |
| 3 | „Wann ist die nächste in meiner Nähe? Wenn ich eine anklicke, will ich Details." | `Row [ Map(selected → /conf), Column [ Text /conf/name, Text daysUntil(/conf/date), Text distance(/me, /conf), Gauge(/conf/remaining, /conf/capacity), Button reserve, WebFrame(/conf/url) ] ]`, `/conf` mit der nächsten vorbelegt | **Auswahl in einem Remote treibt Anzeige in drei anderen Ursprüngen — ohne Modell-Roundtrip** |
| 4 | „Reservier mir eine Karte" (Klick auf den Button) | `action: reserve { id: { path: '/conf/id' } }` → Shell-Handler → Store → `updateDataModel /conf/remaining` → `Gauge` sinkt | Domänenaktion ohne Modell, Vokabular neutral |
| 5 | „Vergleiche .NET- und Angular-Konferenzen nach Monat, Karte daneben" | `ChartGrid [ BarChart(/byMonth, selected → /month), Map(points ← /confs, filter ← /month) ]` | Verschachtelung über Remote-Grenzen, Chart-Klick filtert Karte |
| 6 | „Für welche soll ich die Website öffnen?" (Rückfrage) | `Map(selected → /pick)` + `Button submitAnswer { id: { path: '/pick/id' } }` | Team-Eingabe im vom Modell gebauten Formular (Buch-Muster, Karte statt TextField) |

**Live-Momente:**
- Ohne `mfe-maps` beantwortet das Modell Anfrage 2 mit `Timeline` + Text („keine Karte verfügbar"). Remote ins Manifest, Reload → Karte. `context[]` im Request zeigt das neue Vokabular; `agent/` unverändert.
- `mfe-embed` ist das dritte Remote und in 30 Minuten gebaut: vorher „Website: <Link>", nachher eingebettet. Zeigt, dass ein Vokabular-Remote klein ist.

## 3. Architektur

### 3.1 Aufteilung

| Einheit | Inhalt | Port |
|---|---|---|
| **Shell** | Chat, A2UI-Renderer + Basic Catalog, Client-Tool `renderSurface` (3.5), Datentool `findConferences`, `ConferenceStore`, Handler `reserve` und `submitAnswer`, Standort (Geolocation, Fallback Stadtwahl) als Kontext-Entry `/me`, Capability-Loader, Panel „geladene Remotes und ihr Vokabular", Beispiel-Prompts als Buttons (Anfragen 1–6; Basis für den Replay-Modus) | 4200 |
| **`mfe-charts`** | `Timeline`, `BarChart`, `Gauge`, `ChartGrid`, Fn `daysUntil` | 4201 |
| **`mfe-maps`** | `Map`, Fn `distance` | 4202 |
| **`mfe-embed`** | `WebFrame` | 4203 |
| **`agent`** | ein Mastra-Agent, Prompt, offizieller `@ag-ui/mastra`-Adapter, Provider Anthropic/OpenAI/DeepSeek per Config, **keine Server-Tools** | 3001 |

Basic Catalog bleibt in der Shell; Eingaben außer Karten-/Chart-/Timeline-Auswahl kommen von dort (`ChoicePicker` für Themen, `DateTimeInput`, `TextField`, `Button`).

### 3.2 Capability-Vertrag

```ts
// libs/capabilities/agent-capabilities.ts — geteilt von Shell und Remotes
export interface AgentCapabilities {
  name: string;                                   // 'charts'
  catalog?: {
    components: A2uiCustomCatalogComponent[];     // name, description, schema (zod/v3), component
    functions?: A2uiCustomCatalogFunction[];      // name, description, returnType, schema, execute
  };
  frontendTools?: FrontendToolConfig<any>[];      // optional
  actionHandlers?: Handlers;                      // optional
}
```

Die Shell besitzt die `agentId`; Remotes kennen keine Agent-Ids.

### 3.3 Bootstrap-Sequenz

```
main.ts:      initFederation('federation.manifest.json') → import('./bootstrap')
bootstrap.ts: remotes = resolveCapabilityRemotes()           // Manifest ∩ ?capabilities=
              caps    = await Promise.all(remotes.map(r => loadRemoteModule(r, './capabilities')))
              bootstrapApplication(App, appConfig(caps))
appConfig:    provideA2uiCatalog(mergeCatalog(caps)), { provide: AGENT_CAPABILITIES, useValue: caps }
Agent Store:  initAgentStore({ agentId, url, frontendTools: [renderSurface, findConferences, ...], context: [catalog, me] })
```

Nicht erreichbares Remote → loggen, überspringen. Bindung zur Bootstrap-Zeit; Toggle = Reload.

### 3.4 Bindung

- **Manifest = Deployment.** Remote im Manifest und erreichbar → Vokabular da.
- **Bühnen-Schalter:** `?capabilities=charts,maps,embed` (Whitelist gegen das Manifest).
- **Seam für später:** `resolveCapabilityRemotes()` ist die einzige entscheidende Stelle.

### 3.5 A2UI-Transport: Client-Tool (entschieden)

`renderSurface({ messages })` ist ein Frontend-Tool mit `component` (ToolRenderer → `SurfaceComponent`), `followUp: false`. Der Client validiert mit `A2uiMessageListWrapperSchema` aus `web_core` und gegen den Katalog; bei Fehlern gibt der Handler `{ ok: false, result: <Issues> }` zurück, `followUp` greift, das Modell korrigiert.

Der Agent-Server weiß nichts von A2UI; der offizielle Adapter reicht. Umstieg auf `ACTIVITY_SNAPSHOT` bleibt möglich, ohne Katalog oder Primitive anzufassen.

**Datenmontage durch den Client.** Das Modell kopiert Tool-Ergebnisse **nie** in `updateDataModel`. Der `renderSurface`-Handler montiert nach den Nachrichten des Modells die zuletzt geladenen Daten selbst ins Datenmodell der Surface: `/confs` (letztes `findConferences`-Ergebnis), `/me` (Standort). Das Modell bindet nur Pfade (`points: { path: '/confs' }`). Gründe: Struktur vom Modell, Daten vom Code (DSL-Erkenntnis aus dem Buch, auf den Client übertragen); deutlich weniger Tokens; keine abgeschriebenen Zahlen; Replay-Aufnahmen (M4) enthalten nur Struktur und bleiben mit dem Offset-Datenmodell (Abschnitt 5) dauerhaft gültig. Abgeleitete Sichten (`/byMonth`, `/byTopic`) liefert das Tool auf Anfrage (`groupBy`), nicht das Modell.

### 3.6 Katalog-Merge und Kontext

- Ein gemergter Katalog, eigene Id (`https://<projekt>/catalogs/assistant`), Fragmente als `extraComponents`, Funktionen als `[...BASIC_FUNCTIONS, ...Remote-Funktionen]`; Namenskollisionen werden beim Merge geloggt.
- Kontext-Entry fürs Modell serialisiert **Komponenten und Funktionen** (Buch: nur Komponenten). Zweiter Kontext-Entry: `me` (Standort, Name der Stadt) — damit „in meiner Nähe" ohne Tool-Roundtrip aufgelöst werden kann.
- `sendCatalogDescription: true`. Prod-Hinweis in der README: Registry aus Remote-Metadaten.

### 3.7 Tooling und Repo

- Neues Repo `~/projects/conference-finder` (MIT), getrennt vom Notiz-Repo `~/projects/a2ui`. Angular-CLI-Workspace (kein Nx), npm, Node LTS. Projekte: `shell` (Default), `projects/mfe-charts`, `projects/mfe-maps`, `projects/mfe-embed`, `agent/` (Mastra, eigenes `package.json`), `libs/capabilities`.
- Versionen: Angular 21.x, `@copilotkit/angular` 0.3.x, `@a2ui/angular` 0.10.x, `@a2ui/web_core` 0.10.x, `@ag-ui/*` 0.0.57+, `@angular-architects/native-federation` passend zu Angular 21 (in M2 prüfen), Mastra 1.x mit Providern Anthropic/OpenAI/DeepSeek.
- npm-Scripts: `start` (Shell + alle Remotes + Agent parallel), `start:shell`, `start:charts`, `start:maps`, `start:embed`, `start:agent`, `capture` (M4), `test`, `eval`.
- `.env.example` mit den drei Provider-Keys; Modell per `agent/config.ts` wählbar.
- **M1-Prüfpunkt Chat-UI:** Liefert `@copilotkit/angular` 0.3 eine fertige Chat-Komponente, die registrierte `ToolRenderer` darstellt? Wenn ja, nutzen (spart Zeit). Sonst headless nach Buch-Muster (`chat-messages` mit `copilot-render-tool-calls`).

### 3.8 Shared Dependencies

`@angular/*`, `@a2ui/angular`, `@a2ui/web_core`, `@copilotkit/angular`, `@ag-ui/core`, `@ag-ui/client`, `zod` (inkl. `zod/v3`), `rxjs` — singleton, strictVersion. Keine Chart-/Karten-Bibliothek: alles SVG.

## 4. Primitive

Alle Props sind `binding(...)`. Eingabe-Primitive schreiben über `props().selected.onUpdate(obj)` → `dataContext.set(path, obj)`; bei Literal No-op (Prompt-Regel). **Auswahl schreibt das ganze Element, nicht die Id** — dann binden Basic-Komponenten direkt `/conf/name`, `/conf/url` usw. Optionales `action` (`ActionSchema`) macht aus dem Klick zusätzlich ein Client-Event.

| Remote | Primitive | liest | Klick schreibt | `action` | Bemerkung |
|---|---|---|---|---|---|
| charts | `Timeline` | `items: {id, label, date, …}[]`, `range?`, `selected?` | `selected` (Element) | optional | horizontale Zeitachse, SVG |
| charts | `BarChart` | `data: {label, value, …}[]`, `selected?` | `selected` (Element) | optional | SVG |
| charts | `Gauge` | `value`, `max`, `label?` | — | — | Restkarten |
| charts | `ChartGrid` | `children: ChildList`, `columns?` | — | — | Container via `ComponentHost` |
| charts | Fn `daysUntil(date)` → number | | | | „in 42 Tagen" mit `formatString` |
| maps | `Map` | `points: {id, label, lat, lon, …}[]`, `center?`, `filter?`, `selected?`, `mode?` | `selected` (Element) | optional | SVG-Scatter über Bounding-Box, Umriss |
| maps | Fn `distance(a, b)` → km | | | | Haversine |
| embed | `WebFrame` | `url`, `height?` | — | — | `sandbox`, kein Script-Zugriff auf die Shell |

Elemente in `items`/`points`/`data` dürfen **beliebige Zusatzfelder** tragen; die Primitive reichen sie beim Schreiben von `selected` unverändert durch. Das ist der Mechanismus, der Detailansichten ohne Lookup-Funktion möglich macht.

Listen-Templates (`children: { componentId, path }`) sind im Renderer vorhanden — eine Komponente pro Array-Element mit eigenem `basePath`; für Legenden und Karten-Listen nutzbar, gehört in die Prompt-Beispiele.

## 5. Daten, Standort, Domänenlogik (Shell)

- `data/conferences.json`: ~30 **fiktive, plausible** Konferenzen (Name mit Themenbezug wie „ng-summit Berlin", Thema `angular | dotnet | web | ai | …`, reale Stadt + GPS, `capacity`, `remaining`, `price`) mit **`dayOffset` statt Datum**. Der Loader setzt bei jedem Aufruf `date = heute + dayOffset`: Die Demo veraltet nie, „die nächste" existiert immer, der Countdown ist immer sinnvoll. Reale Konferenzen bewusst nicht — erfundene Termine zu echten Events wären Falschinformation.
- Website pro Konferenz: kleine statische Demo-Seite aus der Shell (`/conf-sites/<id>.html`), damit `WebFrame` immer einbetten kann.
- Client-Tool `findConferences({ topic?, withinDays?, nearKm?, limit?, groupBy? })` → Array inkl. `distanceKm` (berechnet mit `/me`) und optional abgeleitete Sichten; der Client montiert das Ergebnis unter `/confs` (3.5), das Modell bindet nur.
- `/me`: Geolocation nach Erlaubnis, sonst Stadtwahl; als Kontext-Entry und im Datenmodell.
- `ConferenceStore` (Signal Store): Reservierungen lokal. Handler `reserve(action)` → Store → `renderer.processMessages([updateDataModel /conf/remaining …])` und `/confs/<i>/remaining` (Buch-Muster `increaseMiles`). Kein Modell beteiligt.
- Handler `submitAnswer` → Developer-Message an den Agenten (Buch-Muster).

## 6. Prompt-Grundsätze (Agent)

- Output-Regeln nach Buch-Muster: Daten **zuerst** per Tool holen, dann `renderSurface` **einmal**, dann stoppen; Text über `messageWidget`.
- A2UI-Formatregeln mit zwei Beispielen (Version, `component`-Feld, flache Liste, `child` vs `children`).
- **Verdrahtungsregel — lokal bevorzugen:** Beschreibt der User eine Interaktion, deren Daten schon da sind, verdrahte sie per Bindung in *einer* Surface (`selected` auf einen Pfad, alle Detailanzeigen auf Unterpfade davon, Startwert setzen). **Nie** dafür eine Rückfrage bauen. Nur wenn die Interaktion neue Daten oder eine Entscheidung des Agenten braucht → `Button` mit `submitAnswer` und `{ path }`-Kontext.
- **Pfad statt Literal** für alles, was sich ändern oder zurückkommen soll.
- **Daten nie kopieren:** `findConferences`-Ergebnisse liegen unter `/confs`, der Standort unter `/me` — binden, nicht abschreiben. Zeitangaben und Distanzen im UI über `daysUntil`/`formatDate`/`distance` in der Surface, nicht im Text ausrechnen.
- Domänenaktionen: genau ein Client-Event `reserve { id: { path } }`; keine anderen Event-Namen erfinden.
- Katalogabschnitt (Komponenten + Funktionen) und `me` aus dem Kontext. Fehlt Vokabular: sagen, was fehlt, beste verfügbare Darstellung wählen, nie Namen erfinden.

## 7. Tests

Damit jede Task als „Diff + Test" landen kann (Vorgabe für `/plan`):

| Ebene | Was | Wie |
|---|---|---|
| Pure Functions | `mergeCatalog`, Kontext-Serialisierung (Komponenten + Funktionen), `resolveCapabilityRemotes`, `findConferences`-Filter/Distanz, `dayOffset`-Loader, `daysUntil`, `distance`, Datenmontage-Guard (`/confs`, `/me` abgelehnt) | Vitest, Node |
| Primitive | jede Katalogkomponente mit gebundenen Props: rendert, `selected.onUpdate` wird mit dem ganzen Element gerufen, `action` dispatcht | Vitest Browser Mode (Buch Kap. 9), `BoundProperty`-Fakes wie `initialProperty` im Buch |
| Renderer-Integration | `renderSurface`-Handler: valide Nachrichten → Surface erscheint, Daten montiert; invalide → `{ ok: false, result }`; Klick auf `Map` aktualisiert gebundenen `Text` ohne Netzwerk | Vitest Browser Mode mit echtem `A2uiRendererService` |
| Agent-Loop ohne Modell | Agent-Store mit `ReplayAgent`/Mock-Agent (Kap. 9): Anfrage → aufgezeichnete Events → Surface | Vitest Browser Mode; dieselben Aufnahmen wie M4 |
| Modell-Verhalten | Anfragen 1–6 gegen das echte Modell, Erfolgsquote ≥ 4/5 | manuelles Skript `npm run eval`, nicht in CI |

Sheriff wie im Buch-Repo für Modulgrenzen (Shell importiert keine Remotes; Remotes kennen nur `libs/capabilities` und die A2UI-/CopilotKit-Typen).

## 8. Meilensteine

**M1 — Spike im Monolith (kein NF).** Agent + Shell + `renderSurface` + `findConferences` + `Timeline`, `Map`, `Gauge` als Katalogkomponenten in der Shell. Anfragen 1–4 laufen. Die entscheidende Frage: **produziert das Modell die Verdrahtung** (Anfrage 3) zuverlässig? Sonst Prompt-Beispiel schärfen, Modell wechseln; Netz ist der Action-Weg.

**M2 — NF-Split.** Dynamic Host, Capability-Vertrag, `mfe-charts` als Remote, Manifest + `?capabilities=`, Shared-Deps (Zod-Singleton mit einer Katalogkomponente aus dem Remote prüfen).

**M3 — `mfe-maps`, `mfe-embed`, Komposition.** Remotes nach Muster, `ChartGrid`, Anfragen 5–6, beide Live-Momente. **Demo fertig.**

**M4 — Hosting und Veröffentlichung (optional).** `ReplayAgent` (aufgezeichnete Runs pro Anfrage × Capability-Set, Capture-Skript; Aufnahmen enthalten dank Datenmontage nur Struktur) als Default; `BrowserAgent` (BYOK, ein Modellaufruf pro Run) als Schalter; statisches Deployment wie Frankenstein. README mit Architekturbild, Wann-lohnt-es-sich-Regel, Datenstand. Post 2.

## 9. Entscheidungen

| # | Frage | Stand |
|---|---|---|
| E1 | Projektname | **ConferenceFinder** (MeetupFinder: Markenrisiko; TalkFinder: passt nicht zu den Daten) |
| E2 | Datensatz | fiktive Konferenzen, reale Städte, `dayOffset` statt Datum, eigene Demo-Websites |
| E3 | Modell | Entwicklung/Aufzeichnung: Claude Sonnet 5; Gegenprobe: günstiges OpenAI-Modell (Buch: GPT-5.4 mini); DeepSeek als dritter Provider ohne Versprechen |
| E4 | `action` auf `Map`/`Timeline`/`BarChart` | Schema ab M1 (eine Zeile), genutzt ab M3 (Anfrage 6) |
| E5 | Mono-Workspace | ja (`projects/mfe-*`, `agent/`) |
| E6 | A2UI-Transport | Client-Tool `renderSurface` |
| E7 | Bindung vs. Agent | lokal bevorzugen, per Prompt-Regel |

## 10. Risiken

- **Verdrahtung durch das Modell** (Anfrage 3) — das einzige echte Risiko; M1 klärt es vor jeder NF-Arbeit.
- **Literal statt `{ path }`** — bekanntes Modellverhalten; Beispiele im Prompt.
- **Zod-Doppelinstanzen** über Remote-Grenzen — früh testen (M2).
- **NF-Version** gegen Angular 21.x prüfen.
- **Modell kopiert trotzdem Daten** in `updateDataModel` — Prompt-Regel plus Client-Validierung: `renderSurface` lehnt `updateDataModel` auf `/confs` und `/me` ab (`{ ok: false }`), das Modell korrigiert.
- **Replay-Aufnahmen** bleiben nur frisch, wenn kein Datum im Modell-Output steht — Aufnahmen beim Capture darauf prüfen.

## 11. Nicht-Ziele

Server-Tools, DSL/Dashboard, HITL-Interrupts, MCP, Streaming, Late-Binding zur Laufzeit, React/Svelte-Remotes, echte Ticket-Käufe/Zahlung, Prod-Härtung der Katalogbeschreibungen, echte Karten-Tiles.

## 12. Akzeptanzkriterien

1. Anfragen 1–6 liefern die beschriebenen Surfaces mit dem Entwicklungsmodell in ≥ 4 von 5 Versuchen.
2. Anfrage 3: Marker-Klick wechselt Name, Countdown, Distanz, Gauge und Website ohne Netzwerkrequest.
3. Anfrage 4: Reservieren senkt die Gauge ohne Modellaufruf; Store hält die Reservierung.
4. Ohne `mfe-maps` degradiert Anfrage 2 sauber; mit: Karte. `context[]` zeigt den Unterschied; `agent/` unverändert.
5. Remotes sind getrennte Builds/Ports; NF-Devtools zeigen sie.
6. (M4) Gehostete Demo läuft statisch im Replay-Modus; BYOK-Modus mit eigenem Key.
7. Tests aus Abschnitt 7 laufen grün; `npm run eval` dokumentiert die Modell-Erfolgsquote.

## 13. Veröffentlichung

Post 1 (Buch) ist raus. Post 2 nach M3/M4: Screenshots der Anfragen, GIF der Live-Momente, Repo-Link. Repo-Lizenz: MIT.

README und Post führen das Argument aus Abschnitt 0 explizit — Begriff „föderierbares Vokabular", die Formel, der Klick-Kaskaden-Moment, der Live-Moment, die Wann-lohnt-es-sich-Regel. Ohne diese Erklärung liest sich die Demo als „Charts und Karten mit KI".
