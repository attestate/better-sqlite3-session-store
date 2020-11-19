// @format
const test = require("ava").serial;
const sqlite = require("better-sqlite3");
const session = require("express-session");
const { unlinkSync } = require("fs");
const differenceInSeconds = require("date-fns/differenceInSeconds");

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

test("if it saves a new session record", t => {
  const db = new sqlite(dbName, dbOptions);
  const s = new SqliteStore({
    client: db
  });

  const sid = "123";
  const sess = { cookie: { maxAge: 2000 }, name: "sample name" };
  s.set(sid, sess, (err, rows) => {
    t.assert(!err);
    t.assert(rows);
  });

  const dbSess = db.prepare("SELECT * FROM sessions WHERE sid = ?").get(sid);
  t.assert(dbSess.sess === JSON.stringify(sess));
  t.assert(dbSess.sid === sid);
  t.assert(
    differenceInSeconds(new Date(dbSess.expire), new Date()) >= sess.cookie.maxAge - 5
  );

  t.teardown(teardown);
});

test("if it overwrites an already-existing session", t => {
  const db = new sqlite(dbName, dbOptions);
  const s = new SqliteStore({
    client: db
  });

  const sid = "123";
  const sess = { cookie: { maxAge: 2000 }, name: "sample name" };
  s.set(sid, sess, (err, rows) => {
    t.assert(!err);
    t.assert(rows);
  });

  const dbSess = db.prepare("SELECT * FROM sessions WHERE sid = ?").get(sid);
  t.assert(dbSess.sess === JSON.stringify(sess));
  t.assert(dbSess.sid === sid);
  t.assert(
    differenceInSeconds(new Date(dbSess.expire), new Date()) >= sess.cookie.maxAge - 5
  );

  const sess2 = { cookie: { maxAge: 5000 }, name: "replaced name" };
  s.set(sid, sess2, (err, rows) => {
    t.assert(!err);
    t.assert(rows);
  });
  const dbSess2 = db.prepare("SELECT * FROM sessions WHERE sid = ?").get(sid);
  t.assert(dbSess2.sess === JSON.stringify(sess2));
  t.assert(dbSess2.sid === sid);
  t.assert(
    differenceInSeconds(new Date(dbSess2.expire), new Date()) >= sess2.cookie.maxAge - 5
  );

  t.teardown(teardown);
});

test("if it saves a session with a missing maxAge too", t => {
  const db = new sqlite(dbName, dbOptions);
  const s = new SqliteStore({
    client: db
  });

  const sid = "123";
  const sess = { cookie: {}, name: "sample name" };
  const oneDayAge = 86400;
  s.set(sid, sess, (err, rows) => {
    t.assert(!err);
    t.assert(rows);
  });

  const dbSess = db.prepare("SELECT * FROM sessions WHERE sid = ?").get(sid);
  t.assert(dbSess.sess === JSON.stringify(sess));
  t.assert(dbSess.sid === sid);
  t.assert(
    differenceInSeconds(new Date(dbSess.expire), new Date()) >= oneDayAge - 5
  );

  t.teardown(teardown);
});

