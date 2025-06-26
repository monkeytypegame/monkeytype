import { openDB, DBSchema, IDBPDatabase } from "idb";

type FileDB = DBSchema & {
  files: {
    key: string; // filename
    value: string; // the data url
  };
};

class FileStorage {
  private dbPromise: Promise<IDBPDatabase<FileDB>>;

  constructor(dbName = "file-storage-db") {
    this.dbPromise = openDB<FileDB>(dbName, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("files")) {
          db.createObjectStore("files");
        }
      },
    });
  }

  async storeFile(filename: string, dataUrl: string): Promise<void> {
    const db = await this.dbPromise;
    await db.put("files", dataUrl, filename);
  }

  async getFile(filename: string): Promise<string | undefined> {
    const db = await this.dbPromise;
    return db.get("files", filename);
  }

  async deleteFile(filename: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete("files", filename);
  }

  async listFilenames(): Promise<string[]> {
    const db = await this.dbPromise;
    return db.getAllKeys("files");
  }

  async hasFile(filename: string): Promise<boolean> {
    return (await this.getFile(filename)) !== undefined;
  }
}

export default new FileStorage();
