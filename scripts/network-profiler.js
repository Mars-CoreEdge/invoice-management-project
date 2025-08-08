#!/usr/bin/env node

// Network profiler: runs scripted navigation with headless browser and reports repeated API calls

const fs = require('fs')
const path = require('path')
const puppeteer = require('puppeteer')

function groupByUrl(entries) {
  const map = new Map()
  for (const e of entries) {
    const url = e.url.split('?')[0]
    const count = map.get(url) || 0
    map.set(url, count + 1)
  }
  return Array.from(map.entries()).map(([url, count]) => ({ url, count }))
}

async function run() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const report = { baseUrl, entries: [] }

  const browser = await puppeteer.launch({ headless: 'new' })
  const page = await browser.newPage()

  // record API calls only
  page.on('request', (req) => {
    const url = req.url()
    if (url.includes('/api/')) {
      report.entries.push({ url, method: req.method(), ts: Date.now() })
    }
  })

  // 1) visit dashboard
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle2' })
  // 2) focus window to trigger focus-based refresh
  await page.bringToFront()
  await new Promise((r) => setTimeout(r, 1000))
  // 3) navigate to invoices
  await page.goto(`${baseUrl}/invoices`, { waitUntil: 'networkidle2' })
  await new Promise((r) => setTimeout(r, 500))

  await browser.close()

  const grouped = groupByUrl(report.entries)
  const multiples = grouped.filter((g) => g.count > 1)
  const out = {
    baseUrl,
    totals: grouped.sort((a, b) => b.count - a.count),
    repeated: multiples,
    raw: report.entries,
  }

  const outPath = path.join(__dirname, 'network-report.json')
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2))
  console.log(`Network report saved to ${outPath}`)
  if (multiples.length) {
    console.log('Repeated endpoints:')
    multiples.forEach((m) => console.log(` - ${m.url}: ${m.count}x`))
  } else {
    console.log('No repeated endpoints detected in the scripted flow.')
  }
}

run().catch((e) => {
  console.error('Profiler failed:', e)
  process.exit(1)
})


