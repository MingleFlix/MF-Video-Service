# MF-Video-Service

This service is responsible for managing the video queue and syncing the video playback for all users in a room.

## Author Notice

**Primary** ownership of the code is marked at the top of each file with:

```js
/*
 * Author: Vorname Nachname
 * Matrikelnummer: Nummer
 */
```

Secodary ownership (e.g. functions added by a different coder) are marked like this:

```js
// ====================== <Different Author> ========================

/*
 * Author: Vorname Nachname
 * Matrikelnummer: Nummer
 */

function fooBar() {
  return 42;
}

// ===================== </Different Author> ========================
```

Mixture of ownership (e.g. the same function get's edited by different people) are marked like this:

```js
// ====================== <Partial Author> ========================

/*
 * Partial: Vorname Nachname
 * Matrikelnummer: Nummer
 */

function fooBar() {
  var theAnswerToEverything = 41;
  return theAnswerToEverything + 1;
}

// ====================== </Partial Author> ========================
```

## How to run the project

1. Clone the repository
2. Run `npm install` to install all the dependencies
3. Clone the .env.example file, rename it to .env and update the values as per your environment
4. Run `npm run dev` to start the server in development mode

## How to run unit tests

1. Run `npm run test` to start the server in development mode

## Diagrams

#### Low Level Activity Diagram

![Aktivitäsdiagramm](https://github.com/MingleFlix/MF-Video-Service/assets/34812414/fcb80e6d-ff0a-40d8-a514-42ab47964a33)

#### Sequence Diagram Player

![Sequenzdiagramm Player](https://github.com/MingleFlix/MF-Video-Service/assets/34812414/36f2c6ae-a178-48fc-9f4d-c4847d18a1ba)

#### Sequence Diagram Queue

![Sequenzdiagramm Queue](https://github.com/MingleFlix/MF-Video-Service/assets/34812414/ee7ea975-591b-4d13-82f8-1e5faaa7a4b8)
