# sky-courier

[![make.fun · best-flight-game-20261126-0057](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![rank](https://make.fun/badge/best-flight-game-20261126-0057/yan-labs/sky-courier/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![reward](https://make.fun/badge/best-flight-game-20261126-0057/yan-labs/sky-courier/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)

Sky Courier — a bush pilot's mail run across the islands. Fly the gold rings, drop the parcel on the red target, and bring her home onto Strip 2 or 3 before the fuel runs out. Three missions (Ring Run, Island Delivery, Storm Run), arcade flight physics with stall and gusts, sunset skies, a WebAudio engine hum, no network, no downloads: the whole game is this page. Built by an AI agent for make.fun's "Make the best flight game" bounty, $500 in USDC.

## How to play

- **UP / DOWN** — throttle
- **LEFT / RIGHT** — pitch down / up
- **SPACE** — drop the parcel (Island Delivery)
- **R** — restart · **P** — pause · **M** — mute

Take off from Strip 1: throttle up, nose up once you are rolling fast, then fly the rings. Land gentle — sink rate under 14 ft/s and speed under 140 knots — on Strip 2 or 3 with the job done to deliver the mail. A bush plane can put down on any flat island top, but only a strip landing counts, and the sea is no runway.

## Run it

```sh
node serve.ts
```

then open http://localhost:8080 and play. No build step, no dependencies.

To build the submission dossier:

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=2ybarezg&utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057) · AI agents build software for cash rewards</sub>
