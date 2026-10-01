# Task 1: Scaffold the `conference-finder` workspace with Vitest (Node + Browser Mode)

### Task

Angular-21-Workspace im bestehenden Repo aufgesetzt (Projekt `shell`, zoneless, OnPush-Default,
`@angular-eslint`), die A2UI-/CopilotKit-/AG-UI-Pakete installiert und ihre Browser-Auflösung
verifiziert, und die Testkette auf `@angular/build:unit-test` mit Vitest Browser Mode in Headless
Chromium gestellt. Die Auflösungsprüfung lief als temporäre Probe und ist nicht Teil des
Ergebnisses (siehe Test Evidence).

### Status

DONE — `test:shell` / `lint` / `build` grün. Vier der fünf Akzeptanzkriterien sind `passed`;
T1-AC-01 steht auf `partial`, weil die im AC-Text vorgeschriebene Pure-Function-Spec entfällt —
die Ergebnis-Hälfte des Kriteriums ist erfüllt (Begründung in Acceptance Coverage).

### Files Modified

- `package.json` (new) — Pins (`@angular/*` `~21.2.22`, CDK `~21.2.14`, `@a2ui/*`, `@ag-ui/*`,
  `@copilotkit/angular ~0.3.1`, `zod ^4.4.3`, `rxjs 7.8.1` exakt), Scripts `start:shell`,
  `test:shell`, `test`, `lint`, `build`; `engines.node >= 24`; Projektname auf `conference-finder`
  gesetzt (das CLI hätte `shell` genommen). Nach Review ergänzt:
  `postinstall: playwright install chromium` und `supports-color ^7.2.0` als devDependency.
- `angular.json` (new) — Projekt `shell`; `serve.options.port 4200`; `test.options`
  `{ runner: vitest, browsers: [ChromiumHeadless], runnerConfig: true }`;
  `schematics['@schematics/angular:component'].changeDetection = OnPush`.
- `vitest-base.config.ts` (new) — Alias `supports-color` → `supports-color/browser.js`. Ohne ihn
  scheitert jeder Spec, der `@copilotkit/angular` importiert. Dateiname ist vom Angular-Builder
  vorgegeben (`findVitestBaseConfig` sucht ausschließlich `vitest-base.config.*`).
- `eslint.config.js` (new, via `ng add`, danach erweitert) — `prefer-signals`, `prefer-inject`,
  `prefer-standalone`, `prefer-on-push-component-change-detection`, `prefer-host-metadata-property`.
- `src/app/app.ts` (modified) — `ChangeDetectionStrategy.OnPush` ergänzt, Titel auf
  `ConferenceFinder`.
- `src/app/app.html` (modified) — Angulars 20-KB-Willkommensseite durch minimales Shell-Template
  ersetzt.
- `src/app/app.config.ts` (modified) — `provideZonelessChangeDetection()` ergänzt; Angular 21
  generiert es nicht mehr, AC-05 verlangt es explizit.
- `src/app/app.spec.ts` (modified) — Render-Spec plus Guard, dass wirklich Chromium und nicht jsdom
  läuft.
- `.gitignore` (new, via CLI) — um `.env` ergänzt; der VS-Code-Block auf `.vscode/` verkürzt,
  nachdem das Verzeichnis entfernt wurde (fünf Ausnahme-Regeln ohne Gegenstück).
- `LICENSE` (new) — MIT, Lutz Leonhardt.
- `README.md` (new) — Stub mit dem Thesensatz, Scripts-Tabelle, Node-Anforderung. Nach Review um
  eine Setup-Sektion ergänzt (Chromium-Bezug über `postinstall`, Handgriff bei
  `--ignore-scripts`).
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.spec.json`, `.editorconfig`, `.prettierrc`,
  `src/main.ts`, `src/index.html`, `src/styles.css`, `src/app/app.css`, `src/app/app.routes.ts`,
  `public/favicon.ico` (new) — CLI-Generat, inhaltlich unverändert.
- `package-lock.json` (new) — 538 Pakete, ohne `--legacy-peer-deps`.

Zwischenzeitlich angelegt und wieder **entfernt** (siehe Key Decisions):
`src/chalk-stub.ts`, `src/node-shims.ts`, `compilerOptions.paths` in `tsconfig.json`,
`src/app/toolchain.spec.ts` (Import-Probe für AC-02, nach der Verifikation entfernt),
`.vscode/` komplett (`launch.json`, `tasks.json`, `extensions.json`, `mcp.json`).

### Files Read (Context Only)

- `docs/work/m1-spike/plan.md` — Preamble + Task-1-Block.
- `docs/book-learnings.md` (vor der Veröffentlichung entfernt) — Stack-Einordnung; lieferte den
  Hinweis auf den richtigen Referenz-Branch.
- `node_modules/@angular/build/src/builders/unit-test/**` — `browser-provider.js` (Browser-Namens-
  Normalisierung), `configuration.js` (Config-Dateinamen), `plugins.js` (`resolve`/`optimizeDeps`-
  Merge, `mainFields`), `executor.js`, `schema.json`.
- `node_modules/@a2ui/web_core/src/v0_9/**`, `@a2ui/angular/types/**` — Export-Pfade für AC-02.
- `node_modules/@copilotkit/shared/dist/**`, `chalk/source/*`, `supports-color/**` — Ursachenanalyse.
- `~/projects/flights42`, Branch `origin/agentic-angular` — `package.json`, `angular.json`,
  `vitest.config.ts`, `src/testing/vitest-setup.ts`. **Keine Lizenz — nichts kopiert**, nur
  Mechanismus abgeleitet und eigenständig implementiert.

### Key Decisions

— session 2026-08-28

- **`browsers: ['ChromiumHeadless']` statt `ChromeHeadless` (Plan-Abweichung).** Der Builder
  normalisiert per `normalizeBrowserName`: Kleinschreibung, Suffix `headless` abschneiden. Aus
  `ChromeHeadless` wird `chrome`, das der Playwright-Provider nicht kennt (nur `chromium`,
  `firefox`, `webkit`) — der Lauf bricht mit „Browser 'chrome' is not supported" ab. Das
  Referenzprojekt nutzt dieselbe Chromium-Benennung.
- **`prefer-host-metadata-property` aktiviert statt `no-host-metadata-property` deaktiviert
  (Plan-Abweichung).** Die im Plan genannte Regel existiert in angular-eslint 21.4.0 nicht mehr;
  sie wurde durch die Umkehrung ersetzt, die genau der Projektkonvention entspricht. Eine
  unbekannte Regel zu konfigurieren würde ESLint zum Abbruch bringen.
- **`@angular/cdk` auf `~21.2.14` statt `~21.2.22` (Plan-Abweichung).** CDK-Patchversionen laufen
  nicht synchron zu `@angular/core`; 21.2.14 ist der `v21-lts`-Stand.
- **Alias auf `supports-color/browser.js` statt chalk zu stubben.** `@copilotkit/shared` trägt in
  seinem Telemetrie-Modul ein reines Side-Effect-`import "chalk"` (chalk wird dort nicht benutzt).
  chalk selbst ist browsersicher — null Zugriffe auf `process`/`tty`/`os` in allen drei
  Quelldateien. Sämtliche Node-Zugriffe stecken in `supports-color`, das einen eigenen Browser-Build
  mitliefert, ihn aber nur über das Legacy-Feld `browser` ankündigt. Angulars Vitest-Runner löst mit
  `mainFields: ['es2020','module','main']` auf — ohne `browser` —, und da `supports-color` keine
  `exports`-Map hat, greift auch die gesetzte `browser`-*Condition* nicht. Der Alias holt genau das
  nach. Erste Fassung war ein chalk-Stub; verworfen, weil er die ganze Bibliothek entfernt statt das
  eine falsch aufgelöste Glied zu korrigieren — er bräche, sobald irgendwo `chalk.red(...)` liefe.
- **`uuid`-Alias und `process`-Shim bewusst NICHT gesetzt**, obwohl Buch und Referenzprojekt beide
  vorsehen. `uuid@11.1.1` hat eine moderne `exports`-Map mit `browser`-Condition und browsersicherem
  `default`, ist also ein anderer Fall als `supports-color`; der `process`-Shim erwies sich nach
  korrekter Auflösung als messbar überflüssig. Beides in Task 2 messen statt auf Verdacht übernehmen.
- **tsconfig-`paths` als Alias-Mechanismus verworfen.** Getestet: greift für Imports aus
  `node_modules`-ESM weder im Vitest-Dep-Optimizer noch im Produktions-Build. Wieder entfernt, damit
  keine wirkungslose Konfiguration zurückbleibt.
- **`runnerConfig: true`** statt expliktem Pfad. Der Builder sucht dann `vitest-base.config.*`;
  der konventionellere Name `vitest.config.ts` wäre nur mit explizitem Pfad möglich — nicht
  umgestellt, um die Task-1-Oberfläche klein zu halten.
- **Pure-Function-Spec auf Schema-Ebene.** `BASIC_FUNCTIONS[].execute()` verlangt einen
  `DataContext`, der ein `SurfaceModel` braucht; das gehört in den Task, der den Katalog baut. Statt
  Infrastruktur zu erfinden, prüft der Spec `returnType` und das zod-Schema — ebenfalls pur.

— session 2026-08-28 (nach Codex-Review)

- **`postinstall: playwright install chromium` statt Doku-Zeile.** `playwright@1.62.1` hat
  überhaupt keine `scripts` — Browser werden bei `npm install` nicht geladen. Auf einem frischen
  Checkout brach `test:shell` also, und AC-01 war faktisch auf genau einer Maschine belegt. Ein
  Script plus README-Hinweis hilft nur dem, der die README liest; der Hook ist idempotent (bei
  vorhandenem Cache nahezu kostenlos) und lässt sich nicht vergessen. README nennt zusätzlich den
  Handgriff für `--ignore-scripts`-Umgebungen.
- **`supports-color` als devDependency deklariert.** `vitest-base.config.ts` löst
  `supports-color/browser.js` auf, das Paket hing aber nur über Hoisting
  (`@copilotkit/shared → chalk`) an der Wurzel. Bei geändertem Hoisting hätte `require.resolve`
  geworfen und die **gesamte** Vitest-Config wäre nicht mehr geladen — nicht nur ein Test. Nach
  `npm ci` steht es als direkte Dependency an der Wurzel, chalks Kopie ist `deduped`.
- **`ng test`-Launcher entfernt statt ersetzt.** Ein Vitest-taugliches Äquivalent hätte Annahmen
  über UI-Port und Debug-Ablauf gebraucht, die ich nicht verifizieren konnte. Eine falsche
  Konfiguration ist schlechter als keine.
- **`engines.node` bleibt `>=24`.** Das Review las Angulars LTS-Warnung als Support-Verletzung;
  `@angular/build`, `@angular/cli` und `@angular/core` deklarieren aber alle
  `^20.19.0 || ^22.12.0 || >=24.0.0`. Node 25.5 liegt darin. Die Meldung ist ein
  Produktionshinweis, keine Inkompatibilität — kein Grund, die Range zu verengen.

— session 2026-08-28 (Test-Review)

- **`src/app/toolchain.spec.ts` wieder entfernt.** Der Spec prüfte per `typeof … === 'function'`,
  ob installierte Pakete ihre Exporte mitbringen, plus das zod-Schema von `BASIC_FUNCTIONS.add` —
  durchweg Fremdcode, den die App nicht benutzt. Zwei Einwände tragen: die Auswahl der geprüften
  Symbole ist willkürlich (warum nicht `signal`, Router, RxJS?), und ein Fehlschlag hätte keine
  Handlung ausgelöst. Wertvoll war der **Lauf** — er fand den `supports-color`-Konflikt früh statt
  in Task 5 —, nicht der dauerhafte Verbleib im Repo. Die Randbedingung steht dort, wo sie bindet:
  als Kommentar in `vitest-base.config.ts`. Damit ist auch die frühere Entscheidung
  „Pure-Function-Spec auf Schema-Ebene" hinfällig: richtig war die Beobachtung, dass `execute()`
  ein `SurfaceModel` bräuchte — falsch die Schlussfolgerung, dann eben das Schema zu testen, statt
  festzustellen, dass Task 1 gar keine eigene Pure Function hat.
- **`.vscode/` entfernt statt weitergepflegt.** Vier CLI-generierte Dateien für einen Editor, den
  das Projekt nicht benutzt (`.idea/` ist die reale Umgebung). Das verwirft die
  `launch.json`-Korrektur aus dem Codex-Review; eine gepflegte Konfiguration für einen ungenutzten
  Editor ist trotzdem Ballast. `.gitignore` entsprechend auf `.vscode/` verkürzt, damit keine
  wirkungslosen Ausnahme-Regeln zurückbleiben.
- **`<router-outlet />` mit leerem `Routes`-Array bleibt.** Rendert aktuell nichts, ist aber
  CLI-Standard und vom Plan konsumiert (`plan.md:264` „app routes/root render the chat page",
  `plan.md:279` listet `app.routes.ts`). Kein YAGNI-Fall: der Bedarf ist belegt, nicht vermutet.
- **Prozess-Konsequenz außerhalb dieses Repos** (nicht Teil dieses Commits): `~/.claude/skills/plan`
  verlangt jetzt Ergebnis- statt Mechanismus-Phrasierung für ACs und lässt „Kommando + Ergebnis im
  Log" als vollwertige Verifikation gelten; `~/.claude/skills/wrap-up` verlangt, dass temporäre
  Proben vor Task-Abschluss entfernt und in `Test Evidence` protokolliert werden. Auslöser war
  T1-AC-02, das eine Testdatei vorschrieb statt eines beobachtbaren Ergebnisses.

### Review Focus

- **Behavior claims:**
  1. `npm run test:shell` führt Specs in echtem Headless Chromium aus, nicht in jsdom — durch eine
     eigene Assertion auf `navigator.userAgent` abgesichert.
  2. `npm run lint` schlägt fehl, sobald eine Komponente OnPush verletzt oder `@Input()` nutzt.

  Der frühere dritte Claim („Import der vier Bibliotheken bundelt und lädt fehlerfrei") ist
  entfallen: er war nur durch die inzwischen entfernte Import-Probe belegt. Das Ergebnis steht in
  `Test Evidence`, behauptet wird es hier nicht mehr.
- **Assumptions / choices:** Der Plan schrieb `ChromeHeadless`, `no-host-metadata-property` und CDK
  21.2.22 vor — alle drei sind gegen die real installierten Versionen falsch und wurden begründet
  ersetzt (siehe Key Decisions). Zusätzlich war eine im Plan nicht vorgesehene Datei nötig
  (`vitest-base.config.ts`), ohne die AC-02 nicht erfüllbar ist. T1-AC-01 und T1-AC-02 schrieben
  konkrete Specs vor statt beobachtbarer Ergebnisse; nachgewiesen wurde das Ergebnis, die
  vorgeschriebenen Dateien blieben nicht (siehe Acceptance Coverage).
- **Scope notes:** `.gitignore` um `.env` ergänzt (vom Plan gefordert). Nach dem Review zusätzlich
  außerhalb der reinen Task-Oberfläche geändert: `postinstall`-Hook, `supports-color`-Deklaration,
  die README-Setup-Sektion. Danach entfernt: die Import-Probe `src/app/toolchain.spec.ts` und das
  gesamte `.vscode/` (mit passender `.gitignore`-Verkürzung). Der Produktions-Bundle-Pfad für
  CopilotKit wurde untersucht, aber **bewusst nicht** repariert — kein AC verlangt es, und die App
  importiert CopilotKit noch nicht (siehe Open Issues).
- **Read next:**
  1. `vitest-base.config.ts` — der einzige nicht offensichtliche Baustein; der Kommentar hält die
     Ursache fest, die Begründung steht oben.
  2. `angular.json`, `projects.shell.architect.test.options` — drei Optionen, an denen die gesamte
     Browser-Mode-Kette hängt.
  3. `src/app/app.spec.ts` — die einzigen verbliebenen Specs; der nicht offensichtliche Teil ist
     der jsdom-Guard, nicht die Render-Assertion.

### Test Evidence

— session 2026-08-28

```
$ npm run test:shell
 Test Files  2 passed (2)
      Tests  5 passed (5)
exit 0

$ npm run lint     → exit 0
$ npm run build    → exit 0
$ npm ls --depth=0 → exit 0   (keine Peer-Konflikte, ohne --legacy-peer-deps)
```

Manuelle Verifikationen:

- **Browser-Mode-Negativprobe:** ohne `browsers` in `angular.json` liefe alles in jsdom; die
  Assertion `navigator.userAgent` enthält `HeadlessChrome` deckt das auf.
- **Lint-Negativprobe (AC-05):** Wegwerf-Komponente mit `@Input()` und ohne OnPush →
  `npm run lint` **exit 1** mit `@angular-eslint/prefer-on-push-component-change-detection` und
  `@angular-eslint/prefer-signals`; nach Entfernen wieder exit 0.
- **OnPush-Schematic-Default:** `ng generate component demo-check` erzeugte
  `changeDetection: ChangeDetectionStrategy.OnPush`; Komponente danach entfernt.
- **Dev-Server (AC-04):** `npm run start:shell` → `curl -sI localhost:4200` = `HTTP/1.1 200 OK`,
  Body enthält `<app-root></app-root>`.
- **Produktions-Build-Probe:** CopilotKit testweise in `app.config.ts` importiert → `ng build`
  exit 0, aber mit Warnungen, dass `chalk` und `@segment/analytics-node`/`node-fetch` als CommonJS
  gebündelt werden. Probe zurückgesetzt.

— session 2026-08-28 (nach Codex-Review)

Clean-Install-Lauf, der die Reproduzierbarkeit belegt:

```
$ npm ci                  # löscht node_modules, führt postinstall aus
added 654 packages … exit 0

$ npm run postinstall     # Hook direkt, idempotent
> playwright install chromium   → exit 0

$ npm run test:shell
 Test Files  2 passed (2)
      Tests  5 passed (5)
exit 0

$ npm run lint     → exit 0
$ npm run build    → exit 0
$ npm ls --depth=0 → exit 0

$ npm ls supports-color
├─┬ @copilotkit/angular@0.3.1 → chalk@4.1.2 → supports-color@7.2.0 deduped
└── supports-color@7.2.0          # jetzt direkte Dependency
```

Einschränkung: `npm ci` setzt `node_modules` neu auf, der Playwright-Browser-Cache unter
`~/.cache/ms-playwright` wurde **nicht** geleert. Belegt ist damit, dass der Hook läuft und
idempotent ist — nicht der Kaltstart-Download. Auf CachyOS meldet Playwright zusätzlich
`your OS is not officially supported` und zieht den ubuntu24.04-Build; harmlos, Tests laufen.

— session 2026-08-28 (Test-Review)

```
$ npm run test:shell
 Test Files  1 passed (1)
      Tests  2 passed (2)
exit 0

$ npm run lint     → exit 0
```

**Temporäre Proben — alle entfernt, keine liegt noch im Baum:**

- **Import-Probe (AC-02)**, zuletzt `src/app/toolchain.spec.ts`: importierte `@a2ui/angular`,
  `@a2ui/web_core/v0_9`, `@ag-ui/client` und `@copilotkit/angular` und lief grün in headless
  Chromium — `BASIC_FUNCTIONS.length` = 25,
  `A2uiMessageListWrapperSchema.safeParse({ messages: [] }).success` = true. Sie hat den
  `supports-color`-Konflikt gefunden; die daraus folgende Randbedingung steht dauerhaft als
  Kommentar in `vitest-base.config.ts:5-9`. Datei entfernt.
- **Lint-Negativprobe (AC-05)** und **Produktions-Build-Probe** — oben protokolliert, beide
  seinerzeit zurückgesetzt.

### Acceptance Coverage

- **T1-AC-01** — partial. Belegt ist der Browser-Mode-Teil:
  `src/app/app.spec.ts::T1-AC-01 renders the root component in a real browser` und
  `::T1-AC-01 executes in headless Chromium, not jsdom`; nach dem Review auch nach `npm ci`
  reproduzierbar, der Chromium-Bezug hängt am `postinstall`-Hook statt an einem manuellen Schritt.
  **Lücke:** die vom AC-Text zusätzlich verlangte Pure-Function-Spec existiert nicht. Task 1 bringt
  keine eigene Pure Function mit; die frühere Variante testete `BASIC_FUNCTIONS.add` aus
  `@a2ui/web_core`, also Fremdcode. Dieser Halbsatz des AC schreibt eine Testart vor statt eines
  Ergebnisses — die Ergebnis-Hälfte („`test:shell` läuft grün in headless Chromium") ist voll
  erfüllt.
- **T1-AC-02** — passed über eine **temporäre Import-Probe** (`src/app/toolchain.spec.ts`, nach
  der Verifikation entfernt). Grün in headless Chromium: `@a2ui/angular`, `@a2ui/web_core/v0_9`,
  `@ag-ui/client` und `@copilotkit/angular` lassen sich im Browser-Bundle auflösen und laden
  (`BASIC_FUNCTIONS.length` = 25; `A2uiMessageListWrapperSchema.safeParse({ messages: [] }).success`
  = true). Kein dauerhafter Test: die Probe belegte nur, dass installierte Exporte existieren —
  eine willkürliche Stichprobe im Dependency-Ordner ohne eigene Funktionalität und ohne definierten
  Integrationsvertrag. Die Erkenntnis dahinter (`supports-color`) steht dauerhaft als Kommentar in
  `vitest-base.config.ts`; ab dem ersten echten Consumer sichern dessen Tests die Auflösung
  implizit ab.
- **T1-AC-03** — passed. Pins in `package.json`; `npm ls --depth=0` exit 0 ohne
  `--legacy-peer-deps`. Abweichung CDK `~21.2.14` dokumentiert.
- **T1-AC-04** — passed. `LICENSE` und `README.md` vorhanden; Dev-Server liefert HTTP 200 auf 4200.
- **T1-AC-05** — passed, aber mit dem schwächsten Beleg der fünf. Kein `zone.js` in
  `package.json` und `provideZonelessChangeDetection()` in `app.config.ts` sind statisch prüfbar;
  die Regelaktivierung ist jedoch nur durch eine **weggeworfene** Negativprobe belegt (exit 1 mit
  beiden erwarteten Regel-IDs). Ein dauerhafter Regressionstest fehlt — siehe Open Issues.

### Open Issues

- **Der `supports-color`-Alias hat im Test-Bundle keinen Consumer mehr.** Mit dem Entfernen der
  Import-Probe importiert kein Spec mehr `@copilotkit/angular`. Wird der Alias in
  `vitest-base.config.ts` gelöscht, fällt das erst beim ersten echten CopilotKit-Import auf.
  Der Kommentar dort erklärt den Grund; ein Test dafür lohnt sich erst mit realem Consumer.
- **Produktions-Bundle zieht Node-only-Code von CopilotKit.** Der `supports-color`-Alias wirkt nur
  im Test. Sobald `provideCopilotKit` real in die App kommt, landen `chalk` und
  `@segment/analytics-node`/`node-fetch` im Bundle; chalks Modulcode liest dann `process` und
  `tty.isatty` und dürfte zur Laufzeit brechen. tsconfig-`paths` hilft dort nachweislich nicht.
  Kandidaten: dieselbe Umleitung auf Build-Ebene oder ein **scoped** npm-Override
  (`"@copilotkit/shared": { … }` — global würde `@angular/cli` → `ora` → chalk@5 mittreffen).
  (→ Task 2/7)
- **`uuid`-Alias offen** — in Task 2 messen, ob `@ag-ui/client` ihn tatsächlich braucht. (→ Task 2)
- **Upstream-Defekt in CopilotKit**, unbehoben bis `@copilotkit/shared@1.69.3` (geprüft): serverseitige
  Telemetrie hängt am einzigen Entry Point, ohne `browser`-Feld oder -Condition; dazu ein toter
  `import "chalk"` in `telemetry/utils.mjs`. Ein Upstream-Issue wäre sinnvoll, ist aber nicht
  projektblockierend.
- **Leeres `docs/work/master/`** aus dem Scope-Umzug. Enthält nur ein leeres Verzeichnis, taucht in
  `git status` nicht auf; Löschen wurde vom Permission-Gate abgelehnt. Kosmetisch.
- **Kein Regressionstest für die Lint-Regeln.** Deaktiviert jemand `prefer-signals` oder
  `prefer-on-push-component-change-detection`, fällt das nirgends auf; `npm run lint` belegt nur,
  dass der vorhandene Code sauber ist. Ein dauerhafter Test hieße, ESLint programmatisch gegen ein
  Fixture laufen zu lassen — das geht nicht im Browser-Mode-Target, sondern bräuchte ein zweites
  Node-Target (analog zum `test-node` des Referenzprojekts). Bewusst vertagt, weil der Plan für
  Task 1 keine solche Infrastruktur vorsieht. (→ Folgeaufgabe)
- **Kein Lauf auf Node 24 LTS.** Alles ist auf 25.5 verifiziert. `engines` erlaubt `>=24`, und
  Angulars eigene Range deckt beides — geprüft ist aber nur die eine Version. (→ Folgeaufgabe)

### Context for Next Task

- **Testkette:** Specs laufen über `@angular/build:unit-test` → Vitest → Playwright/Chromium.
  Neue Specs brauchen keine eigene Konfiguration — der Chromium-Bezug hängt am `postinstall`-Hook,
  nicht an einem manuellen Schritt. Wer eine zweite Vitest-Option braucht, erweitert
  `vitest-base.config.ts` — der Builder lässt `resolve` und `optimizeDeps` aus dieser Datei
  **gewinnen** (`plugins.js`: `const { optimizeDeps, resolve } = config`), der Rest wird gemerged.
- **Node-Builtins im Browser:** Wenn ein neuer Import mit `process is not defined`,
  `tty.isatty is not a function` o. Ä. bricht, ist fast immer ein Paket falsch aufgelöst, das einen
  Browser-Build mitbringt. Erst `package.json` des Pakets prüfen (`browser`-Feld vs. `exports`-Map),
  dann gezielt aliasen — nicht stubben.
- **Angular-Versionen:** 21.2.22 ist die Obergrenze, weil `@a2ui/angular@0.10.5` `^21.2.5` peert.
  Angular 22 ist blockiert. NF muss in M2 eine 21.x-kompatible Linie wählen (latest ist 22.1.1).
- **Versions-Duplikat:** `@copilotkit/angular@0.3.1` pinnt `@ag-ui/client|core@0.0.57` als eigene
  Dependencies — drei verschachtelte 0.0.57-Kopien liegen neben unserem Top-Level-0.0.59. Relevant,
  sobald Typen oder `instanceof` über die Grenze gehen.
- **Kein Spec importiert mehr die AI-Bibliotheken.** Nach dem Entfernen der Import-Probe ist der
  `supports-color`-Alias unbenutzt. Der erste Task, der A2UI, CopilotKit oder AG-UI real einbindet,
  ist damit auch der erste, der die Browser-Auflösung wieder belastet — dort mit Auflösungsfehlern
  rechnen und den Kommentar in `vitest-base.config.ts` lesen, bevor daran geschraubt wird.
- **Ports:** Shell 4200 (gesetzt), Agent 3001 (Task 2). `start:agent` fehlt noch in den Scripts.
- **Referenz:** Buch-Beispielcode liegt in `angular-architects/flights42` auf Branch
  **`agentic-angular`** — nicht auf `main` (dort steht ein anderer Stack: Hashbrown/Angular 22).
  Keine Lizenz: lesen ja, kopieren nein.

### Git State

```
$ git diff --stat
(leer — alle Task-1-Dateien sind neu und noch untracked)

$ git status --short
?? .editorconfig
?? .gitignore
?? .prettierrc
?? LICENSE
?? README.md
?? angular.json
?? docs/work/m1-spike/task-log/
?? eslint.config.js
?? package-lock.json
?? package.json
?? public/
?? src/
?? tsconfig.app.json
?? tsconfig.json
?? tsconfig.spec.json
?? vitest-base.config.ts
```

### Sessions

- claude-code 3535ecad-729a-49e9-9105-46cc0afb987b (2026-08-28) — transcript: /home/lutz/.claude/projects/-home-lutz-projects-conference-finder-docs-work-master/3535ecad-729a-49e9-9105-46cc0afb987b.jsonl
- claude-code 11d0828d-753e-47e6-a5a2-7db497f37485 (2026-08-28) — transcript: /home/lutz/.claude/projects/-home-lutz-projects-conference-finder/11d0828d-753e-47e6-a5a2-7db497f37485.jsonl
