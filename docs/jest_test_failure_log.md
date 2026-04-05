# Jest Test Fejl (4. April 2026)

Testen fejlede under kørsel af `npm test` pga. et timeout i `utils.test.js` under `callLocalGemini()`. Derudover er der en advarsel om "asynchronous operations that weren't stopped" (Open Handles).

### Fejl Output:

```
FAIL ./utils.test.js (5.7 s)
  ● Console

    console.log
      [2026-04-04T14:31:09.868Z][INFO0][00072][parseCandidateI][logger.js   ] - Parser kandidat-info fra Brutto-CV

      at Object.log [as info] (utils/logger.js:72:17)

    console.log
      [2026-04-04T14:31:09.885Z][INFO0][00072][parseCandidateI][logger.js   ] - Kandidat-data udtrukket

      at Object.log [as info] (utils/logger.js:72:17)

    console.log
      [2026-04-04T14:31:09.890Z][INFO0][00072][printToPdf     ][logger.js   ] - Genererer PDF

      at Object.log [as info] (utils/logger.js:72:17)

    console.log
      [2026-04-04T14:31:09.899Z][INFO0][00072][callLocalGemini][logger.js   ] - Sender prompt til Gemini CLI (Job: default, Model: gemini-2.5-flash)

      at Object.log [as info] (utils/logger.js:72:17)

    console.log
      [2026-04-04T14:31:09.902Z][INFO0][00072][callLocalGemini][logger.js   ] - AI Respons modtaget på 0.0 sekunder

      at Object.log [as info] (utils/logger.js:72:17)

    console.log
      [2026-04-04T14:31:14.904Z][INFO0][00072][master         ][logger.js   ] - Starter generering af Master CV visning

      at Object.log [as info] (utils/logger.js:72:17)

    console.log
      [2026-04-04T14:31:14.907Z][INFO0][00072][parseCandidateI][logger.js   ] - Parser kandidat-info fra Brutto-CV

      at Object.log [as info] (utils/logger.js:72:17)

    console.log
      [2026-04-04T14:31:14.909Z][INFO0][00072][parseCandidateI][logger.js   ] - Kandidat-data udtrukket

      at Object.log [as info] (utils/logger.js:72:17)

    console.log
      [2026-04-04T14:31:14.910Z][INFO0][00072][mdToHtml       ][logger.js   ] - Konverterer Markdown til HTML: brutto_cv_body.html

      at Object.log [as info] (utils/logger.js:72:17)

    console.log
      [2026-04-04T14:31:14.911Z][INFO0][00072][master         ][logger.js   ] - HTML genereret

      at Object.log [as info] (utils/logger.js:72:17)

    console.log
      [2026-04-04T14:31:14.912Z][INFO0][00072][printToPdf     ][logger.js   ] - Genererer PDF

      at Object.log [as info] (utils/logger.js:72:17)

    console.log
      [2026-04-04T14:31:14.912Z][INFO0][00072][master         ][logger.js   ] - PDF genereret succesfuldt

      at Object.log [as info] (utils/logger.js:72:17)

  ● utils.js › callLocalGemini() › bør returnere AI svar

    thrown: "Exceeded timeout of 5000 ms for a test.
    Add a timeout value to this test to increase the timeout, if this is a long-running test. See https://jestjs.io/docs/api#testname-fn-timeout."

      75 |
      76 |     describe('callLocalGemini()', () => {
    > 77 |         test('bør returnere AI svar', async () => {
         |         ^
      78 |             const response = await callLocalGemini('prompt');
      79 |             expect(response).toBe('Mocked output');
      80 |         });

      at test (utils.test.js:77:9)
      at describe (utils.test.js:76:5)
      at Object.describe (utils.test.js:27:1)

PASS ./swagger.test.js

Test Suites: 1 failed, 1 passed, 2 total
Tests:       1 failed, 7 passed, 8 total
Snapshots:   0 total
Time:        6.465 s
Ran all test suites.
Jest did not exit one second after the test run has completed.

'This usually means that there are asynchronous operations that weren't stopped in your tests. Consider running Jest with `--detectOpenHandles` to troubleshoot this issue.
(node:2166) [JEST-01] DeprecationWarning: 'matchers' property was accessed on [Object] after it was soft deleted
```

### Årsag / Opgaver til i morgen:
1. Fejlen skyldes, at `callLocalGemini` filen og strukturen blev refaktoreret tidligere i dag, så mockingen i `utils.test.js` fejler og forårsager et timeout.
2. Der er et "Open Handle" (sandsynligvis en promise, et event eller Redis/BullMQ kø-element, som ikke er lukket ordentligt ned i slutningen af testen).
3. Opgave: Vi skal have udført TODO-punktet "Test Refactoring" og splittet `utils.test.js` op i individuelle test-filer (f.eks. `callLocalGemini.test.js`) med korrekte mocks og teardowns.
