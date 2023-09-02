import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import { vomit } from './utils.js';

const schema = `
    CREATE TABLE IF NOT EXISTS llm_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL UNIQUE,
        result TEXT NOT NULL
    );
`;

await (await getDB()).exec(schema);

function getDB() {
    return open({
        filename: 'database.db',
        driver: sqlite3.Database
    });
}

export async function dbGetCachedResult(key: Object): Promise<string | null> {
    const db = await getDB();
    try {
        const result = await db.get<{ id: string, key: string, result: string }>(
            'SELECT result FROM llm_cache WHERE key = ?', 
            vomit(key)
        );

        return result ? result.result : null;
    } catch (error) {
        console.error('Error when trying to get cached result: ', error);
        return null;
    } finally {
        await db.close();
    }
}


export async function writeToCache(key: Object, result: string) {
    const db = await getDB();
    try {
        await db.run(
            'INSERT OR REPLACE INTO llm_cache (key, result) VALUES (?, ?)',
            vomit(key),
            result
        );
    } catch (error) {
        console.error('Error when trying to write to cache: ', error);
    } finally {
        await db.close();
    }
}
