# Task 2: Add the Mastra agent server with a raw AG-UI endpoint and provider switch

### Task

`agent/` als eigenständiges Node-Projekt aufgesetzt: Provider-Switch über drei AI-SDK-Provider mit
purem `resolveModel`, ein Mastra-`Agent` `assistant` ohne Server-Tools, und ein Hono-Server, der
`POST /ag-ui/:agentId` validiert und den `MastraAgent`-Observable als rohes AG-UI-SSE ausliefert.
Dazu die Root-Verdrahtung (`npm start`, `npm test` über beide Suiten, `.env.example`).

### Status

DONE — `npm test` (Shell 2 + Agent 14), `lint`, `build` und `npm ls --depth=0` je exit 0.
Alle vier Akzeptanzkriterien `passed`; drei begründete Abweichungen von den AC-/Plan-Texten sind
unter Key Decisions und Acceptance Coverage protokolliert. Ein Codex-Review deckte danach einen
echten Defekt im Fehlerpfad auf (kein terminales Event bei Modellfehler) sowie drei Testlücken;
alle vier sind behoben, die Agent-Suite wuchs von 8 auf 14 Tests. Eine zweite Review-Runde ergab,
dass der Server auf allen Interfaces lauschte — jetzt auf Loopback gebunden.

### Files Modified

- `agent/package.json` (new) — eigenständiges ESM-Projekt (`type: module`), Scripts `dev` (`tsx watch`),
  `start`, `test` (`tsc --noEmit && vitest run`), `typecheck`; `engines.node >= 24`.
  Dependencies: `@ag-ui/core|encoder ~0.0.59`, `@ag-ui/mastra ~1.1.2`, `@mastra/core ~1.63.2`,
  `ai ~7.0.84`, `@ai-sdk/anthropic ~4.0.45`, `@ai-sdk/openai ~4.0.51`, `@ai-sdk/deepseek ~3.0.36`,
  `@ai-sdk/provider ~4.0.8`, `hono ~4.13.5`, `@hono/node-server ~2.1.1`, `rxjs 7.8.1` (exakt, wie in
  der Shell), `dotenv`, `zod`.
- `agent/tsconfig.json` (new) — `module`/`moduleResolution: nodenext`, `strict`, `verbatimModuleSyntax`,
  `noUnusedLocals`/`noUnusedParameters`, `noEmit`.
- `agent/vitest.config.ts` (new) — Node-Environment, `include: src/**/*.spec.ts`. Frei benennbar; die
  Namenszwang-Regel aus Task 1 (`vitest-base.config.ts`) gilt nur für das Angular-Test-Target.
- `agent/src/config.ts` (new) — `AgentProvider`-Union, `DEFAULT_CONFIG`, `loadConfig(env)` mit
  `AGENT_PROVIDER`/`AGENT_MODEL`, `resolveModel(config, env): LanguageModelV4`.
- `agent/src/agent.ts` (new) — `createAssistantAgent(model)`, Platzhalter-Instruktionen, keine Tools,
  kein Memory.
- `agent/src/server.ts` (new) — `createApp(agents)` (CORS, 404, 400, SSE) plus `main()` hinter einem
  Entry-Guard, damit der Spec `createApp` importieren kann, ohne den Server zu starten. Nach dem
  Review: `toSSEStream` terminiert einen fehlgeschlagenen Run mit `RUN_ERROR` statt mit
  `controller.error()`; Helper `runError(error)`. Zweite Runde: `AGENT_HOST = '127.0.0.1'` an
  `serve()` übergeben, damit nicht auf allen Interfaces gelauscht wird.
- `agent/src/config.spec.ts` (new) — 6 Tests: `it.each` über alle drei Provider (Routing auf die
  eigene Modell-Id, Fehlermeldung nennt die eigene Key-Variable) plus Default-Provider,
  `AGENT_MODEL`-Override und unbekannter `AGENT_PROVIDER`.
- `agent/src/server.spec.ts` (new) — 5 Tests: T2-AC-02, T2-AC-03 (404/400), CORS-Preflight und der
  RUN_ERROR-Fehlerpfad. `startServer(model)` als Helper, weil der Fehlerpfad ein zweites Modell
  braucht.
- `agent/package-lock.json` (new) — 653 Pakete, ohne `--legacy-peer-deps`.
- `.env.example` (new) — `AGENT_PROVIDER`, optionales `AGENT_MODEL`, die drei Key-Variablen.
- `package.json` (modified) — Scripts `start` (concurrently), `start:agent`, `test:agent`;
  `test` = Shell **und** Agent; `postinstall` um `npm --prefix agent install` erweitert;
  devDependency `concurrently ~10.0.5`. Nach dem Review: `start` auf den nicht-watchenden Agent plus
  `--kill-others-on-fail` umgestellt (Begründung in Key Decisions); `start:agent` bleibt watch.
- `.gitignore` (modified) — `agent/node_modules` ergänzt. Der bestehende Eintrag `/node_modules` hat
  führenden Slash und greift nur an der Wurzel.
- `README.md` (modified) — Setup um `.env`-Schritt und den erweiterten `postinstall` ergänzt,
  Scripts-Tabelle um `start`, `start:agent`, `test:agent`. Nach dem Review: Lint-Zeile auf die Shell
  eingeschränkt, `npm start` und `start:agent` in ihrer neuen Rollenteilung beschrieben.

Zwischenzeitlich angelegt und wieder **entfernt** (siehe Test Evidence):
`agent/src/probe.ts`, `agent/src/dump.spec.ts`, `agent/src/errprobe.spec.ts`,
`agent/.claude/` (Tooling-Artefakt).

### Files Read (Context Only)

- `docs/work/m1-spike/plan.md` — Preamble + Task-2-Block.
- `docs/work/m1-spike/task-log/task-1-workspace-scaffold.md` — Vorgänger; lieferte Ports, Script-Lücke
  (`start:agent`), die Ergebnis-statt-Mechanismus-Regel für ACs und die Auflage, temporäre Proben zu
  entfernen.
- `node_modules/@ag-ui/core/dist/index.d.ts` — `RunAgentInputSchema`, `RunErrorEventSchema`,
  `EventType`.
- `node_modules/@ag-ui/mastra/dist/mastra-BRuIwjBo.d.ts` — `MastraAgentConfig`, `MastraAgent.run()`.
- `node_modules/@ag-ui/encoder/dist/index.d.ts` — `encodeSSE`, `getContentType`.
- `node_modules/@mastra/core/dist/llm/model/shared.types.d.ts` — `MastraModelConfig`,
  `MastraLanguageModelV2/V3/V4`.
- `node_modules/@mastra/core/dist/agent/types.d.ts` — Pflichtfelder von `AgentConfigBase`.
- `node_modules/@ai-sdk/provider/dist/index.d.ts` — `LanguageModelV4StreamPart`,
  `LanguageModelV4Usage`, `LanguageModelV4FinishReason`.
- `node_modules/ai/dist/index.d.ts` — `LanguageModel` als Drei-Spec-Union.
- npm-Registry-Metadaten (`npm view`) für alle Kandidatenpakete.

### Key Decisions

— session 2026-08-29

- **`ai@7` gewählt; die Plan-Vorgabe „use the major that `@mastra/core` depends on" ist nicht
  anwendbar.** `@mastra/core@1.63.2` hat `ai` überhaupt nicht als Dependency. Es vendored drei
  Provider-Linien nebeneinander (`@ai-sdk/provider-v5` → 2.0.3, `-v6` → 3.0.14, `-v7` → 4.0.4) und
  meldet zur Laufzeit `supportedLanguageModelSpecifications = ["v2","v3","v4"]`. Damit gibt es keinen
  einen Major. Gewählt wurde die aktuelle konsistente Linie: `ai@7.0.84` mit
  `@ai-sdk/anthropic@4` / `openai@4` / `deepseek@3`, die alle auf `@ai-sdk/provider@4.0.8` stehen.
- **Spec-Version v4 im Rückgabetyp festgenagelt.** `resolveModel` deklariert `LanguageModelV4`.
  Erste Fassung nutzte `LanguageModel` aus `ai` — das ist die Union
  `GlobalProviderModelId | LanguageModelV4 | LanguageModelV3 | LanguageModelV2` und ließ sich
  nicht gegen Mastras eigene Union zuweisen, weil deren Zweige aus den vendorten Provider-Kopien
  stammen. Da Mastra v2/v3/v4 akzeptiert, wäre ohne Annotation offen, welche Version wir eigentlich
  fahren. `@ai-sdk/provider` ist dafür als direkte Dependency deklariert statt über Hoisting benutzt
  — dieselbe Lehre wie beim `supports-color`-Fall aus Task 1.
- **An der Agent-Grenze `MastraModelConfig` statt eines AI-SDK-Typs.** `createAssistantAgent` nimmt
  Mastras eigenen Vertrag entgegen. Das hält die Konvertierung an genau einer Stelle und vermeidet
  einen Cast.
- **Hono + `@hono/node-server` statt `registerApiRoute`.** Der Plan ließ beides zu.
  `registerApiRoute` hätte zusätzlich Mastras Dev-Server-Kette gebraucht, um überhaupt zu servieren;
  der direkte Hono-App-Ansatz hält den SSE-Stream in eigener Hand und bleibt in einer Datei.
- **`MockLanguageModelV4` statt des im AC genannten `MockLanguageModelV3`.** `ai@7` exportiert beide,
  und Mastra akzeptiert beide. V4 ist die Spec-Version, die unsere echten Provider erzeugen — ein
  V3-Mock würde einen Pfad testen, den die Produktion nie nimmt.
- **`createApp` exportiert, `main()` hinter einem Entry-Guard.** Ohne die Trennung hätte der Spec
  beim Import den Server auf Port 3001 gestartet. Der Guard vergleicht `process.argv[1]` mit
  `import.meta.url`.
- **Unbekanntes `AGENT_PROVIDER` wirft, statt still auf Anthropic zu fallen.** Ein Tippfehler in der
  Env würde sonst unbemerkt den falschen (und teureren) Provider fahren.
- **API-Key-Prüfung in `resolveModel`, nicht zur Request-Zeit.** Die AI-SDK-Provider akzeptieren einen
  fehlenden Key und scheitern erst beim ersten Call; das käme als abgebrochener Run beim Nutzer an
  statt als Startfehler.
- **`tsc --noEmit` in `agent`s `test`-Script.** Vitest typprüft nicht. Konkret aufgedeckt: mein
  Mock-`finish`-Chunk hatte in Spec v4 durchweg falsche Formen — `usage.inputTokens` ist dort ein
  Objekt `{ total, noCache, cacheRead, cacheWrite }` statt einer Zahl, `finishReason` ein Objekt
  `{ unified, raw }` statt eines Strings, und `totalTokens` existiert nicht mehr. Die Tests liefen
  mit der falschen Form **grün** durch; erst der Typecheck hat es gefunden.
- **Root-`postinstall` um `npm --prefix agent install` erweitert.** Ohne das wäre T2-AC-04 auf einem
  frischen Checkout nicht erfüllbar, weil `npm test`/`npm start` in ein leeres `agent/node_modules`
  liefen. Gleiche Begründung wie beim Playwright-Hook aus Task 1: ein Hook lässt sich nicht vergessen,
  eine README-Zeile schon.
- **`agent/` als separates npm-Projekt, nicht als npm-Workspace.** Der Plan verlangt eine eigene
  `package.json`; ein Workspace würde die Node-Abhängigkeiten in den Wurzel-Baum hoisten und damit
  genau die Browser-Auflösungsprobleme riskieren, die Task 1 in der Shell entschärft hat.

— session 2026-08-29 (nach Codex-Review)

- **`RUN_ERROR` statt `controller.error()` im Fehlerpfad.** Nachgestellt mit einem Mock, dessen
  `doStream` wirft: die Antwort war `200`/`text/event-stream` mit **ausschließlich** `RUN_STARTED`,
  danach Streamabbruch. `res.text()` warf dabei *nicht* — für den Client sieht das aus wie eine
  erfolgreiche, bloß abgeschnittene Antwort, also ein Run, der startet und nie terminiert. Da die
  200-Header längst raus sind, kann ein Fehler nur noch *im* Stream mitgeteilt werden.
  `toSSEStream` kodiert deshalb ein terminales `RUN_ERROR` und schließt sauber. Die Meldung des
  Upstream-Fehlers wird durchgereicht (im Test scharf asserted).
- **Root-`start` auf den nicht-watchenden Agent plus `--kill-others-on-fail`.** Ursache war schärfer
  als „Watch beendet sich nicht": `tsx watch` wartet auf eine Änderung an einer *importierten*
  Datei, die Korrektur wäre aber ein `.env`-Edit — der Neustart-Trigger kommt nie. Gemessen:
  `timeout 25 npx tsx watch src/server.ts` ohne Key → EXIT=124, also gekillt statt beendet.
  `tsx watch` hat keinen `--exit-on-error`-Schalter. `npm start` ist damit alles-oder-nichts;
  `start:agent` behält den Watch-Dev-Loop. Preis: kein Agent-Hot-Reload in `npm start` — bewusst
  akzeptiert, weil ein halb gestarteter Stack schlimmer ist.
- **CORS automatisiert getestet.** Vorher nur manuell belegt: hätte jemand die `cors()`-Zeile
  entfernt, wären alle acht Tests grün geblieben — ein Regressionsloch auf einer Zeile, die der Plan
  ausdrücklich verlangt. Der Test prüft gegen die exportierte `SHELL_ORIGIN`-Konstante, nicht gegen
  ein Literal.
- **`resolveModel` über alle drei Provider parametrisiert.** T2-AC-01 nennt nur OpenAI, damit blieb
  ausgerechnet die produktive Voreinstellung Anthropic ungetestet: ein falsch verdrahteter
  Switch-Zweig wäre unbemerkt geblieben.
- **Codex-Finding zur HttpAgent-Transformation nicht hier umgesetzt.** Ein solcher Test läge im
  Agent-Paket und prüfte Client-Verhalten; `HttpAgent` entsteht erst in Task 7. Als Open Issue
  dorthin weitergereicht statt am falschen Ort gelöst.

— session 2026-08-29 (zweiter Codex-Review)

- **Auf Loopback gebunden (`AGENT_HOST = '127.0.0.1'`).** `serve()` ohne `hostname` lauscht auf allen
  Interfaces — gemessen: `server.address()` lieferte `::`, `ss` zeigte `LISTEN :::3001`. **CORS ist
  keine Zugriffskontrolle:** der Preflight-Test belegt, dass *Browser* fremde Origins blockieren; ein
  `curl` von einem anderen Rechner ignoriert CORS und könnte Modellaufrufe auf unseren API-Key
  auslösen. Für M1 kostet die Bindung nichts, weil die Shell auf derselben Maschine läuft. Die
  Begründung steht als Kommentar an der Konstante, weil ein blankes `'127.0.0.1'` sonst wie eine
  beliebige Vorgabe aussieht.
- **Abbruch durch den Client stoppt den Modelllauf nicht — bewusst nicht gefixt.** Gemessen mit einem
  langsamen Mock: nach `AbortController.abort()` produzierte das Modell in 2,5 s weitere 20 Chunks.
  Ein Fix ist nicht verfügbar: `@ag-ui/mastra@1.1.2` enthält **null** Vorkommen von `abortSignal`
  oder `AbortController` (Typen und kompilierter Code), und `MastraAgent.run(input)` nimmt kein
  Options-Argument. Ein Abbruchpfad ginge nur, indem man den Adapter umgeht und die
  AG-UI-Übersetzung selbst nachbaut — weit außerhalb von M1. Als Open Issue dokumentiert.

### Review Focus

- **Behavior claims:**
  1. `POST /ag-ui/assistant` mit gültigem `RunAgentInput` liefert einen SSE-Stream, der mit
     `RUN_STARTED` beginnt, den Assistententext trägt und mit `RUN_FINISHED` endet — belegt durch
     `server.spec.ts` gegen einen echten Node-Server, nicht gegen einen Handler-Stub.
  2. Ein fehlgeschlagener Run terminiert den Stream mit `RUN_ERROR` samt Meldung, statt ihn stumm
     abzuschneiden. Der Client sieht immer ein terminales Event.
  3. `npm start` ist alles-oder-nichts: beide Ports oben, oder der Gesamtstart bricht mit exit 1 ab
     und nennt die fehlende Env-Variable.
  4. Der Agent ist ausschließlich über Loopback erreichbar (`LISTEN 127.0.0.1:3001`), nicht aus dem
     lokalen Netz.
- **Assumptions / choices:** Drei AC-/Plan-Texte waren gegen die real installierten Versionen nicht
  haltbar und wurden begründet ersetzt: der `ai`-Major (es gibt keinen), `MockLanguageModelV3`
  (V4 passt zur Produktion) und `TEXT_MESSAGE_CONTENT` (die Leitung trägt `TEXT_MESSAGE_CHUNK`).
  Zusätzlich waren vier im Plan nicht gelistete Pakete nötig: `hono`, `@hono/node-server` (Server),
  `rxjs` (Typen an der Observable-Grenze), `@ai-sdk/provider` (der Rückgabetyp).
- **Scope notes:** Über die reine Task-Oberfläche hinaus geändert: `postinstall` (sonst ist AC-04 auf
  frischem Checkout unerfüllbar), `agent`s `test` um `tsc --noEmit` erweitert, `.gitignore` um
  `agent/node_modules`, und nach dem Review der Fehlerpfad in `toSSEStream` plus die Umstellung von
  Root-`start`. Bewusst **nicht** gemacht: ESLint für `agent/`, der HttpAgent-Integrationstest und
  die `uuid`-Messung aus Task 1 — alle drei in Open Issues mit Zieltask.
- **Read next:**
  1. `agent/src/server.ts:54-86` — `toSSEStream` und `runError`; der Kern des Tasks und die Stelle,
     an der Observable-Abbruch, Fehlerterminierung und Stream-Schließung zusammenlaufen. Der
     Kommentar hält fest, warum ein Fehler nur noch *im* Stream mitgeteilt werden kann.
  2. `agent/src/config.ts:43-64` — `resolveModel`; warum die Key-Prüfung hier sitzt und warum der
     Rückgabetyp die Spec-Version festlegt.
  3. `agent/src/server.spec.ts:10-23` — `HELLO_CHUNKS`; die getippte Mock-Form ist der Grund, warum
     der Typecheck Teil des Test-Scripts ist. Der Kommentar an `TEXT_EVENTS` hält den
     Chunk-vs-Content-Befund fest.

### Test Evidence

— session 2026-08-29

```
$ npm test            # Shell 2 passed (2), Agent 8 passed (8)   → exit 0
$ npm run lint        → exit 0   ("All files pass linting")
$ npm run build       → exit 0
$ npm --prefix agent ls --depth=0   → exit 0   (ohne --legacy-peer-deps)
```

Manuelle Verifikationen am laufenden `npm start` (außerhalb der Sandbox, siehe unten):

- **Beide Ports (AC-04):** `curl localhost:4200/` → `200`;
  `curl -X POST localhost:3001/ag-ui/unknown` → `404`.
  Agent-Log: `AG-UI agent on http://localhost:3001 (provider: anthropic)`.
- **CORS-Preflight:** `curl -X OPTIONS .../ag-ui/assistant -H 'Origin: http://localhost:4200'`
  → `204` mit `access-control-allow-origin: http://localhost:4200`.
- **400-Pfad live:** `curl -X POST .../ag-ui/assistant -d '{"threadId":"x"}'` → `400`.
- **SSE live:** gültiger `RunAgentInput` → erste Zeile
  `data: {"type":"RUN_STARTED","threadId":"t1","runId":"r1"}` (der Lauf lief danach gegen einen
  Dummy-Key, das Streaming selbst ist damit belegt).

**Sandbox-Einschränkung:** `tsx watch` legt einen Unix-Socket unter `$TMPDIR/tsx-*/…​.pipe` an; in der
Sandbox scheitert das mit `EPERM: listen`. Die Shell startete dort normal, der Agent nicht. AC-04
wurde deshalb außerhalb der Sandbox verifiziert. Kein Code-Defekt — `npm run start` (ohne `watch`)
wäre auch in der Sandbox gelaufen.

**Temporäre Proben — alle entfernt, keine liegt noch im Baum:**

- `agent/src/probe.ts` — prüfte, welchen konkreten Typ die drei Provider-Factories zurückgeben,
  nachdem `LanguageModel` aus `ai` an Mastras Union scheiterte. Ergebnis führte zur Entscheidung
  „Spec-Version v4 im Rückgabetyp". Datei entfernt.
- `agent/src/dump.spec.ts` — schrieb den rohen SSE-Body in eine Datei. **Das war der Fund dieses
  Tasks:** die Leitung trägt `TEXT_MESSAGE_CHUNK`, nicht das im AC erwartete `TEXT_MESSAGE_CONTENT`.
  Die Erkenntnis steht dauerhaft als Kommentar an `TEXT_EVENTS` in `server.spec.ts`. Datei entfernt.
- `agent/.claude/` — vom Tooling angelegtes leeres Verzeichnis, entfernt, damit `git add agent/`
  es nicht mitnimmt.

Nicht entfernt, aber gitignored: eine lokale `.env` mit `ANTHROPIC_API_KEY=dummy-key-for-local-startup`,
angelegt für die AC-04-Startprobe. Für echte Modell-Läufe muss der Key ersetzt werden.

— session 2026-08-29 (nach Codex-Review)

```
$ npm test      # Shell 2 passed (2), Agent 14 passed (14)   → exit 0
$ npm run lint  → exit 0
$ npm run build → exit 0
```

Nachgestellte Defekte (beide vor dem Fix reproduziert):

- **Fehlerpfad ohne terminales Event:** Mock mit werfendem `doStream` → `STATUS=200`,
  `CT=text/event-stream`, Body = nur `data: {"type":"RUN_STARTED",…}`. Nach dem Fix endet derselbe
  Lauf auf `RUN_ERROR` mit durchgereichter Meldung
  (`server.spec.ts::terminates the stream with RUN_ERROR instead of truncating it`).
- **Watch beendet sich nicht:** `timeout 25 npx tsx watch src/server.ts` ohne Key → **EXIT=124**
  (von `timeout` gekillt), Stacktrace nennt `resolveModel`.

Start-Verhalten nach dem Fix, beide Richtungen belegt:

```
ohne .env:  npm start → EXIT=1
            [agent] Error: Missing API key for provider "anthropic": set ANTHROPIC_API_KEY.
            [shell] npm run start:shell exited with code 143      ← mitgerissen
mit .env:   shell 4200 → 200 | agent 3001 → 404                   ← T2-AC-04 weiterhin erfüllt
```

**Temporäre Proben dieser Session — entfernt:** `agent/src/errprobe.spec.ts` (schrieb Status,
Content-Type und Body des Fehlerpfads in eine Datei; lieferte den Befund oben). Der erste
`npm start`-Lauf ohne `.env` war verfälscht — auf 4200 lief noch ein Rest eines früheren detached
Starts, also scheiterte die Shell statt des Agents; nach Aufräumen sauber wiederholt.

— session 2026-08-29 (zweiter Codex-Review)

```
$ npm test      # Shell 2 passed (2), Agent 14 passed (14)   → exit 0
$ npm run lint  → exit 0
$ npm run build → exit 0
```

Beide Findings vor dem Eingriff nachgemessen:

```
BIND address=::  family=IPv6            ← vorher: alle Interfaces
produced beim Abbruch:        0
produced 2.5s nach Abbruch:  20         ← Modell lief nach Client-Abbruch weiter
```

Nach dem Loopback-Fix, am laufenden `npm run start:agent`:

```
$ ss -lntp | grep :3001
LISTEN 0 511  127.0.0.1:3001  0.0.0.0:*  users:(("node-MainThread",…))

$ curl -X POST localhost:3001/ag-ui/unknown   → 404   (lokal weiterhin erreichbar)
```

Einschränkungen dieser Messungen, damit sie nicht mehr behaupten als sie zeigen:

- Der Gegentest „von der LAN-IP nicht erreichbar" ließ sich **nicht** durchführen — `hostname -I`
  lieferte keine Adresse. Belegt ist die Bind-Adresse selbst (`127.0.0.1` statt `::`), nicht ein
  fehlgeschlagener Zugriff von außen.
- Die Abbruch-Messung zeigt, dass das Modell **weiterläuft** — nicht, ob unser `cancel()` überhaupt
  aufgerufen wurde. Die Unterscheidung ist gegenstandslos, weil der Adapter keinerlei Abort-Code
  enthält: auch ein sauber ausgeführtes `unsubscribe` könnte die Generierung nicht stoppen.

**Temporäre Probe dieser Session — entfernt:** `agent/src/probe2.spec.ts` (langsamer Mock mit
Chunk-Zähler, ermittelte Bind-Adresse und Abbruchverhalten; lieferte beide Messungen oben).

### Acceptance Coverage

- **T2-AC-01** — passed, über die im AC genannte OpenAI-Hälfte hinaus. `agent/src/config.spec.ts`
  parametrisiert `it.each` über alle drei Provider: `T2-AC-01 routes $provider to its own model id`
  (modelId gegen Config, `provider` gegen die Provider-Kennung) und
  `T2-AC-01 throws an error naming $envVar when the key is missing`. Damit ist auch der produktive
  Default Anthropic abgedeckt.
- **T2-AC-02** — passed, mit einer Abweichung im Event-Namen.
  `agent/src/server.spec.ts::T2-AC-02 streams RUN_STARTED, the assistant text and RUN_FINISHED in
  order`: Agent auf `MockLanguageModelV4` („hello"), echter `@hono/node-server` auf Port 0, `fetch`
  gegen den realen Port, SSE-Body geparst. Asserted sind `RUN_STARTED` vor `RUN_FINISHED`, der Text
  „hello" und dessen Position dazwischen.
  **Abweichung:** der Adapter emittiert den Text als `TEXT_MESSAGE_CHUNK`, nicht als
  `TEXT_MESSAGE_CONTENT`. Das ist die AG-UI-Kurzform, die Clients zu
  `TEXT_MESSAGE_START/CONTENT/END` expandieren — das AC beschreibt also die Client-Sicht nach der
  Transformation, nicht den Wire-Vertrag des Servers. Der Test akzeptiert beide Schreibweisen, damit
  er nicht bricht, falls der Adapter später die expandierte Form sendet.
  **Abweichung:** `MockLanguageModelV4` statt `MockLanguageModelV3` (Begründung in Key Decisions).
- **T2-AC-03** — passed. `agent/src/server.spec.ts`:
  `T2-AC-03 returns 404 for an unknown agent` und
  `T2-AC-03 returns 400 for a body that is not a RunAgentInput`; beide zusätzlich am laufenden
  Server per curl bestätigt (siehe Test Evidence).
- **T2-AC-04** — passed über manuelle Verifikation, jetzt in beide Richtungen: `npm start` bringt
  4200 (`200`) und 3001 (`404` auf unbekannten Agenten) hoch, und ein Konfigfehler lässt den
  Gesamtstart mit exit 1 abbrechen statt eine halb laufende Shell zurückzulassen. `npm test` →
  exit 0 über beide Suiten.

### Open Issues

- **`agent/node_modules` ist 617 MB.** `@ag-ui/mastra` führt `@copilotkit/runtime ^1.60.1` und
  `@mastra/client-js` als **erforderliche** Peers; npm installiert sie automatisch, und
  `@copilotkit/runtime` zieht seinerseits die komplette LangChain-Familie (`langchain`, `@langchain/*`,
  `@ai-sdk/google-vertex`, `groq-sdk`, `openai`) als eigene Peers nach. Nichts davon wird benutzt.
  `npm ls --depth=0` ist trotzdem sauber. Für M1 tragbar; vor M2 prüfen, ob ein scoped `overrides`-
  Eintrag oder ein anderer Adapter das abschneidet. (→ M2)
- **`agent/` wird nicht gelintet.** `npm run lint` ist `ng lint` und deckt nur das Angular-Projekt ab.
  Typprüfung greift (im `test`-Script), ESLint nicht. Eine zweite ESLint-Konfiguration für Node-TS
  wäre die Lösung; kein AC verlangt sie. (→ Folgeaufgabe)
- **Die Chunk-vs-Content-Behauptung ist clientseitig unverifiziert.** `server.spec.ts` akzeptiert
  `TEXT_MESSAGE_CHUNK` als Texttransport, und der Kommentar dort behauptet, AG-UI-Clients
  expandierten das zu START/CONTENT/END. Belegt ist nur die Serverseite; ob `HttpAgent` in der
  installierten Version tatsächlich so transformiert, ist ungetestet und gegen Versionsdrift
  ungeschützt. (→ Task 7)
- **Ein Client-Abbruch stoppt den Modelllauf nicht.** Gemessen: nach `AbortController.abort()` lief
  die Generierung weiter (20 Chunks in 2,5 s). Unser `cancel()` beendet nur das RxJS-Abonnement;
  `@ag-ui/mastra@1.1.2` hat keinen Abbruchpfad (`abortSignal`/`AbortController`: null Vorkommen,
  `MastraAgent.run(input)` ohne Options-Argument). Der Run endet zwar von selbst — es ist
  Verschwendung, kein Leck —, aber zwischen Abbruch und Ende entstehen Tokens, die niemand liest.
  Für M1 folgenlos (ein lokaler Nutzer, kein Stop-Button). Relevant, sobald die Chat-Page einen
  Abbruch anbietet oder gehostet wird. Ein Fix hieße, den Adapter zu umgehen. (→ Task 7 / M4)
- **`uuid`-Alias weiterhin offen — jetzt auf Task 7 datiert.** Task 1 hatte die Messung auf Task 2
  gelegt. Das greift nicht: `@ag-ui/client` ist ein Browser-Import der Shell, und Task 2 baut
  ausschließlich die Server-Seite; es gab keinen Consumer, an dem sich etwas messen ließe. Erster
  echter Messpunkt ist die Chat-Page. (→ Task 7)
- **Produktions-Bundle-Problem von CopilotKit unverändert offen** (aus Task 1). Betrifft die Shell,
  nicht `agent/`. (→ Task 7)
- **`gpt-5.4-mini` als OpenAI-Modell-Id ist ungeprüft.** Der Plan nennt „ein billiges OpenAI-Modell
  (das Buch nutzte GPT-5.4 mini)". Die Id ist nie gegen die Registry validiert worden, weil kein
  OpenAI-Key vorliegt; T2-AC-01 prüft nur, dass `modelId` der Config entspricht, nicht dass das
  Modell existiert. Beim ersten Cross-Check-Lauf verifizieren. (→ Task 9)
- **Kein Lauf gegen ein echtes Modell.** Alle Tests laufen gegen Mocks; die Provider-Pfade
  (`createAnthropic`/`createOpenAI`/`createDeepSeek`) sind nur bis zur Modell-Instanz belegt, nicht
  bis zur Antwort. Das ist Absicht — der erste echte Lauf gehört zum Prompt-Task. (→ Task 9)

### Context for Next Task

- **Wire-Vertrag des Servers:** `POST http://localhost:3001/ag-ui/:agentId`, Body = `RunAgentInput`,
  Antwort = `text/event-stream` mit AG-UI-Events, eine `data:`-Zeile pro Event. Der Server kennt
  **kein** A2UI: keine Server-Tools, kein `getA2UITools`, kein `registerCopilotKit`. Client-Tools
  kommen in `input.tools[]` an, `context[]` legt der Adapter unter `requestContext.get('ag-ui')` ab.
- **Der Fehlerpfad gehört zum Wire-Vertrag:** ein fehlgeschlagener Run endet mit `RUN_ERROR`
  (`{ type, message }`), nicht mit einem abgebrochenen Stream. Clients dürfen sich auf ein terminales
  Event verlassen — `RUN_FINISHED` oder `RUN_ERROR`.
- **Ein Run = ein POST = ein SSE-Response.** Ein Client-Tool-Call beendet den Run mit seinen
  `TOOL_CALL_*`-Events; der Client führt den Handler aus und startet den nächsten Run.
- **Event-Namen auf der Leitung:** Assistententext kommt als `TEXT_MESSAGE_CHUNK` (`role`,
  `messageId`, `delta`), nicht als `TEXT_MESSAGE_START/CONTENT/END`. Wer clientseitig auf die
  expandierte Form wartet, muss die Chunk-Transformation von `@ag-ui/client` im Pfad haben — und
  sollte sie dort auch testen (siehe Open Issues).
- **Signaturen:**
  - `createApp(agents: ReadonlyMap<string, Agent>): Hono` — der Spec baut sich damit eine eigene
    Agent-Map; `main()` läuft nur, wenn die Datei direkt ausgeführt wird.
  - `loadConfig(env): AgentConfig` / `resolveModel(config, env): LanguageModelV4` — beide pur, beide
    aus Node importierbar.
  - `createAssistantAgent(model: MastraModelConfig): Agent`, `ASSISTANT_AGENT_ID = 'assistant'`,
    `SHELL_ORIGIN`, `AGENT_HOST` (Loopback), `AGENT_PORT`.
- **Spec-Versionen sind ein Stolperstein.** Mastra akzeptiert Modelle nach Spec v2, v3 **und** v4
  gleichzeitig und vendored dafür drei `@ai-sdk/provider`-Kopien. Wer ein Modell oder einen Mock
  anfasst, muss wissen, welche Version gemeint ist — wir fahren durchgängig **v4**. Die Formen
  unterscheiden sich real (v4: `finishReason` und `usage.inputTokens` sind Objekte, `totalTokens`
  gibt es nicht mehr), und Vitest merkt den Unterschied nicht. Deshalb steht `tsc --noEmit` vor
  `vitest run`.
- **`npm start` ≠ `npm run start:agent`:** ersteres fährt den Agent ohne Watch und reißt bei
  Fehlstart beide Prozesse ab (alles-oder-nichts); letzteres ist der Watch-Dev-Loop. Wer am
  Agent-Code arbeitet, nimmt `start:agent` in einem zweiten Terminal.
- **`.env` ist Pflicht für jeden Start**, nicht nur für echte Läufe: `resolveModel` wirft ohne Key.
  Vorlage in `.env.example`.
- **Zwei getrennte Testketten:** Shell = Vitest Browser Mode (Chromium, `vitest-base.config.ts`),
  Agent = Vitest Node (`agent/vitest.config.ts`). Sie teilen sich nichts außer dem Root-`test`-Script.

### Git State

```
$ git diff --stat
 .gitignore        |  1 +
 README.md         | 27 ++++++++++++++----
 package-lock.json | 85 +++++++++++++++++++++++++++++++++++++++++++++++++++++++
 package.json      |  8 ++++--
 4 files changed, 113 insertions(+), 8 deletions(-)

$ git status --short
 M .gitignore
 M README.md
 M package-lock.json
 M package.json
?? .env.example
?? agent/
```

Hinweis für `/commit 2`: Die Sandbox legt unter `agent/` wiederholt `.claude/` und `.mcp.json` als
Device-Nodes an. Sie sind keine echten Dateien und gehören nicht in den Commit — `agent/` gezielt
stagen statt pauschal `git add agent/`.

### Sessions

- claude-code 208f036e-c170-4664-b9e4-5aeb21c1c785 (2026-08-29) — transcript: /home/lutz/.claude/projects/-home-lutz-projects-conference-finder/208f036e-c170-4664-b9e4-5aeb21c1c785.jsonl
