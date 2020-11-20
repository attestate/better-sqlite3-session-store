// @format
const test = require("ava").serial;
const sqlite = require("better-sqlite3");
const session = require("express-session");
const { unlinkSync, existsSync } = require("fs");
const differenceInSeconds = require("date-fns/differenceInSeconds");

const SqliteStore = require("../src/index.js")(session);

const dbName = "test.db";
const dbOptions = {
  verbose: console.log
};

const teardown = () => {
  try {
    unlinkSync(dbName);
  } catch (err) {
    if (!existsSync(dbName)) {
      //noop
    } else {
      throw err;
    }
  }
};

test.afterEach(teardown);

test("if initializing store works", t => {
  const db = new sqlite(dbName, dbOptions);
  const s = new SqliteStore({
    client: db
  });

  const [sid, sess, expire] = db.prepare("PRAGMA table_info (sessions)").all();
  t.assert(sid.name === "sid" && sid.type === "TEXT");
  t.assert(sess.name === "sess" && sess.type === "JSON");
  t.assert(expire.name === "expire" && expire.type === "TEXT");
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
    differenceInSeconds(new Date(dbSess.expire), new Date()) >=
      sess.cookie.maxAge - 5
  );
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
    differenceInSeconds(new Date(dbSess.expire), new Date()) >=
      sess.cookie.maxAge - 5
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
    differenceInSeconds(new Date(dbSess2.expire), new Date()) >=
      sess2.cookie.maxAge - 5
  );
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
});

test("if get method returns null when no session was found", t => {
  const db = new sqlite(dbName, dbOptions);
  const s = new SqliteStore({
    client: db
  });

  s.get("non-existent", (err, res) => {
    t.assert(!err);
    t.assert(res === null);
  });
});

test("if an expired session is ignored when trying to get a session", async t => {
  const db = new sqlite(dbName, dbOptions);
  const s = new SqliteStore({
    client: db
  });

  const sid = "123";
  // NOTE: Session expires immediately with maxAge being 1 second.
  const sess = { cookie: { maxAge: 1 }, name: "sample name" };
  s.set(sid, sess, (err, res) => {
    t.assert(!err);
    t.assert(res);
  });

  // NOTE: Wait 2 sec to make sure that session is expired.
  await new Promise(resolve => setTimeout(resolve, 2000));

  s.get(sid, (err, res) => {
    t.assert(!err);
    console.log(res);
    t.assert(res === null);
  });
});

test("if an active session is retrieved when calling get", t => {
  const db = new sqlite(dbName, dbOptions);
  const s = new SqliteStore({
    client: db
  });

  const sid = "123";
  const sess = { cookie: { maxAge: 100 }, name: "sample name" };
  s.set(sid, sess, (err, res) => {
    t.assert(!err);
    t.assert(res);
  });

  s.get(sid, (err, dbSess) => {
    t.assert(!err);
    t.deepEqual(sess, dbSess);
  });
});

test("if a session is destroyed", t => {
  const db = new sqlite(dbName, dbOptions);
  const s = new SqliteStore({
    client: db
  });

  const sid = "123";
  const sess = { cookie: { maxAge: 100 }, name: "sample name" };
  s.set(sid, sess, (err, res) => {
    t.assert(!err);
    t.assert(res);
  });

  s.destroy(sid, (err, res) => {
    t.assert(!err);
    t.assert(res);
  });

  const { numOfSessions } = db
    .prepare("SELECT COUNT(*) as numOfSessions FROM sessions")
    .get();
  t.assert(numOfSessions === 0);
});

test("if non-existent session can be destroyed without throwing an error too", t => {
  const db = new sqlite(dbName, dbOptions);
  const s = new SqliteStore({
    client: db
  });
  const sid = "123";

  s.destroy(sid, (err, res) => {
    t.assert(!err);
    t.assert(res);
  });
});

test("if counting all sessions is possible", t => {
  const db = new sqlite(dbName, dbOptions);
  const s = new SqliteStore({
    client: db
  });

  s.length((err, res) => {
    t.assert(typeof res === "number");
    t.assert(res === 0);
  });

  const sid = "123";
  const sess = { cookie: { maxAge: 100 }, name: "sample name" };
  s.set(sid, sess, (err, res) => {
    t.assert(!err);
    t.assert(res);
  });

  s.length((err, res) => {
    t.assert(typeof res === "number");
    t.assert(res === 1);
  });
});
