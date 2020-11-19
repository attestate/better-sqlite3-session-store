// @format
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
  }

  return SqliteStore;
};
