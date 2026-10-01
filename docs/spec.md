# Spec: ConferenceFinder — föderiertes A2UI-Vokabular mit Native Federation

Status: Entwurf v3.5, 2026-09-30 (M3 umgesetzt: vier Badges, Distanzfilter als Funktion in `mfe-maps`, MapLibre, eigener Key = lokaler Agent-Server; v3.4: 2026-09-25, Veröffentlichung als eigener Schritt nach M3; v3.3: 2026-09-09, Entschlackung: 2 Remotes, Anfragen 1–4, Replay verpflichtend; v3.2: 2026-08-27). Projekt: **ConferenceFinder**. Eigene App ohne Flights-Bezug.
Taskzuschnitt folgt später per `/plan` je Meilenstein. Diese Spec wandert als `docs/spec.md` ins Projekt-Repo, sobald es existiert.

## 0. Leitgedanke (Anker für README, Post und Talk)

**Föderierbares Vokabular — föderierbare Primitive für Agentic UI.**

Ein A2UI-Katalog ist die Sprache, in der ein Modell Oberflächen komponiert. Native Federation macht diese Sprache föderierbar: Teams liefern Primitive, Funktionen und Container als Remotes, und das Modell komponiert aus allem, was gerade geladen ist — Anzeigen, Eingaben und deren Verdrahtung, passend zur Anfrage.

Die These in einem Satz: *Die Anfrage bestimmt, welche Ein- und Ausgaben zusammengestellt und wie sie verdrahtet werden; das Vokabular bestimmt, was möglich ist; Native Federation bestimmt, wer Vokabular liefert.*

Der Unterschied zum Plugin-System ist zeigbar, nicht nur behauptbar: Ein Klick in der Karte (Maps-Remote) wechselt Name, Countdown, Distanz und Restkarten-Gauge (Charts-Remote) — verbunden über einen Pfad im Datenmodell, den das Modell gewählt hat, ohne Modellaufruf, ohne dass ein Remote das andere kennt. Ein Plugin-System stellt Widgets nebeneinander; föderiertes Vokabular lässt sie ineinandergreifen.

Was den Unterschied ausmacht, ist subtil, und Charts und Karten hat jeder schon gesehen. Deshalb müssen README und Post das Argument explizit führen: die Formel, der Klick-Kaskaden-Moment, der Live-Moment „Remote dazu → Fähigkeit da", und die Regel, wann sich das lohnt (Abschnitt 1). Die Architektur ist Konvergenz, kein Kompromiss: keine Server-Tools → Agent trivial → statisches Hosting; Client montiert Daten → weniger Tokens und dauerhaft gültige Aufnahmen; Offsets → fiktive Daten → eigene Demo-Seiten.

## 1. Ziel und Pointe

Ein **dynamisches Abfrage-UI**: Der User stellt eine Frage in natürlicher Sprache („Wann ist die nächste Angular-Konferenz in meiner Nähe?"), das Modell komponiert aus einem Katalog die passenden Ein- und Ausgaben und verdrahtet sie über ein gemeinsames Datenmodell. Der Katalog ist **föderiert**: Plattform-Teams liefern neutrales Vokabular als Native-Federation-Remotes — Charts, Karten, Einbettungen. Die Domäne (Konferenzen, Tickets, mein Standort) lebt allein in der Shell.

Die Formel: *Die Anfrage bestimmt, welche Ein-/Ausgaben zusammengestellt und wie sie verdrahtet werden; das Vokabular bestimmt, was möglich ist; Native Federation bestimmt, wer Vokabular liefert.*

Warum das kein Plugin-System ist — die Demo zeigt es, sie behauptet es nicht:

1. **Neutrale Primitive multiplizieren die Antwortmöglichkeiten.** Eine Karte zeigt alles mit Koordinaten, eine Zeitachse alles mit Datum. Mehr Remotes → mehr *Arten* von Antworten auf *beliebige* Fragen.
2. **Primitive verschiedener Remotes sind über Pfade verdrahtet.** `Map.selected → /selectedConf`, `Gauge.value ← /selectedConf/remaining`. Kein Remote kennt das andere; die Kopplung ist ein Pfad, den das Modell gewählt hat.
3. **Teams erweitern die Ausdruckssprache.** Katalog-Funktionen (`distance`, `daysUntil`) laufen in gewöhnlichen `Text`-Komponenten.
4. **Domänenaktionen bleiben in der Shell.** „Reservieren" ist ein Basic-`Button` mit `action: reserve`; der Handler gehört der Shell, nicht einem Remote.

(Der frühere dritte Punkt — Container eines Remotes halten Primitive eines anderen, `ChartGrid[Map]` — wandert mit seinem Demonstrator Anfrage 5 in die Späteren Erweiterungen.)

Wann sich das lohnt (README-Regel): mehrere Teams, Anfragen quer zu den Teams, UIs, die niemand vorgebaut hat. Fehlt eine Bedingung, reicht ein Widget-Tool.

## 2. Demo-Anfragen (in Steigerung)

Seit v3.5 sind die Demo-Anfragen die vier **Badges** — die Beispiel-Prompts als Buttons über dem Chat. Jedes Badge steht für sich (es braucht keinen Verlauf) und verlangt eine andere Form der Antwort.

| # | Badge | Was entsteht | Beweist |
|---|---|---|---|
| 1 | „Which Angular conferences are coming up in the next six months?" | `Timeline` an `/filteredConfs` (vom Client montiert), sonst nichts | Remote liefert Ausgabe-Vokabular |
| 2 | „Where are the Angular conferences around me? Let me narrow them down by distance with a slider." | `Column [ Slider(value → /filter/maxKm), Map(points ← filterWithinKm(/filteredConfs, /me, /filter/maxKm), center ← /me) ]` | Funktions-Vokabular eines Remotes treibt ein Bedienelement des Basis-Katalogs — der Regler filtert ohne einen Token |
| 3 | „Compare the next three Angular conferences: date, city, ticket price and tickets left." | `Row` aus drei `Card`s, je an `/filteredConfs/0…2` gebunden, Restkarten als `Gauge`; kein Reserve-Button | Komposition aus Basis-Katalog und Charts-Remote |
| 4 | „Where and when is the next Angular conference near me? When I click one, I want details and a way to reserve a seat." | `Map` und `Timeline` mit `selected → /selectedConf`, dazu eine Detail-`Card`: `Text /selectedConf/name`, `daysUntil(/selectedConf/date)`, `distance(/me, /selectedConf)`, `Gauge(/selectedConf/remaining, /selectedConf/capacity)`, `Button reserve`; `/selectedConf` mit der ersten vorbelegt | **Klick-Kaskade: Auswahl in einem Remote treibt Anzeige aus einem zweiten Remote und der Shell — ohne Modell-Roundtrip**; dazu die Aktion, die der Shell gehört |

**Anfrage 4** bleibt der Klick auf den Button aus Badge 4, kein eigenes Badge: `action: reserve { id: { path: '/selectedConf/id' } }` → Shell-Handler → Store → `updateDataModel …/remaining` → `Gauge` sinkt. Beweist: Domänenaktion ohne Modell, Vokabular neutral.

Wo die Meilensteine M1 und M2 von „Anfragen 1–3" sprechen, meinen sie die damaligen Texte (Zeitachse, „Zeig sie auf einer Karte", Detailansicht); deren Beweise tragen heute Badge 1, 2 und 4. Weitere Anfragen (ehemals 5–7) sind in die Späteren Erweiterungen verschoben und Teil keiner verbindlichen Abnahme.

**Live-Moment:**
- Ohne `mfe-maps` beantwortet das Modell Badge 2 mit einem Text, der die Lücke benennt (die fehlende Karte oder den fehlenden Distanzfilter), und einer einfachen Liste — ohne Regler. Remote im Panel einschalten, Reload → Karte mit Regler. `context[]` im Request zeigt das neue Vokabular; `agent/` unverändert.

## 3. Architektur

### 3.1 Aufteilung

| Einheit | Inhalt | Port |
|---|---|---|
| **Shell** | Chat, A2UI-Renderer + Basic Catalog, Client-Tool `renderSurface` (3.5), Datentool `findConferences`, `ConferenceStore`, Handler `reserve`, Standort (Geolocation, Fallback Stadtwahl) als Kontext-Entry `/me`, Capability-Loader, Panel „geladene Remotes und ihr Vokabular" (sichtbarer Demo-Bestandteil), Beispiel-Prompts als Buttons (die vier Badges aus Abschnitt 2; ein Badge ist eine Replay-Aufnahme) | 4200 |
| **`mfe-charts`** | `Timeline`, `Gauge`, Fn `daysUntil` | 4201 |
| **`mfe-maps`** | `Map`, Fn `distance`, Fn `filterWithinKm` | 4202 |
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

**Datenmontage durch den Client.** Das Modell kopiert Tool-Ergebnisse **nie** in `updateDataModel`. Der `renderSurface`-Handler montiert nach den Nachrichten des Modells die zuletzt geladenen Daten selbst ins Datenmodell der Surface: `/filteredConfs` (letztes `findConferences`-Ergebnis), `/me` (Standort). Das Modell bindet nur Pfade (`points: { path: '/filteredConfs' }`). Gründe: Struktur vom Modell, Daten vom Code (DSL-Erkenntnis aus dem Buch, auf den Client übertragen); deutlich weniger Tokens; keine abgeschriebenen Zahlen; Replay-Aufnahmen (M3) enthalten nur Struktur und bleiben mit dem Offset-Datenmodell (Abschnitt 5) dauerhaft gültig. Abgeleitete Sichten (`/byMonth`, `/byTopic`) liefert das Tool auf Anfrage (`groupBy`), nicht das Modell.

### 3.6 Katalog-Merge und Kontext

- Ein gemergter Katalog, eigene Id (`https://<projekt>/catalogs/assistant`), Fragmente als `extraComponents`, Funktionen als `[...BASIC_FUNCTIONS, ...Remote-Funktionen]`; Namenskollisionen werden beim Merge geloggt.
- Kontext-Entry fürs Modell serialisiert **Komponenten und Funktionen** (Buch: nur Komponenten). Zweiter Kontext-Entry: `me` (Standort, Name der Stadt) — damit „in meiner Nähe" ohne Tool-Roundtrip aufgelöst werden kann.
- `sendCatalogDescription: true`. Prod-Hinweis in der README: Registry aus Remote-Metadaten.

### 3.7 Tooling und Repo

- Neues Repo `~/projects/conference-finder` (MIT), getrennt vom Notiz-Repo `~/projects/a2ui`. Angular-CLI-Workspace (kein Nx), npm, Node LTS. Projekte: `shell` (Default), `projects/mfe-charts`, `projects/mfe-maps`, `agent/` (Mastra, eigenes `package.json`), `libs/capabilities`.
- Versionen: Angular 21.x, `@copilotkit/angular` 0.3.x, `@a2ui/angular` 0.10.x, `@a2ui/web_core` 0.10.x, `@ag-ui/*` 0.0.57+, `@angular-architects/native-federation` passend zu Angular 21 (in M2 prüfen), Mastra 1.x mit Providern Anthropic/OpenAI/DeepSeek.
- npm-Scripts: `start` (Shell + alle Remotes + Agent parallel), `start:shell`, `start:charts`, `start:maps`, `start:agent`, `build:deploy` (M3, statisches Deployment), `test`, `eval`. Ein Capture-Skript gibt es nicht: die Replay-Aufnahmen entstehen im Browser mit `?record`.
- `.env.example` mit den drei Provider-Keys; Modell per `agent/config.ts` wählbar.
- **M1-Prüfpunkt Chat-UI:** Liefert `@copilotkit/angular` 0.3 eine fertige Chat-Komponente, die registrierte `ToolRenderer` darstellt? Wenn ja, nutzen (spart Zeit). Sonst headless nach Buch-Muster (`chat-messages` mit `copilot-render-tool-calls`).

### 3.8 Shared Dependencies

`@angular/*`, `@a2ui/angular`, `@a2ui/web_core`, `@copilotkit/angular`, `@ag-ui/core`, `@ag-ui/client`, `zod` (inkl. `zod/v3`), `rxjs` — singleton, strictVersion. Die Charts bleiben SVG ohne Bibliothek. Die Karte zeichnet seit M3 MapLibre (`maplibre-gl`) innerhalb von `mfe-maps`: die Bibliothek gehört dem Remote, die Shell importiert sie nicht.

## 4. Primitive

Alle Props sind `binding(...)` — Literal, Pfad oder Funktionsaufruf. Eingabe-Primitive schreiben über `props().selected.onUpdate(obj)` → `dataContext.set(path, obj)`; bei Literal No-op (Prompt-Regel). **Auswahl schreibt das ganze Element, nicht die Id** — dann binden Basic-Komponenten direkt `/selectedConf/name`, `/selectedConf/url` usw. Optionales `action` (`ActionSchema`) macht aus dem Klick zusätzlich ein Client-Event.

| Remote | Primitive | liest | Klick schreibt | `action` | Bemerkung |
|---|---|---|---|---|---|
| charts | `Timeline` | `items: {id, label, date, …}[]`, `range?`, `selected?` | `selected` (Element) | optional | horizontale Zeitachse, SVG |
| charts | `Gauge` | `value`, `max`, `label?` | — | — | Restkarten |
| charts | Fn `daysUntil(date)` → number | | | | „42" plus eigenes `Text`-Label; der Basiskatalog hat keine Interpolation — `formatString` coerct nur einen einzelnen Wert zu String |
| maps | `Map` | `points: {id, label, lat, lon, …}[]`, `center?`, `selected?` | `selected` (Element) | optional | MapLibre auf OpenFreeMap-Vektorkacheln (Stil `positron`, umgefärbt, kein Key); Labels als Symbol-Layer mit Kollisionsvermeidung; Auswahl als Ring plus fettes Label, kein Popup |
| maps | Fn `distance(a, b)` → km | | | | Haversine |
| maps | Fn `filterWithinKm(points, center, maxKm)` → Array | | | | die Punkte im Umkreis, Zusatzfelder bleiben erhalten; macht aus einem `Slider` des Basis-Katalogs einen Live-Filter |

Elemente in `items`/`points`/`data` dürfen **beliebige Zusatzfelder** tragen; die Primitive reichen sie beim Schreiben von `selected` unverändert durch. Das ist der Mechanismus, der Detailansichten ohne Lookup-Funktion möglich macht.

Listen-Templates (`children: { componentId, path }`) sind im Renderer vorhanden — eine Komponente pro Array-Element mit eigenem `basePath`; für Legenden und Karten-Listen nutzbar, gehört in die Prompt-Beispiele.

## 5. Daten, Standort, Domänenlogik (Shell)

- `data/conferences.json`: ~30 **fiktive, plausible** Konferenzen (Name mit Themenbezug wie „ng-summit Berlin", Thema `angular | dotnet | web | ai | …`, reale Stadt + GPS, `capacity`, `remaining`, `price`) mit **`dayOffset` statt Datum**. Der Loader setzt bei jedem Aufruf `date = heute + dayOffset`: Die Demo veraltet nie, „die nächste" existiert immer, der Countdown ist immer sinnvoll. Reale Konferenzen bewusst nicht — erfundene Termine zu echten Events wären Falschinformation.
- Client-Tool `findConferences({ topic?, withinDays?, nearKm?, limit?, groupBy? })` → Array inkl. `distanceKm` (berechnet mit `/me`) und optional abgeleitete Sichten; der Client montiert das Ergebnis unter `/filteredConfs` (3.5), das Modell bindet nur.
- `/me`: Geolocation nach Erlaubnis, sonst Stadtwahl; als Kontext-Entry und im Datenmodell.
- `ConferenceStore` (Signal Store): Reservierungen lokal. Handler `reserve(action)` → Store → `renderer.processMessages([updateDataModel /selectedConf/remaining …])` und `/filteredConfs/<i>/remaining` (Buch-Muster `increaseMiles`). Kein Modell beteiligt.

## 6. Prompt-Grundsätze (Agent)

- Output-Regeln nach Buch-Muster: Daten **zuerst** per Tool holen, dann `renderSurface` **einmal**, dann stoppen; Text über `messageWidget`.
- A2UI-Formatregeln mit zwei Beispielen (Version, `component`-Feld, flache Liste, `child` vs `children`).
- **Verdrahtungsregel — lokal bevorzugen:** Beschreibt der User eine Interaktion, deren Daten schon da sind, verdrahte sie per Bindung in *einer* Surface (`selected` auf einen Pfad, alle Detailanzeigen auf Unterpfade davon, Startwert setzen). **Nie** dafür eine Rückfrage bauen. Braucht die Interaktion neue Daten oder eine Agenten-Entscheidung, benennt der Agent die Grenze (das Rückfrage-Tool `submitAnswer` ist eine Spätere Erweiterung).
- **Pfad statt Literal** für alles, was sich ändern oder zurückkommen soll.
- **Daten nie kopieren:** `findConferences`-Ergebnisse liegen unter `/filteredConfs`, der Standort unter `/me` — binden, nicht abschreiben. Zeitangaben und Distanzen im UI über `daysUntil`/`formatDate`/`distance` in der Surface, nicht im Text ausrechnen.
- Domänenaktionen: genau ein Client-Event `reserve { id: { path } }`; keine anderen Event-Namen erfinden.
- Katalogabschnitt (Komponenten + Funktionen) und `me` aus dem Kontext. Fehlt Vokabular: sagen, was fehlt, beste verfügbare Darstellung wählen, nie Namen erfinden.

## 7. Tests

Damit jede Task als „Diff + Test" landen kann (Vorgabe für `/plan`):

| Ebene | Was | Wie |
|---|---|---|
| Pure Functions | `mergeCatalog`, Kontext-Serialisierung (Komponenten + Funktionen), `resolveCapabilityRemotes`, `findConferences`-Filter/Distanz, `dayOffset`-Loader, `daysUntil`, `distance`, Datenmontage-Guard (`/filteredConfs`, `/me` abgelehnt) | Vitest, Node |
| Primitive | jede Katalogkomponente mit gebundenen Props: rendert, `selected.onUpdate` wird mit dem ganzen Element gerufen, `action` dispatcht | Vitest Browser Mode (Buch Kap. 9), `BoundProperty`-Fakes wie `initialProperty` im Buch |
| Renderer-Integration | `renderSurface`-Handler: valide Nachrichten → Surface erscheint, Daten montiert; invalide → `{ ok: false, result }`; Klick auf `Map` aktualisiert gebundenen `Text` ohne Agentenrequest | Vitest Browser Mode mit echtem `A2uiRendererService` |
| Agent-Loop ohne Modell | Agent-Store mit `ReplayAgent`/Mock-Agent (Kap. 9): Badge → aufgezeichnete Tool-Calls → Surface | Vitest Browser Mode; dieselben Aufnahmen wie der M3-Replay-Modus |
| Modell-Verhalten | vier Zellen gegen das echte Modell, jedes Badge als erste Nachricht einer frischen Sitzung: Badge 1 und Badge 4 mit beiden Remotes, Badge 1 und Badge 2 nur mit Charts; Erfolgsquote ≥ 4/5 je Zelle (der Request-4-Kontrakt — `reserve`-Button — wird in Badge 4 mitbewertet). Die Regler-Form von Badge 2 und das Vergleichs-Badge 3 beurteilt das Auge bei der Aufnahme, nicht das Gate | manuelles Skript `npm run eval`, nicht in CI |
| Fehlendes Vokabular | Anfrage mit einer Capability, die im Katalog **nicht** vorhanden ist — Badge 2 ohne `mfe-maps`: die Antwort **benennt die Lücke** (Karte oder Distanzfilter) und emittiert **keine wirkungslosen Bedienelemente** — sie zeichnet keinen Regler, hinter dem keine Funktion steht | `npm run eval`, ein Fall je Live-Moment |

Der letzte Fall sichert die Vorher-Hälfte der Live-Momente ab: Ein Modell, das statt einer ehrlichen Absage drei tote Knöpfe baut, besteht die Schema-Validierung (die Namen existieren ja) und lässt die Demo kaputt statt unvollständig aussehen. Der Guardrail des Renderers greift hier nicht — er verhindert erfundene Namen, nicht wirkungslose Komposition aus echten.

Sheriff wie im Buch-Repo für Modulgrenzen (Shell importiert keine Remotes; Remotes kennen nur `libs/capabilities` und die A2UI-/CopilotKit-Typen).

## 8. Meilensteine

**M1 — Spike im Monolith (kein NF).** Agent + Shell + `renderSurface` + `findConferences` + `Timeline`, `Map`, `Gauge` als Katalogkomponenten in der Shell. Anfragen 1–3 laufen (der `reserve`-Button aus Anfrage 3 ist Markup-Kontrakt; sein Handler folgt in M3). Die entscheidende Frage: **produziert das Modell die Verdrahtung** (Anfrage 3) zuverlässig? Sonst Prompt-Beispiel schärfen, Modell wechseln; Netz ist der Action-Weg. Das M1-Gate steht **vor** jeder NF-Arbeit — die riskanteste Annahme zuerst.

**M2 — NF-Split.** Dynamic Host, Capability-Vertrag, `mfe-charts` und `mfe-maps` als Remotes, Manifest + `?capabilities=`, Shared-Deps (Zod-Singleton mit einer Katalogkomponente aus dem Remote prüfen). Der Live-Moment (Degradation ohne `mfe-maps`, Reload → Karte) läuft.

**Visuelle Sprache „Departure" (zwischen M2 und M3).** Ein Look für die Demo — Kopfband in Tinte, Mono-Ziffern für Datum, Distanz und Anzahl, Blau für Linie und Auswahl, Amber nur für Aufmerksamkeit — über Shell-Chrome, Chat-Rahmen, Agent-Primitive, `Timeline` und `Gauge`, getragen von `--cf-*`-Custom-Properties über die Föderationsgrenze; dazu die eine Nicht-CSS-Änderung, Prompt-Beispiele mit gruppierten Beschriftung/Wert-Paaren. Eigene Spec: `docs/specs/visual-language.md`. Liegt vor M3, weil die Prompt-Änderung vor den Replay-Aufnahmen stehen muss.

**M3 — Reserve, Karten-Upgrade, Hosting.** `ConferenceStore` + `reserve`-Handler (Anfrage 4, samt Prompt-/Eval-Erweiterung). MapLibre-Upgrade **innerhalb** von `mfe-maps` (echte Tiles hier erlaubt; Vokabular, Schema und Prompt bleiben unverändert; Toggle = Reload bleibt; das Karten-Kit steht in `docs/specs/visual-language.md`, Abschnitt 8.3). Der Distanzfilter `filterWithinKm` als Katalogfunktion in `mfe-maps` und die vier Badges aus Abschnitt 2. Hosting: `ReplayAgent` als **verpflichtender**, klar gekennzeichneter Default — Besucher brauchen keinen API-Key. Eine Aufnahme je Badge × Capability-Set (zwei Remotes ergeben vier Sets, also sechzehn Aufnahmen); jedes Badge ist eigenständig formuliert und als erste Nachricht einer frischen Unterhaltung aufgenommen, der Verlauf wird beim Abspielen ignoriert, Freitext bekommt die Antwort „nicht aufgezeichnet". Aufgenommen wird im Browser mit `?record`, nicht mit einem Capture-Skript; die Aufnahmen enthalten dank Datenmontage nur Struktur und pinnen Protokoll- und Formatversion sowie die Stadt der Aufnahme. **Eigener Key = lokaler Agent-Server** (`.env`, `npm start`): ein Key gehört auf einen Server, ein `BrowserAgent` mit Key im Browser wird nicht gebaut. Statisches Deployment wie Frankenstein (`npm run build:deploy`). **Die gehostete Demo läuft.**

**Veröffentlichung (nach M3).** README als Eingangstür des öffentlichen Repos: Architekturbild, Wann-lohnt-es-sich-Regel, Datenstand, FAQ als Vortragsskript — ihre Fakten (gehostete Replay-Demo, MapLibre-Karte, Anfrage 4) stammen aus M3, deshalb erst danach. Historie ohne Buchnotizen und privaten Kontext; dann ein neues GitHub-Repository `native-federation-a2ui` statt einer Umbenennung (die App bleibt ConferenceFinder). Post 2. **Demo fertig und veröffentlicht.**

## 8b. Spätere Erweiterungen (v3.3 — außerhalb jeder verbindlichen Abnahme)

In v3.3 aus dem Pflichtumfang genommen: jede Position hier ist eine zweite Instanz eines bereits
bewiesenen Punkts oder ein eigenständiger Nachschlag. Reihenfolge = empfohlene Reihenfolge, falls
die Demo nach der Veröffentlichung wächst.

1. **Umgesetzt in M3 als Funktion `filterWithinKm` innerhalb von `mfe-maps` — bewusst ohne
   eigenes Remote `mfe-filter` (E12).** Ein drittes wählbares Remote hätte die Replay-Matrix auf
   acht Capability-Sets verdoppelt; die Pointe (föderiertes *Verhalten* treibt einen Regler des
   Basis-Katalogs) trägt Badge 2 auch so. Der ursprüngliche Vorschlag bleibt zum Nachlesen stehen:
   **`mfe-filter` — die Kür (zuerst umsetzen, bestes Sequel).** Liefert **ausschließlich die
   Katalogfunktion `withinKm`** — kein neues Anzeige-Primitiv; das kleinstmögliche Remote der
   ganzen Demo. `Slider` bringt der Basis-Katalog von `@a2ui/angular` bereits mit (verifiziert
   2026-09-03: `slider` steht in `DEFAULT_COMPONENT_IMPLEMENTATIONS`); was fehlt, ist die
   Fähigkeit, ein Array zu filtern — **keine** der 25 Basis-Funktionen transformiert Arrays.
   Vorher kann das Modell den Regler zeichnen, ihn aber an nichts binden; nachher filtert derselbe
   Regler live, ohne einen einzigen Token. Die Lücke ist **Verhalten**, nicht Aussehen — föderiert
   wird die zweite der zwei gleichrangigen Kataloglisten (`functions`). Ehemalige Anfrage 7:
   `Column [ Slider(value → /filter/maxKm), Map(points ← withinKm(/filteredConfs, /filter/maxKm)) ]`.
   Voraussetzung: die „Fehlendes Vokabular"-Eval-Zeile (§7) — die Vorher-Hälfte trägt nur, wenn
   das Modell den toten Regler *nicht* baut, sondern die Lücke benennt. Risiko liegt im Modell
   (verschachteltes `functionCall`-Binding), nicht im Renderer.
2. **`mfe-embed` mit `WebFrame`** (+ statische Demo-Seiten `/conf-sites/<id>.html` in der Shell)
   — drittes Remote, in 30 Minuten gebaut: vorher „Website: <Link>", nachher eingebettet. Zeigt,
   dass ein Vokabular-Remote klein ist.
3. **`BarChart` + `ChartGrid` und die ehemalige Anfrage 5** („Vergleiche nach Monat, Karte
   daneben": `ChartGrid [ BarChart(/byMonth, selected → /month), Map(points ← /filteredConfs,
   filter ← /month) ]`) — Verschachtelung über Remote-Grenzen; trägt den Plugin-Unterschieds-Claim
   „Container eines Remotes halten Primitive eines anderen". `findConferences` liefert `/byMonth`/
   `/byTopic` bereits. Bringt die `Map`-Props `filter?`/`mode?` mit.
4. **`submitAnswer` und die ehemalige Anfrage 6** (Rückfrage-Formular: `Map(selected → /pick)` +
   `Button submitAnswer` → Developer-Message an den Agenten, Buch-Muster) — zweiter Agenten-Flow.

## 9. Entscheidungen

| # | Frage | Stand |
|---|---|---|
| E1 | Projektname | **ConferenceFinder** (MeetupFinder: Markenrisiko; TalkFinder: passt nicht zu den Daten); Anzeigename in Titel und Kopfzeile: **Conference Finder** mit Leerzeichen |
| E2 | Datensatz | fiktive Konferenzen, reale Städte, `dayOffset` statt Datum, eigene Demo-Websites |
| E3 | Modell | Entwicklung/Aufzeichnung: Claude Sonnet 5; Gegenprobe: günstiges OpenAI-Modell (Buch: GPT-5.4 mini); DeepSeek als dritter Provider ohne Versprechen |
| E4 | `action` auf `Map`/`Timeline` | Schema ab M1 (eine Zeile), erster Nutzer: `reserve`-Button (Handler in M3); `submitAnswer` → Spätere Erweiterungen |
| E5 | Mono-Workspace | ja (`projects/mfe-*`, `agent/`) |
| E6 | A2UI-Transport | Client-Tool `renderSurface` |
| E7 | Bindung vs. Agent | lokal bevorzugen, per Prompt-Regel |
| E8 | Scope-Entschlackung v3.3 | 2 Remotes, Anfragen 1–4, drei Meilensteine, Replay verpflichtend/BYOK optional; `mfe-filter`, `mfe-embed`, `BarChart`/`ChartGrid`, `submitAnswer` → §8b (2026-09-09) |
| E9 | Reihenfolge M3 → Veröffentlichung | Hosting bleibt in M3; README, Historie, neues Repo `native-federation-a2ui` und Post 2 bilden den Schritt „Veröffentlichung" danach, weil die README-Fakten aus M3 stammen (2026-09-25) |
| E10 | Replay und eigener Key | Eine Aufnahme je Badge × Capability-Set; die Badges sind eigenständig formuliert, der Verlauf wird ignoriert, Freitext bekommt „nicht aufgezeichnet". Eigener Key = lokaler Agent-Server; kein `BrowserAgent`, der Key gehört nicht in den Browser (2026-09-26) |
| E11 | Vier Badges, vier Formen | Zeitachse, Karte mit Distanzregler, Drei-Karten-Vergleich, Detailansicht mit Reservieren; Anfrage 4 bleibt der Button-Klick. Die Formregeln stehen im Systemprompt, die Negativliste je Badge ist die Prüfliste fürs Auge bei der Aufnahme (2026-09-28) |
| E12 | Distanzfilter | Katalogfunktion `filterWithinKm` in `mfe-maps`, kein drittes Remote `mfe-filter`: weniger als §8b.1 vorschlug, dafür bleibt die Replay-Matrix bei vier Sets (2026-09-28) |

## 10. Risiken

- **Verdrahtung durch das Modell** (Anfrage 3) — das einzige echte Risiko; M1 klärt es vor jeder NF-Arbeit.
- **Literal statt `{ path }`** — bekanntes Modellverhalten; Beispiele im Prompt.
- **Zod-Doppelinstanzen** über Remote-Grenzen — früh testen (M2).
- **NF-Version** gegen Angular 21.x prüfen.
- **Modell kopiert trotzdem Daten** in `updateDataModel` — Prompt-Regel plus Client-Validierung: `renderSurface` lehnt `updateDataModel` auf `/filteredConfs` und `/me` ab (`{ ok: false }`), das Modell korrigiert.
- **Replay-Aufnahmen** bleiben nur frisch, wenn kein Datum im Modell-Output steht — Aufnahmen beim Capture darauf prüfen.

## 11. Nicht-Ziele

Server-Tools, DSL/Dashboard, HITL-Interrupts, MCP, Streaming, Late-Binding zur Laufzeit (Toggle = Reload), React/Svelte-Remotes, echte Ticket-Käufe/Zahlung, Prod-Härtung der Katalogbeschreibungen. Echte Karten-Tiles erst mit dem MapLibre-Upgrade in M3 (vorher nicht).

## 12. Akzeptanzkriterien

1. Die vier Badges — Zeitachse, Karte mit Distanzregler, Drei-Karten-Vergleich, Detailansicht mit Reservieren — liefern die in Abschnitt 2 beschriebenen Surfaces. Das Eval-Gate misst davon Badge 1 und Badge 4 mit beiden Remotes sowie Badge 1 und Badge 2 nur mit Charts, mit dem Entwicklungsmodell in ≥ 4 von 5 Versuchen (inkl. `reserve`-Button-Kontrakt in Badge 4).
2. Badge 4: Marker-Klick wechselt Name, Countdown, Distanz und Gauge ohne Agentenrequest.
3. (M3) Anfrage 4: Reservieren senkt die Gauge ohne Modellaufruf; Store hält die Reservierung.
4. Ohne `mfe-maps` degradiert Badge 2 sauber (Lücke benannt, kein Regler); mit: Karte mit Regler. `context[]` zeigt den Unterschied; `agent/` unverändert.
5. Remotes sind getrennte Builds/Ports; NF-Devtools zeigen sie; das Remote-Panel zeigt geladene Remotes und ihr Vokabular.
6. (M3) Gehostete Demo läuft statisch im klar gekennzeichneten Replay-Modus ohne API-Key (verpflichtend). Wer einen eigenen Key hat, startet den lokalen Agent-Server; einen Modus mit Key im Browser gibt es nicht.
7. Tests aus Abschnitt 7 laufen grün; `npm run eval` dokumentiert die Modell-Erfolgsquote.

## 13. Veröffentlichung

Post 1 (Buch) ist raus. Post 2 mit der Veröffentlichung nach M3: Screenshots der Anfragen, GIF des Live-Moments, Repo-Link, Link auf die gehostete Replay-Demo. Repo-Lizenz: MIT.

README und Post führen das Argument aus Abschnitt 0 explizit — Begriff „föderierbares Vokabular", die Formel, der Klick-Kaskaden-Moment, der Live-Moment, die Wann-lohnt-es-sich-Regel. Ohne diese Erklärung liest sich die Demo als „Charts und Karten mit KI".
