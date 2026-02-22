/**
 * Logovanje grešaka u fajl (samo server-side).
 * Fajl: logs/app-errors.log
 */

import { appendFile } from "fs/promises"
import path from "path"

const LOG_FILE = path.join(process.cwd(), "logs", "app-errors.log")

export function logAppError(message: string, context?: string): void {
  const line = `${new Date().toISOString()} | ${context ?? "app"} | ${message}\n`
  appendFile(LOG_FILE, line).catch(() => {
    // Ne prekidaj rad ako log nije dostupan (npr. read-only fs)
  })
}
