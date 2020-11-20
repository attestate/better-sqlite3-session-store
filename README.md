# connect-better-sqlite3

> **connect-better-sqlite3** provides a
> [better-sqlite3](https://github.com/JoshuaWise/better-sqlite3/) session
> storage for [express-session](https://github.com/expressjs/session).

## Usage

```js
const sqlite = require("better-sqlite3");
const session = require("express-session")

// TODO: Finalize npm name
const SqliteStore = require("connect-better-sqlite3")(session)
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

To build this library, I looked at other `connect-*` libraries:

- [connect-sqlite3](https://github.com/rawberg/connect-sqlite3)
- [connect-redis](https://github.com/tj/connect-redis/)
