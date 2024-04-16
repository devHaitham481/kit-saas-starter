import type { Database } from "./types";

class Db {
  #client: Database | undefined;

  get client(): Database {
    if (!this.#client) throw new Error("Database client is not initialized.");

    return this.#client;
  }

  set client(value: Database) {
    this.#client = value;
  }
}

const db = new Db();

export { db };
