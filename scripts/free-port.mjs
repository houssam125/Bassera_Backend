// Frees the given TCP port (default: $PORT or 4000) by killing whatever is
// listening on it. Runs before `npm run dev` so a leftover server never blocks a
// restart. No-op if the port is already free. Cross-platform (win32 / posix).
import { execSync } from 'node:child_process'

const port = process.argv[2] || process.env.PORT || '4000'
const isWin = process.platform === 'win32'

function pidsOnPort(p) {
  try {
    if (isWin) {
      const out = execSync(`netstat -ano -p tcp`, { encoding: 'utf8' })
      return [
        ...new Set(
          out
            .split(/\r?\n/)
            .filter(l => /LISTENING/.test(l) && new RegExp(`[:.]${p}\\s`).test(l))
            .map(l => l.trim().split(/\s+/).pop())
            .filter(pid => pid && pid !== '0'),
        ),
      ]
    }
    const out = execSync(`lsof -ti tcp:${p} -s tcp:LISTEN`, { encoding: 'utf8' })
    return [...new Set(out.split(/\r?\n/).filter(Boolean))]
  } catch {
    return []
  }
}

const pids = pidsOnPort(port)
if (pids.length === 0) {
  console.log(`[free-port] ${port} is free`)
} else {
  for (const pid of pids) {
    try {
      execSync(isWin ? `taskkill /F /PID ${pid}` : `kill -9 ${pid}`, { stdio: 'ignore' })
      console.log(`[free-port] killed PID ${pid} on ${port}`)
    } catch {
      console.log(`[free-port] could not kill PID ${pid} (may already be gone)`)
    }
  }
}
