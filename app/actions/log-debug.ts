"use server"

import fs from "fs"
import path from "path"

const LOG_DIR = "logs"
const LOG_FILE = "login-debug.log"

function getLogPath() {
  return path.join(process.cwd(), LOG_DIR, LOG_FILE)
}

export async function appendLoginDebug(
  step: string,
  errorMsg: string | null,
  extra?: Record<string, unknown>
) {
  try {
    const dir = path.join(process.cwd(), LOG_DIR)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    const line = [
      new Date().toISOString(),
      step,
      errorMsg ?? "-",
      extra ? JSON.stringify(extra) : "",
    ].join(" | ")
    fs.appendFileSync(getLogPath(), line + "\n")
  } catch (e) {
    console.error("[appendLoginDebug]", e)
  }
}
