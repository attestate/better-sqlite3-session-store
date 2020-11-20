// @format
const add = require("date-fns/add");

// NOTE: 1d = 86400s
const oneDay = 86400;
const tableName = "sessions";
const schema = `
  CREATE TABLE IF NOT EXISTS ${tableName}
  (
    sid TEXT NOT NULL PRIMARY KEY,
    sess JSON NOT NULL,
    expire TEXT NOT NULL
  )
`;

module.exports = ({ Store }) => {
  class SqliteStore extends Store {
    constructor(options = {}) {
      super(options);

      if (!options.client) {
        throw new Error("A client must be directly provided to SqliteStore");
      }
      this.client = options.client;
      this.createDb();
    }

    createDb() {
      this.client.exec(schema);
    }

    set(sid, sess, cb) {
      let age;
      if (sess.cookie && sess.cookie.maxAge) {
        // NOTE: `Max-age` property in cookie is in unit seconds
        age = sess.cookie.maxAge;
      } else {
        // NOTE: In cases `Max-age` is not set on a cookie, we set expire to
        // one day in the future.
        age = oneDay;
      }

      const now = new Date();
      const expire = add(now, { seconds: age }).toISOString();
      const entry = { sid, sess: JSON.stringify(sess), expire };

      let res;
      try {
        res = this.client
          .prepare(
            `
        INSERT OR REPLACE INTO 
          ${tableName}
        VALUES
          (
            @sid,
            @sess,
            @expire
          )
      `
          )
          .run(entry);
      } catch (err) {
        cb(err);
      }

      cb(null, res);
    }

    get(sid, cb) {
      let res;

      try {
        res = this.client
          .prepare(
            `
        SELECT sess 
        FROM ${tableName} 
        WHERE sid = @sid AND datetime('now') < datetime(expire)
      `
          )
          .get({ sid });
      } catch (err) {
        cb(err);
      }

      if (res && res.sess) {
        cb(null, JSON.parse(res.sess));
      } else {
        cb(null, null);
      }
    }

    destroy(sid, cb) {
      let res;

      try {
        res = this.client
          .prepare(
            `
          DELETE FROM ${tableName} WHERE sid = ?
        `
          )
          .run(sid);
      } catch (err) {
        cb(err);
      }

      cb(null, res);
    }

    length(cb) {
      let res;

      try {
        res = this.client
          .prepare(
            `
          SELECT COUNT(*) as count FROM ${tableName}
        `
          )
          .get();
      } catch (err) {
        cb(err);
      }

      cb(null, res.count);
    }
  }

  return SqliteStore;
};
