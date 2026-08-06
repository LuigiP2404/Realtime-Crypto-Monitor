# Piano di test — Realtime Crypto Monitor

Milestone 10. Unit con **Vitest**, e2e con **Playwright**.
Versione ridotta all'essenziale: ~45 test, non 120.

**Criterio di selezione**: si testa dove c'è logica *tua* — rami condizionali, stato che
evolve, timer, race. Non si testa la delega a una libreria (`Intl`, MUI, lightweight-charts)
né il markup senza logica. Un test su codice senza rami non trova bug, ma lo paghi per
sempre in manutenzione.

**Densità giustificata per zona**:

| Zona | Densità | Perché |
|---|---|---|
| `binanceSocket.ts` | Alta | Stato, timer, riconnessione, cleanup |
| `TradeTape` (throttle) | Alta | Timer + coalescing |
| `SymbolChart` (race intervalli) | Alta | Concorrenza, bug intermittente |
| `errorMessage`, `ApiError` | Media | Puri e pieni di rami, costano poco |
| `format.ts` | Bassa | La logica tua sono i 4 confini, il resto è `Intl` |
| `OrderBook`, `Chart` | Bassa-media | Testa i calcoli, non il markup |

Ordine: 1 → 2 → 3 → 4 → 5.

---

## 0 — Prerequisiti rimanenti

- [x] `vite.config.ts` — `include`: il pattern `*.{test,spec}.tsx?` non matcha né `.ts` né
      `.tsx` (`?` in glob = *un carattere qualsiasi*, non "opzionale": l'opzionale è `?(x)`).
      Va anche ancorato a `src/`, e l'entry `'./test'` (directory inesistente) va tolta.
- [x] `vite.config.ts` — con `include` ancorato a `src/`, l'`exclude` di `e2e` diventa
      superfluo (e `'/e2e'` con lo slash iniziale è comunque un path assoluto, non un glob).
- [ ] Installare `@testing-library/react`, `@testing-library/user-event`,
      `@testing-library/jest-dom` + `setupFiles` che registri i matcher. Con `globals: false`
      l'auto-cleanup di RTL non si aggancia da solo.
- [x] Cancellare `e2e/example.spec.ts` (punta a playwright.dev, in CI colpisce la rete vera).
- [x] Un tsconfig per `e2e/` referenziato dalla root: oggi nessun tsconfig la copre, quindi
      `npm run typecheck` non guarda mai gli spec Playwright.
- [x] `.github/workflows/ci.yml`: `npm run vitest` → lo script si chiama `test`;
      `npm test:e2e` → manca `run`.

**Convenzione scelta**: test unit **colocati** accanto al sorgente
(`src/utils/format.test.ts`), e2e in `e2e/`.

---

## 1 — Unit: utils puri (12 test, zero mock) 

### `src/utils/format.ts`

- [x] `decimalsFor`: tabella dei confini in un solo test parametrizzato — 1, 0.01, valori
      appena sopra/sotto, 0, un negativo (usa `Math.abs`, verificalo)
- [x] `amountDecimalsFor`: stessa tabella sui confini 10000 / 100 / 1
- [x] `formatNumber`: `NaN` → `'—'`, e i `digits` rispettati esattamente (padding di zeri)
- [x] `formatPrice`: `null` / `undefined` / `NaN` → `'—'`
- [x] `formatPrice`: prezzo sub-cent → 8 decimali (verifica che `decimalsFor` sia agganciato)
- [x] `formatPercent`: segno `+` sui positivi, nessun doppio segno sui negativi, sentinella su null

### `src/utils/errorMessage.ts`

- [x] 429 **con** `retryAfter` → usa quel numero
- [x] 429 **senza** `retryAfter` → fallback 60
- [x] 404 → interpola il `subject` passato
- [x] `>= 500` → messaggio "temporarily unavailable"
- [x] Errore non-`ApiError` (`TypeError` di rete) → messaggio generico

### `src/api/errors.ts` — `ApiError.fromResponse`

- [x] Header `retry-after` numerico → valorizzato; assente → `undefined` (un test solo)
- [x] Header in formato data HTTP (`"Wed, 21 Oct 2015 07:28:00 GMT"`) → il test dice se il parsing regge il caso reale. Scrivi l'assert sul comportamento che **vuoi**.

---

## 2 — Unit: layer REST (7 test, `fetch` mockato con `vi.stubGlobal`)

### `fetchKlines` — `src/api/binance.ts`

- [x] URL costruita bene: path `/api/v3/uiKlines`, param `symbol` / `interval` / `limit` (assert sull'argomento passato al mock, non sulla risposta)
- [x] Mapping `RawKline` → `Candle`: `time` diviso 1000 e floor, stringhe → number
- [x] Risposta non-ok → rejects con `ApiError` con lo `status` giusto (un caso basta: il codice ha un solo ramo `else`)

### `fetchSymbols`

- [x] Filtra solo i simboli `USDT` e ritorna un `Set` (metti `USDC` e `USDTUSDT` in fixture come trappole)
- [x] Non-ok → `ApiError`

### `src/api/coingecko.ts`

- [x] `fetchCoins`: check URL, header `x-cg-demo-api-key` presente (con `import.meta.env` stubbato), query encodata, ritorna `json.coins`
- [x] `fetchMarket`: check URL, header `x-cg-demo-api-key` presente (con `import.meta.env` stubbato), query encodata, ritorna `json.crypto`

---

## 3 — Unit: WebSocket (13 test — il cuore della milestone)

**Tecnica**: una classe fake assegnata a `globalThis.WebSocket` che registra le istanze
create, con metodi per far scattare gli eventi a comando, + `vi.useFakeTimers()`.
Firma minima:

```ts
class FakeWS { static instances: FakeWS[] = []; readyState = 0; close = vi.fn();
  emit(data: unknown) { this.onmessage?.({ data: JSON.stringify(data) }); } }
```

Poi `vi.spyOn(Math, 'random')` per rendere deterministico il jitter.

### `connectToSocketKline` — `src/api/binanceSocket.ts`

- [ ] URL sottoscritta: simbolo minuscolo + `@kline_<interval>` (passa `'BTCUSDT'` e `'4h'`)
- [ ] Messaggio kline → `onCandle` col candle mappato (time in secondi, stringhe → number)
- [ ] `onclose` → avanzando i timer viene creato un **nuovo** WebSocket
- [ ] Backoff: asserisci la **proprietà** — il delay cresce fra un retry e il successivo e si
      ferma a 30s. Non replicare la formula riga per riga: un test così si rompe a ogni
      modifica legittima
- [ ] `retryCount` torna a 0 dopo un `onopen` riuscito (chiudi → riconnetti → apri → richiudi:
      il delay deve essere di nuovo il minimo). È il test che dice se il reset è nel posto giusto
- [ ] Watchdog: nessun messaggio per > 15s con `readyState === 1` → `close()` → riconnessione
- [ ] Watchdog **non** chiude se i messaggi arrivano regolarmente (avanza 60s con un
      messaggio ogni 5s)
- [ ] Cleanup: dopo il teardown, avanzare i timer non crea nuovi socket **e** il watchdog è
      fermo (avanza 60s → zero chiamate a `close`)
- [ ] Cleanup mentre un retry è già schedulato → nessun socket creato dopo
- [ ] Messaggio con JSON malformato → oggi l'handler lancia dentro l'event handler. Scrivi il
      test che descrive il comportamento **voluto**, poi decidi se adeguare il codice

### `connectToSocketTrade`

- [ ] Topic `@trade` + mapping (`T` resta in ms, `m` → `marketMaker`, `p`/`q` → number)
- [ ] Soglia watchdog 360s: a 20s di silenzio **non** deve chiudere

### `connectToSocketBookOrder`

- [ ] Topic `@depth20` + mapping (`lastUpdateId` preservato, bids/asks → number)

> Le tre funzioni sono copia-incolla con 3 parametri diversi: backoff e cleanup li testi a
> fondo **solo** sulla kline. Se ti secca non coprire le altre due allo stesso modo, è il test
> che ti sta dicendo qualcosa sul design — è un segnale, non un obbligo a rifattorizzare ora.

---

## 4 — Unit: componenti (10 test, Testing Library)

### `TradeTape` — logica di throttle

- [ ] Un trade compare nella colonna giusta **solo dopo** 400ms (verifica anche lo stato
      intermedio: prima dello scadere non c'è nulla)
- [ ] Burst di 10 trade nella stessa finestra → **una sola** riga, ed è l'**ultima** ricevuta
- [ ] Le due colonne sono throttlate in modo indipendente (buy e sell nella stessa finestra →
      compaiono entrambe)
- [ ] Cap `MAX_RESULTS`: oltre 50 trade → 50 righe, la più recente in cima
- [ ] Unmount con timeout pendente → nessun errore

### `OrderBook`

- [ ] `toRows`: cumulativo `total` ([1,2,3] → [1,3,6]) e `depth` proporzionale con l'ultima
      riga al 100%; quantità tutte a 0 → nessuna divisione per zero
- [ ] Percentuali di imbalance: sommano **sempre** a 100 (prova valori tipo 33.3/66.7 che
      darebbero 101 con due arrotondamenti indipendenti)
- [ ] Gli ask sono renderizzati **invertiti**, best ask adiacente allo spread: assert
      sull'ordine nel DOM

### `Chart` (con `vi.mock('lightweight-charts')`, jsdom non ha canvas)

- [ ] `createChart` una volta sola al mount; `setData` quando cambiano le `candles`;
      `update` con `lastCandle`
- [ ] Unmount → `chart.remove()` chiamato (test anti-leak)

### `SymbolChart` (`vi.mock` su `../../api/binance` e `../../api/binanceSocket`)

- [ ] **Race sul cambio intervallo**: 1m → 5m → 1h con la prima fetch che risolve per ultima
      → sul grafico finiscono le candele di 1h. È il test più importante di tutto il gruppo
- [ ] Cambio intervallo: il kline socket viene riaperto sul nuovo topic, il trade/book socket
      **no** (dipende solo da `symbol`)
- [ ] Unmount → tutte e tre le disconnect chiamate

---

## 5 — E2E Playwright (6 test)

**Prerequisito per tutti**: niente rete vera. `page.route()` per `api.binance.com` e
`api.coingecko.com`, `page.routeWebSocket()` per `wss://stream.binance.com/**` — API diversa
da `page.route`: https://playwright.dev/docs/mock-browser-apis#mock-websockets
Fixture condivise in `e2e/fixtures/` + `test.beforeEach` che installa gli stub.

- [ ] **Smoke**: la home carica, empty state visibile
- [ ] **Ricerca → grafico**: digita "bit", seleziona Bitcoin → compare la card con nome e
      rank, e il container del chart perde la classe `hidden`
- [ ] **Prezzo live + trade tape**: manda frame `@trade` con `m` alternato → il prezzo in
      header si aggiorna con classe `is-buy`/`is-sell`, e le righe finiscono nella colonna giusta
- [ ] **Order book**: frame `@depth20` → 20 righe per lato, spread visibile, imbalance a 100
- [ ] **Cambio intervallo**: click su `4h` → la richiesta REST ha `interval=4h` e viene aperta
      una nuova connessione WS sul topic `@kline_4h`
- [ ] **Errore REST**: klines risponde 429 con `retry-after` → compare il messaggio
      "Too many requests… X seconds"

---

## Opzionali (se avanza tempo, non prima)

- Riconnessione e2e: chiudi il socket lato mock → l'app riapre e l'UI resta viva. Alto valore
  dimostrativo per il portfolio, costo medio.
- `Autocomplete`: debounce 500ms, soglia 3 caratteri, filtro su `symbolsList`. MUI è pesante
  da testare, rendimento basso.
- `IntervalPicker`: `aria-pressed` sull'attivo, `disabled` blocca il click.
- `useAlert` fuori dal provider → lancia.
- Cleanup e2e: cambiando crypto i socket della precedente vengono chiusi.
- Nessun errore in console durante il flusso principale (`page.on('pageerror')`).
