// @format
const test = require("ava").serial;
const sqlite = require("better-sqlite3");
const session = require("express-session");
const { unlinkSync } = require("fs");

const SqliteStore = require("../src/index.js")(session);

const dbName = "test.db";
const dbOptions = {
  verbose: console.log
};

const teardown = () => unlinkSync(dbName);

test("if initializing store works", t => {
  const db = new sqlite(dbName, dbOptions);
  const s = new SqliteStore({
    client: db
  });

  const [sid, sess, expire] = db.prepare("PRAGMA table_info (sessions)").all();
  t.assert(sid.name === "sid" && sid.type === "TEXT");
  t.assert(sess.name === "sess" && sess.type === "JSON");
  t.assert(expire.name === "expire" && expire.type === "TEXT");

  t.teardown(teardown);
});

test("if initialization can be run twice without any errors", t => {
  const db = new sqlite(dbName, dbOptions);
  const s = new SqliteStore({
    client: db
  });
  const s2 = new SqliteStore({
    client: db
  });

  const [sid, sess, expire] = db.prepare("PRAGMA table_info (sessions)").all();
  t.assert(sid.name === "sid" && sid.type === "TEXT");
  t.assert(sess.name === "sess" && sess.type === "JSON");
  t.assert(expire.name === "expire" && expire.type === "TEXT");

  t.teardown(teardown);
});

test("if error is thrown when client is missing from options", t => {
  t.throws(() => new SqliteStore());
});
