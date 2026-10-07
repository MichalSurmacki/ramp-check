# RampCheck

## 1. Cel aplikacji

Stworzyć prostą, mobile-first aplikację webową, która odpowiada na pytanie:

> **Czy mój samochód zjedzie z tej rampy bez przytarcia podwoziem?**

Użytkownik podaje parametry samochodu i rampy, a aplikacja:

1. wykonuje obliczenia geometryczne,
2. pokazuje animację samochodu zjeżdżającego z rampy,
3. wskazuje najniższy punkt podwozia,
4. określa wynik:

   * SUCCESS — bezpieczny margines,
   * WARNING — samochód przejedzie, ale margines jest mniejszy od wymaganego,
   * ERROR — dochodzi do kolizji,
5. w przypadku WARNING lub ERROR pokazuje dodatkowo:

   > **„Ta rampa byłaby przejezdna, gdyby zeszlifować czubek o X cm.”**
6. pokazuje wizualizację zmodyfikowanej rampy (BEFORE / AFTER czubka).

---

# 2. Ważne założenie modelu

Aplikacja nie jest symulatorem konkretnego samochodu.

Jest to **dwuwymiarowy model geometryczny** samochodu i rampy.

Użytkownik sam określa:

* rozstaw osi,
* prześwit,
* pozycję najniższego punktu podwozia.

Najniższy punkt podwozia jest przedstawiony na wizualizacji jako punkt.

Przykład:

```
              🚗
       _________
      /         \
     O     ●     O
           ↑
    najniższy punkt
           │
           │ prześwit
           │
```

────────────────────────

Punkt `●` może znajdować się bliżej przedniej osi, środka albo tylnej osi.

---

# 3. Parametry wejściowe

## 3.1. Kąt rampy

Pole:

```text
Kąt rampy
[ 15 ] °
```

Zakres MVP:

```text
0.1° – 45°
```

Domyślna wartość:

```text
15°
```

---

## 3.2. Prześwit

Pole:

```text
Prześwit
[ 12 ] cm
```

Definicja:

> Odległość od podłoża do najniższego punktu podwozia.

Nie chodzi o katalogowy prześwit samochodu, jeżeli najniższy punkt znajduje się wyżej lub niżej.

Tooltip / helper text:

> Zmierz odległość od podłoża do najniższego elementu podwozia.

---

## 3.3. Rozstaw osi

Pole:

```text
Rozstaw osi
[ 270 ] cm
```

Definicja:

> Odległość pomiędzy środkiem przedniej i tylnej osi.

---

## 3.4. Pozycja najniższego punktu

To jest nowy i bardzo ważny element.

Użytkownik nie musi wpisywać liczby.

Powinien **przeciągnąć punkt na wizualizacji samochodu**.

Przykład:

```text
        PRZÓD
          ↓

        O──────────●────O
        ↑               ↑
      przednia        tylna
        oś              oś
```

Aplikacja zapisuje pozycję jako wartość z zakresu:

```text
0 = przednia oś
1 = tylna oś
```

lub wygodniej:

```text
0% – 100%
```

Przykład:

```text
lowestPointPosition = 0.55
```

oznacza, że najniższy punkt znajduje się 55% drogi od przedniej osi do tylnej.

W UI:

```text
Najniższy punkt podwozia

← przeciągnij ● →

O────────●───────O
```

Pod spodem można pokazywać:

```text
Pozycja: 55%
```

Nie należy wymagać od użytkownika dokładnego pomiaru tej wartości.

Interakcja drag & drop ma być głównym sposobem ustawienia punktu.

**Implementacja:** przeciąganie `●` odbywa się **w Pixi.js** (eventy pointer na tym samym canvasie co wizualizacja samochodu), nie w osobnym HTML/SVG sliderze.

Dodatkowo:

* klawiatura (strzałki) obsługiwana w scenie Pixi,
* wartość synchronizowana ze stanem React (`lowestPointPosition`),
* dla screen readerów: ukryty HTML `input[type=range]` / live region zsynchronizowany ze sceną (canvas sam nie jest w pełni dostępny).

---

# 4. Próg akceptacji

Pole:

```text
Minimalny margines
[ 5 ] cm
```

Domyślnie:

```text
5 cm
```

Definicja:

> Użytkownik określa, ile wolnej przestrzeni chce zachować pomiędzy najniższym punktem samochodu a rampą.

---

# 5. Jednostki

MVP:

```text
kąt        ° 
długości   cm
```

Nie dodawać na początku:

* metrów,
* cali,
* mm.

Można dodać później.

---

# 6. Główny ekran

Mobile first.

Układ:

```text
┌────────────────────────────┐
│                            │
│        🚗 RampCheck        │
│                            │
│  Czy Twoje auto zjedzie    │
│  z rampy bez przytarcia?   │
│                            │
├────────────────────────────┤
│                            │
│ Kąt rampy                  │
│ [ 15                 ] °   │
│                            │
│ Prześwit                   │
│ [ 12                 ] cm  │
│                            │
│ Rozstaw osi                │
│ [ 270                ] cm  │
│                            │
│ Minimalny margines         │
│ [ 5                  ] cm  │
│                            │
├────────────────────────────┤
│                            │
│ Najniższy punkt podwozia   │
│                            │
│       O────●──────O        │
│            ↑               │
│       przeciągnij         │
│                            │
├────────────────────────────┤
│                            │
│      [ SPRAWDŹ ]           │
│                            │
└────────────────────────────┘
```

---

# 7. Wizualizacja samochodu

Nie używać emoji jako głównej grafiki.

Wszystkie wizualizacje i animacje sceny (samochód, rampa, zjazd, wskaźnik prześwitu, BEFORE/AFTER) realizować w **Pixi.js** (canvas 2D).

Samochód powinien być abstrakcyjnym, prostym symbolem:

```text
             _____________
        ____/             \____
       /                       \
      O                         O
```

Elementy:

* body,
* przednie koło,
* tylne koło,
* linia osi,
* punkt najniższego prześwitu.

Punkt najniższego prześwitu:

```text
●
```

powinien być interaktywny.

---

# 8. Rampa

Rampa również rysowana w Pixi.js (ta sama scena co samochód).

Przykład:

```text
────────────────────────────
                            \
                             \
                              \
                               \
                                \
```

Kąt musi być wizualnie zgodny z wartością podaną przez użytkownika.

Jeżeli użytkownik wpisze:

```text
15°
```

rampa powinna być obrócona o 15° względem poziomu.

---

# 9. Animacja

Po kliknięciu:

```text
SPRAWDŹ
```

animacja przechodzi przez 4 stany:

```text
IDLE
  ↓
APPROACH
  ↓
CRITICAL_POINT
  ↓
RESULT
```

## IDLE

Samochód stoi przed rampą.

## APPROACH

Samochód zaczyna zjeżdżać.

Jego:

* pozycja,
* rotacja,
* koła

są animowane.

## CRITICAL_POINT

Animacja zatrzymuje się w momencie minimalnego prześwitu.

Pokazujemy linię:

```text
        ●
        │
        │  3.2 cm
        │
────────┴────── ramp
```

## RESULT

Pokazujemy wynik.

---

# 10. Stany wyniku

## SUCCESS

Warunek:

```text
minimumClearance >= safetyMargin
```

Przykład:

```text
minimumClearance = 8 cm
safetyMargin = 5 cm
```

Wynik:

```text
✓ BEZPIECZNY ZJAZD

Minimalny prześwit: 8 cm
Wymagany margines: 5 cm
Zapas: 3 cm
```

Kolorystyka:

```text
success
```

---

# 11. WARNING

Warunek:

```text
0 <= minimumClearance < safetyMargin
```

Przykład:

```text
minimumClearance = 3 cm
safetyMargin = 5 cm
```

Wynik:

```text
! UWAGA

Samochód powinien przejechać,
ale margines jest mniejszy
od ustawionego minimum.

Minimalny prześwit: 3 cm
Wymagany margines: 5 cm
```

Następnie pokazujemy feature:

```text
────────────────────────────

JAK POPRAWIĆ RAMPĘ?

Zeszlifowanie czubka o:
        2 cm

pozwoli zachować wymagany
margines 5 cm.

[ POKAŻ ZMODYFIKOWANĄ RAMPĘ ]

────────────────────────────
```

---

# 12. ERROR

Warunek:

```text
minimumClearance < 0
```

Przykład:

```text
minimumClearance = -2 cm
```

Wynik:

```text
× PODWOZIE UDERZY W RAMPĘ

Brakuje około 2 cm prześwitu.
```

Następnie:

```text
JAK POPRAWIĆ RAMPĘ?

Zeszlifowanie czubka o:

        7 cm

pozwoliłoby uzyskać wymagany
margines 5 cm.

[ POKAŻ ZMODYFIKOWANĄ RAMPĘ ]
```

---

# 13. Feature: „Zeszlifuj rampę”

To jest osobna funkcjonalność aplikacji.

Nazwa UI:

> **Jak poprawić rampę?**

lub:

> **Ile zeszlifować z czubka?**

Aplikacja oblicza minimalną zmianę geometrii rampy potrzebną do osiągnięcia:

```text
minimumClearance >= safetyMargin
```

---

# 14. Definicja „zeszlifowania czubka rampy”

Dla jasności użytkownika należy przyjąć jedną konkretną definicję.

W MVP:

> **„Zeszlifowanie czubka”** oznacza lokalne ścięcie **samego narożnika / wierzchołka** rampy o `X` cm (pionowo).
> **Nie** skracamy ani nie obniżamy całej skarpy.
> **Nie** zmieniamy kąta głównej części rampy.
> Zmiana dotyczy wyłącznie czubka.

Geometrycznie (2D):

```text
ORYGINAŁ (ostry czubek)          PO ZESZLIFOWANIU CZUBKA

         /                              -/_
        /                              /
       /                              /
______/                          ____/
```

Albo w formie użytkownika:

```text
   -/_
  /
 /
_
```

Gdzie:

* `_` na dole — poziom / początek,
* `/` — główna skarpa (kąt **bez zmian**),
* `-/_` — **tylko czubek** zeszlifowany (lokalna fazka / ścięcie narożnika).

Wymiar pokazywany użytkownikowi:

```text
        ↓ X cm   (pionowa wysokość usunięta z samego czubka)
```

Wizualizacja BEFORE / AFTER musi pokazywać:

* ostry czubek vs lokalnie ścięty czubek,
* że reszta rampy wygląda tak samo,
* wymiar `X cm` przy czubku.

**Nie** pokazywać „nowego kąta rampy” ani „niższej całej rampy” jako wyniku — wynik to wyłącznie `tipGrindCm`.

---

# 15. Bardzo ważne: nie używać prostego wzoru do „zeszlifowania”

Feature „ile zeszlifować” powinien korzystać z tego samego **silnika geometrycznego**, co główny kalkulator.

Nie robić:

```text
grindAmount = random/simple formula
```

Zamiast tego:

```text
findMinimumTipGrind()
```

powinno szukać najmniejszego `tipGrindCm`, dla którego:

```text
calculateClearance(rampWithTipGrind) >= safetyMargin
```

---

# 16. Algorytm szukania wymaganego zeszlifowania czubka

Najprościej użyć binary search po `tipGrindCm`.

Przykład:

```text
minimum tipGrind = 0 cm
maximum tipGrind = 100 cm
```

Algorytm:

```text
1. Sprawdź rampę bez zmian (tipGrindCm = 0).

2. Jeżeli samochód już spełnia wymagany margines:
   tipGrindCm = 0

3. Jeżeli nie:
   sprawdź tipGrindCm = 50 cm.

4. Jeżeli 50 cm wystarcza:
   szukaj pomiędzy 0 a 50.

5. Jeżeli nie wystarcza:
   szukaj pomiędzy 50 a 100.

6. Powtarzaj aż dokładność wyniesie np. 0.1 cm.
```

Dzięki temu można otrzymać:

```text
minimumRequiredTipGrindCm = 4.7
```

i wyświetlić:

> **Zeszlifuj czubek rampy o około 4,7 cm.**

---

# 17. Wynik feature'u

Silnik powinien zwracać:

```ts
type RampModification = {
  possible: boolean

  /** Pionowa wysokość usunięta z czubka rampy [cm] */
  tipGrindCm: number

  /** Kąt skarpy — bez zmian po zeszlifowaniu czubka */
  angleDeg: number

  originalClearanceCm: number
  modifiedClearanceCm: number
}
```

Przykład:

```ts
{
  possible: true,
  tipGrindCm: 4.7,
  angleDeg: 17,
  originalClearanceCm: 2.8,
  modifiedClearanceCm: 5.0
}
```

---

# 18. Wizualizacja zmodyfikowanej rampy

Po kliknięciu:

```text
POKAŻ ZMODYFIKOWANĄ RAMPĘ
```

należy pokazać animację lokalnego zeszlifowania **czubka** (reszta skarpy bez zmian).

Najpierw:

```text
ORIGINAL

           🚗
          /
         /
        /
_______/
```

Następnie wizualnie szlifujemy tylko czubek:

```text
           🚗
          /
         /
        /
_______/
```

↓

```text
           🚗
         -/_
        /
       /
______/
```

↓

```text
MODIFIED

          🚗
         -/_
        /
       /
______/
```

Pod rampą:

```text
Zeszlifowanie czubka: 4.7 cm
Kąt skarpy: 17° (bez zmian)
```

---

# 19. Dwa sposoby prezentacji zmiany

Na mobile najlepiej użyć przełącznika:

```text
[ Oryginalna ] [ Po poprawie ]
```

albo:

```text
BEFORE  →  AFTER
```

W trybie BEFORE:

```text
ostry czubek · 17°
```

W trybie AFTER:

```text
czubek −4.7 cm · 17°
   -/_
```

---

# 20. Komunikat dotyczący „szlifowania”

Nie używać sformułowania sugerującego gwarantowany fizyczny rezultat.

Zamiast:

> Zeszlifuj 4,7 cm i na pewno przejedziesz.

używać:

> Według modelu geometrycznego zeszlifowanie czubka rampy o około 4,7 cm pozwoli uzyskać wymagany margines 5 cm.

---

# 21. Model matematyczny

Należy stworzyć osobny moduł:

```text
lib/geometry/
```

Struktura:

```text
lib/
└── geometry/
    ├── calculator.ts
    ├── vehicle.ts
    ├── ramp.ts
    ├── collision.ts
    └── rampModification.ts
```

---

# 22. Dane samochodu

```ts
export type VehicleGeometry = {
  wheelbaseCm: number
  clearanceCm: number

  /**
   * 0 = front axle
   * 1 = rear axle
   */
  lowestPointPosition: number
}
```

---

# 23. Dane rampy

```ts
export type RampGeometry = {
  angleDeg: number

  /**
   * Pionowa wysokość usunięta z czubka rampy [cm].
   * 0 = rampa bez modyfikacji (domyślnie).
   */
  tipGrindCm?: number
}
```

---

# 24. Dane kalkulatora

```ts
export type CalculatorInput = {
  vehicle: VehicleGeometry
  ramp: RampGeometry
  safetyMarginCm: number
}
```

---

# 25. Wynik kalkulatora

```ts
export type CalculationStatus =
  | "success"
  | "warning"
  | "error"

export type CalculationResult = {
  status: CalculationStatus

  minimumClearanceCm: number

  safetyMarginCm: number

  marginDifferenceCm: number

  criticalAngleDeg: number

  collision: boolean
}
```

---

# 26. Główna funkcja

```ts
calculateRampClearance(input: CalculatorInput): CalculationResult
```

Nie może zależeć od Reacta.

Nie może zależeć od DOM.

Nie może zależeć od Pixi.js / canvas.

Powinna być czystą funkcją.

---

# 27. Funkcja modyfikacji rampy

```ts
calculateRampModification(
  input: CalculatorInput
): RampModification
```

Algorytm:

```text
original result
      ↓
czy minimumClearance >= safetyMargin?
      ↓
    TAK
      ↓
tipGrindCm = 0

    NIE
      ↓
binary search po tipGrindCm
      ↓
minimum tip grind
```

---

# 28. Ważne ograniczenie modelu

Model powinien być opisany w aplikacji.

Na dole:

> Kalkulator wykonuje uproszczoną analizę geometryczną w 2D. Rzeczywisty przejazd może zależeć m.in. od pracy zawieszenia, ugięcia opon, kształtu podwozia, obciążenia samochodu oraz rzeczywistego profilu rampy.

To zabezpiecza UX przed traktowaniem wyniku jako gwarancji.

---

# 29. Walidacja danych

## Kąt

```ts
0 < angle <= 45
```

## Prześwit

```ts
0 < clearance <= 100
```

## Rozstaw osi

```ts
100 <= wheelbase <= 500
```

## Pozycja najniższego punktu

```ts
0 <= lowestPointPosition <= 1
```

## Margines

```ts
0 <= safetyMargin <= 50
```

---

# 30. Domyślne wartości

```ts
const DEFAULT_VALUES = {
  rampAngleDeg: 15,
  clearanceCm: 12,
  wheelbaseCm: 270,
  safetyMarginCm: 5,
  lowestPointPosition: 0.5
}
```

---

# 31. UX formularza

Inputy powinny mieć:

* duży touch target,
* `inputMode="decimal"`,
* odpowiedni keyboard na telefonie,
* jednostkę po prawej,
* natychmiastową walidację.

Przykład:

```text
┌────────────────────────────┐
│ Kąt rampy                  │
│ ┌──────────────────────┐   │
│ │ 15                   │ ° │
│ └──────────────────────┘   │
└────────────────────────────┘
```

---

# 32. Główny CTA

Przycisk:

```text
SPRAWDŹ AUTO
```

Nie:

```text
Calculate
```

Ani:

```text
Submit
```

---

# 33. Wynik powinien być bardzo czytelny

Na telefonie użytkownik powinien po jednym spojrzeniu wiedzieć:

```text
┌────────────────────────────┐
│                            │
│           ✓                │
│                            │
│      SAMOCHÓD PRZEJEDZIE   │
│                            │
│       Margines 8 cm        │
│                            │
└────────────────────────────┘
```

lub:

```text
┌────────────────────────────┐
│                            │
│           !                │
│                            │
│          UWAGA             │
│                            │
│       Margines 3 cm        │
│                            │
└────────────────────────────┘
```

lub:

```text
┌────────────────────────────┐
│                            │
│           ×                │
│                            │
│     PODWOZIE UDERZY        │
│                            │
│        -2 cm               │
│                            │
└────────────────────────────┘
```

---

# 34. Kolory

Używać semantycznych kolorów:

SUCCESS:

```text
green
```

WARNING:

```text
amber/orange
```

ERROR:

```text
red
```

Neutralne UI:

```text
white
gray
black
```

Nie uzależniać informacji wyłącznie od koloru.

Każdy stan musi mieć również:

* ikonę,
* tekst,
* wartość liczbową.

---

# 35. Animacje

Scena symulacji (samochód, rampa, zjazd, prześwit, BEFORE → AFTER) — **Pixi.js** (Ticker / własne tweeny).

UI poza sceną (pojawianie wyniku, karty, przełączniki) — CSS transitions lub proste animacje CSS. Nie dodawać Framer Motion, jeżeli CSS wystarczy.

Animować w Pixi:

* samochód,
* obrót samochodu,
* pozycję samochodu,
* rampę,
* linię prześwitu,
* zmianę rampy BEFORE → AFTER.

Nie przesadzać z animacjami.

Aplikacja ma być narzędziem, nie grą.

---

# 36. Accessibility

Wymagane:

* klawiatura (także dla drag punktu w Pixi — strzałki),
* focus states w formularzu,
* odpowiedni kontrast,
* możliwość ustawienia pozycji najniższego punktu bez myszy / touch.

Ponieważ punkt żyje w **canvas Pixi**, natywne `role="slider"` na graphics nie wystarczy. Wzorzec MVP:

1. interakcja pointer + klawiatura w Pixi,
2. zsynchronizowany, wizualnie ukryty HTML kontroler:

```text
<input type="range" min="0" max="100" aria-valuenow="55"
       aria-label="…" />
```

albo `aria-live` region z aktualną pozycją (%),

3. etykiety i komunikaty wyników z i18n (PL/EN).

---

# 37. Responsive layout

## Mobile

Jedna kolumna:

```text
formularz
↓
wizualizacja
↓
wynik
↓
rampa modification
```

## Tablet/Desktop

Dwie kolumny:

```text
┌──────────────────┬──────────────────────┐
│                  │                      │
│    FORMULARZ     │    WIZUALIZACJA      │
│                  │                      │
│                  │       🚗             │
│                  │        \             │
│                  │         \____        │
│                  │                      │
└──────────────────┴──────────────────────┘

             ↓

             WYNIK
```

---

# 38. Struktura Next.js (App Router) + Yarn Berry

Package manager:

```text
Yarn Berry (Yarn 4.x)
```

Pliki:

```text
package.json
.yarnrc.yml
yarn.lock
.yarn/releases/…   # binary Yarn (commitowany)
```

Komendy:

```text
yarn install
yarn dev
yarn build
yarn test
```

i18n (PL + EN), rekomendacja: `next-intl` + App Router locale segments:

```text
 /            → redirect do domyślnego języka (pl)
 /pl/…
 /en/…
```

Struktura:

```text
app/
├── [locale]/
│   ├── layout.tsx
│   └── page.tsx
├── globals.css
│
├── components/
│   ├── Header.tsx
│   ├── LanguageSwitcher.tsx
│   ├── CalculatorForm.tsx
│   ├── SimulationCanvas.tsx      # React wrapper (client) nad Pixi Application
│   ├── ResultCard.tsx
│   ├── RampModification.tsx
│   └── Disclaimer.tsx
│
├── messages/
│   ├── pl.json
│   └── en.json
│
├── lib/
│   ├── geometry/
│   │   ├── calculator.ts
│   │   ├── vehicle.ts
│   │   ├── ramp.ts
│   │   ├── collision.ts
│   │   └── rampModification.ts
│   ├── i18n/
│   │   ├── routing.ts
│   │   └── request.ts
│   └── pixi/
│       ├── createApp.ts           # init Pixi Application v8
│       ├── vehicleGraphics.ts     # rysowanie + drag ●
│       ├── rampGraphics.ts        # rampa + czubek (oryginalny / zeszlifowany)
│       ├── clearanceGraphics.ts
│       └── simulationController.ts
│
├── types/
│   └── geometry.ts
│
└── tests/
    ├── calculator.test.ts
    └── rampModification.test.ts
```

Uwagi Next.js + Pixi v8:

* komponenty sceny muszą być Client Components (`'use client'`),
* Pixi init tylko w przeglądarce (np. `useEffect` / dynamic import z `ssr: false`),
* po unmount: destroy Application i zwolnić canvas / tickery,
* drag najniższego punktu wyłącznie w Pixi (`eventMode` / pointer events).

---

# 39. State management

Nie potrzeba Redux.

Wystarczy:

```text
React useState
```

Stan:

```ts
type CalculatorState = {
  rampAngleDeg: number
  clearanceCm: number
  wheelbaseCm: number
  safetyMarginCm: number
  lowestPointPosition: number
}
```

---

# 40. Flow aplikacji

```text
USER OTWIERA STRONĘ
        ↓
DOMYŚLNE WARTOŚCI
        ↓
USTAWIA PARAMETRY
        ↓
PRZESUWA NAJNIŻSZY PUNKT
        ↓
KLIK "SPRAWDŹ"
        ↓
CALCULATE
        ↓
ANIMACJA
        ↓
MINIMUM CLEARANCE
        ↓
┌───────────────┬───────────────┬──────────────┐
│               │               │              │
SUCCESS        WARNING         ERROR
│               │               │              │
↓               ↓               ↓              │
wynik           wynik           wynik           │
                │               │              │
                └───────┬───────┘              │
                        ↓
               RAMP MODIFICATION
                        ↓
              "ZESZLIFUJ CZUBEK O X CM"
                        ↓
                 BEFORE / AFTER
```

---

# 41. Przykład UX końcowego

Użytkownik wpisuje:

```text
Kąt rampy:             17°
Prześwit:              12 cm
Rozstaw osi:           270 cm
Margines:               5 cm
```

Ustawia punkt:

```text
najniższy punkt: 55%
```

Klik:

```text
SPRAWDŹ AUTO
```

Animacja.

Wynik:

```text
⚠️ UWAGA

Samochód przejedzie,
ale minimalny prześwit wynosi:

3.1 cm

Wymagany margines:

5 cm
```

Następnie:

```text
💡 JAK POPRAWIĆ RAMPĘ?

Zeszlifowanie czubka o:

4.2 cm

pozwoli uzyskać wymagany
margines 5 cm.

[ POKAŻ ]
```

Po kliknięciu:

```text
PRZED

        🚗
       ╱
      ╱
_____/


PO

       🚗
      -/_
     /
____/
```

```text
Kąt skarpy: 17° (bez zmian)

Zeszlifowanie czubka: 4.2 cm
Minimalny prześwit: 5.0 cm
```

---

# 42. Edge cases

Obsłużyć:

### Bardzo mały samochód

```text
clearance = 2 cm
```

### Bardzo duży prześwit

```text
clearance = 50 cm
```

### Punkt przy samej osi

```text
position = 0
position = 1
```

### Punkt dokładnie w środku

```text
position = 0.5
```

### Próg = 0

Wtedy:

```text
minimumClearance >= 0
```

jest SUCCESS.

### Dokładnie na granicy

```text
minimumClearance = safetyMargin
```

→ SUCCESS.

### Kolizja

```text
minimumClearance < 0
```

→ ERROR.

---

# 43. Testy jednostkowe

Obowiązkowo przetestować:

```text
1. success z dużym marginesem
2. success dokładnie na granicy
3. warning
4. error
5. pozycję punktu 0%
6. pozycję punktu 50%
7. pozycję punktu 100%
8. próg 0 cm
9. bardzo mały kąt
10. duży kąt
11. brak wymaganej modyfikacji rampy
12. wymagana modyfikacja rampy
13. binary search dla modification
```

---

# 44. Performance

Aplikacja jest całkowicie client-side.

Nie ma:

* API,
* bazy,
* użytkowników,
* logowania,
* cookies wymaganych do działania,
* backendowej kalkulacji.

Wszystkie obliczenia:

```text
browser
```

---

# 45. SEO + i18n

Języki:

```text
pl  (domyślny)
en
```

Metadata (per locale):

```text
pl title:
RampCheck — sprawdź, czy auto przejedzie przez rampę

en title:
RampCheck — check if your car will clear the ramp

pl description:
Sprawdź geometrycznie, czy samochód zjedzie z rampy bez
przytarcia podwoziem. Podaj kąt rampy, prześwit i rozstaw osi.

en description:
Check geometrically whether your car can descend a ramp
without scraping. Enter ramp angle, clearance and wheelbase.
```

Hreflang / alternates dla `/pl` i `/en`.

H1 (PL):

> Czy Twoje auto przejedzie przez rampę?

Sekcje informacyjne również tłumaczone (jak działa kalkulator, prześwit, zeszlifowanie czubka).

---

# 46. Disclaimer

Na dole:

> **Uwaga:** Wynik jest uproszczoną analizą geometryczną. Rzeczywisty przejazd może zależeć od zawieszenia, obciążenia samochodu, opon, kształtu podwozia, nierówności oraz rzeczywistego profilu rampy. Wynik nie stanowi gwarancji bezpiecznego przejazdu.

---

# 47. Vercel

Deployment:

```text
GitHub
   ↓
Vercel
   ↓
RampCheck
```

Nie potrzebujemy:

```text
database
server
environment variables
API keys
authentication
```

MVP powinno być możliwe do wdrożenia na darmowym planie Vercel.

---

# 48. Technologie

```text
Next.js (App Router)
TypeScript
React
Tailwind CSS
Pixi.js v8       # wizualizacje, animacje sceny, drag punktu
next-intl        # i18n PL + EN
Yarn Berry 4.x   # package manager
Vitest
Vercel
```

Nie dodawać:

```text
Redux
Prisma
PostgreSQL
Supabase
Firebase
Auth.js
Express
API routes
Framer Motion    # chyba że CSS nie wystarczy do UI poza sceną
```

jeżeli nie pojawi się później konkretna potrzeba.

---

# 49. Zasada architektoniczna

Najważniejsza rzecz:

**Matematyka nie może być zaszyta w komponentach UI.**

Źle:

```text
CalculatorForm.tsx
  └── obliczenia geometryczne
```

Dobrze:

```text
CalculatorForm
      ↓
calculateRampClearance()
      ↓
CalculationResult
      ↓
ResultCard
```

oraz:

```text
calculateRampModification()
      ↓
RampModification
      ↓
RampModification.tsx
```

Dzięki temu później można zmienić model fizyczny bez przebudowy całego UI.

---

# 50. Kolejność implementacji

## Sprint 1 — Geometry engine

Najpierw:

```text
types
calculator
collision
rampModification
tests
```

Bez UI.

Celem jest uzyskanie poprawnych wyników dla znanych przypadków.

---

## Sprint 2 — UI + i18n

Implementacja:

```text
CalculatorForm
SimulationCanvas (statyczna scena Pixi v8: auto + rampa + drag ●)
ResultCard
next-intl (pl / en) + LanguageSwitcher
```

---

## Sprint 3 — Animation

Implementacja:

```text
simulationController (Pixi)
```

Stany:

```text
idle
approach
critical
result
```

---

## Sprint 4 — Ramp modification

Implementacja:

```text
RampModification
```

Animacja:

```text
BEFORE → AFTER (zeszlifowanie czubka)
```

---

## Sprint 5 — Mobile UX

Testy na:

```text
iPhone
Android
tablet
desktop
```

Szczególnie:

* drag punktu,
* inputy numeryczne,
* scroll podczas animacji,
* wielkość przycisków.

---

## Sprint 6 — Polish

Dodać:

* mikroanimacje,
* loading state,
* error state,
* accessibility,
* SEO,
* favicon,
* Open Graph,
* disclaimer.

---

# 51. Definition of Done

MVP jest gotowe, kiedy:

* [ ] użytkownik może wpisać kąt rampy,
* [ ] użytkownik może wpisać prześwit,
* [ ] użytkownik może wpisać rozstaw osi,
* [ ] użytkownik może zmienić próg akceptacji,
* [ ] użytkownik może przeciągnąć najniższy punkt podwozia w Pixi,
* [ ] samochód jest pokazany w Pixi.js v8,
* [ ] rampa jest pokazana w Pixi.js v8,
* [ ] samochód animuje zjazd (Pixi),
* [ ] aplikacja oblicza minimalny prześwit,
* [ ] aplikacja pokazuje SUCCESS,
* [ ] aplikacja pokazuje WARNING,
* [ ] aplikacja pokazuje ERROR,
* [ ] aplikacja oblicza wymagane zeszlifowanie czubka (`tipGrindCm`),
* [ ] aplikacja pokazuje wartość X cm,
* [ ] aplikacja pokazuje rampę BEFORE (ostry czubek),
* [ ] aplikacja pokazuje rampę AFTER (zeszlifowany czubek),
* [ ] aplikacja nie sugeruje zmiany kąta skarpy jako wyniku poprawy,
* [ ] UI dostępne w PL i EN,
* [ ] aplikacja działa bez backendu,
* [ ] aplikacja działa na telefonie,
* [ ] testy geometryczne przechodzą,
* [ ] aplikacja jest wdrożona na Vercel,
* [ ] zależności zarządzane przez Yarn Berry.

---

# 52. Najważniejsza decyzja projektowa

W całej aplikacji należy rozdzielić trzy pojęcia:

### 1. Fizyczna kolizja

```text
minimumClearance < 0
```

→ ERROR

### 2. Przejazd z małym marginesem

```text
0 <= minimumClearance < safetyMargin
```

→ WARNING

### 3. Przejazd z wymaganym marginesem

```text
minimumClearance >= safetyMargin
```

→ SUCCESS

To jest ważniejsze niż sam kolor interfejsu, ponieważ dokładnie definiuje zachowanie aplikacji.

---

# 53. Finalny UX

Docelowo użytkownik powinien wykonać tylko:

```text
1. Zmierz prześwit.

2. Zmierz rozstaw osi.

3. Ustaw najniższy punkt na aucie.

4. Wpisz kąt rampy.

5. Kliknij:
   SPRAWDŹ AUTO
```

A aplikacja odpowiada:

```text
✓ PRZEJEDZIE

lub

! PRZEJEDZIE, ALE UWAŻAJ

lub

× NIE PRZEJEDZIE
```

oraz, jeżeli potrzeba:

```text
💡 ZESZLIFUJ CZUBEK O 4.7 CM

Kąt skarpy bez zmian: 17°

[ POKAŻ ZMIANĘ ]
```

---

# 54. Ważne przed implementacją

Nie traktować poprzedniego uproszczonego wzoru:

```text
Amax = 2 × atan(2X/Y)
```

jako pełnego silnika tej aplikacji.

W tej wersji aplikacji użytkownik wskazuje położenie najniższego punktu podwozia, więc silnik powinien uwzględniać tę pozycję oraz geometrię przejścia samochodu przez rampę.

Najlepiej zbudować **jeden spójny model geometryczny**, z którego korzystają jednocześnie:

```text
                    ┌───────────────────┐
                    │ Geometry Engine   │
                    └─────────┬─────────┘
                              │
             ┌────────────────┼────────────────┐
             ↓                ↓                ↓
       min clearance      collision      ramp modification
             │                │                │
             └────────────────┼────────────────┘
                              ↓
                         UI + Animation
```

Dzięki temu liczba pokazana w animacji, wynik `SUCCESS/WARNING/ERROR` i informacja **„zeszlifuj czubek o X cm”** będą pochodziły z tego samego modelu, zamiast być trzema niezależnymi przybliżeniami.
