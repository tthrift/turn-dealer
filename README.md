# Turn Dealer

A single-file web app that deals a fair, random turn order for tabletop games. One big name on screen; tap anywhere for the next turn.

Live at: `https://tthrift.github.io/turn-dealer/`

## Usage behaviors

- **One tap, one turn.** The play screen shows the current player's name. Tapping anywhere (except the buttons) reveals the next player. A small muted line below shows who went last, and dots at the top show progress through the current round.
- **Install like an app.** Open the link in Safari on iOS (or any mobile browser), then Share → *Add to Home Screen*. It launches full-screen with its own icon.
- **Works offline.** After the first online visit, a service worker keeps a complete copy on the device. No connection is needed to play.
- **Updates are automatic, one launch behind.** When the app is opened while online, any newer published version downloads silently in the background. The session in progress is never interrupted; the new version takes effect the next time the app is launched. There is no update prompt.
- **Player names persist.** The roster is saved on the device on every edit — each keystroke, add, and delete — and restored on the next launch, including unfinished drafts. Saved names survive app updates; they are only lost if the device's website data for this site is cleared.
- **Three players minimum.** The *Deal first turn* button stays disabled until there are at least three non-blank, unique names.
- **Light and dark mode.** The app follows the device's system theme by default. The ◐ button overrides it, and a deliberate choice is remembered thereafter.
- **Version check.** The running version is shown in small text at the bottom of the setup screen (*Edit players*).

## Design choices

- **Single HTML file, no framework, no build step.** The entire app is `index.html`; the only other moving part is the service worker (`sw.js`). Hosting is trivial (any static host) and the code is auditable.
- **No accounts, no network calls, no analytics.** All state lives in the device's local storage. Nothing about players or games ever leaves the phone.
- **Silent updates.** Update delivery is automatic-on-next-launch rather than prompted; a new version never forces a mid-game reload. In-progress game state is in memory only and resets on relaunch.
- **Publishing an update = changing the `VERSION` string in `sw.js`.** The browser detects updates by byte-comparing `sw.js`, so any change to that string triggers redistribution — the value itself is meaningless and need not increase. The visible tag in `index.html` should be kept matching so devices can be checked at a glance.

## Dealing algorithm

The app keeps the full player pool and remembers who went last in the previous round.

1. Shuffle **all** N players with a Fisher–Yates shuffle driven by `Math.random()`. If the shuffle's first player is the same as the previous round's last player, discard it and reshuffle. The accepted shuffle is the hidden order for the round.
2. Each tap reveals the next name in that order.
3. When the round is exhausted, its last name is remembered and step 1 begins the next round.

Properties, by construction:

- Every player is dealt **exactly once per round**, so at any moment everyone has played either k or k+1 times — no one is ever more than one turn ahead of anyone else.
- The reshuffle rule at the round boundary means the same player is **never dealt twice in a row**.
- Each round is an independent uniform shuffle (conditioned only on the first slot), so there are no fixed seating patterns — no tendency for one player to follow another.

## Measured statistics

Simulation of the exact dealing logic, 5 players:

- **Immediate repeats** over 2,000,000 turns: **0**.
- **Successor distribution**: for every ordered pair (X, Y), the measured probability that Y immediately follows X was 24.9%–25.1% (ideal: 25%). No pairing bias.
- **Cumulative fairness**: across 10,000 simulated 60-turn sessions, the gap between the most- and least-turned player never exceeded **1** — in 100% of sessions, at every point in the session.
