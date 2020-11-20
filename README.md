# better-sqlite3-session-store

[![npm version](https://badge.fury.io/js/better-sqlite3-session-store.svg)](https://badge.fury.io/js/better-sqlite3-session-store) [![workflow status](https://github.com/TimDaub/better-sqlite3-session-store/workflows/Node.js%20CI/badge.svg)](https://github.com/TimDaub/better-sqlite3-session-store/workflows/Node.js%20CI/badge.svg)

> **better-sqlite3-sessions-store** provides a
> [better-sqlite3](https://github.com/JoshuaWise/better-sqlite3/) session
> storage for [express-session](https://github.com/expressjs/session).

## Usage

```js
const sqlite = require("better-sqlite3");
const session = require("express-session")

// TODO: Finalize npm name
const SqliteStore = require("better-sqlite3-session-store")(session)
const db = new sqlite("sessions.db", { verbose: console.log });

app.use(
  session({
    store: new SqliteStore({
      client: db, 
      expired: {
        clear: true,
        intervalMs: 900000 //ms = 15min
      }
    }),
    secret: "keyboard cat",
    resave: false,
  })
)
```

## License

See [License](./LICENSE).

## Inspiration

To build this library, I looked at other session stores:

- [connect-sqlite3](https://github.com/rawberg/connect-sqlite3)
- [connect-redis](https://github.com/tj/connect-redis/)
