import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { createApp } from './app'

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
]
const originalApiKey = process.env.GROQ_API_KEY
process.env.GROQ_API_KEY = ''
const server = createApp(allowedOrigins).listen(0, '127.0.0.1')
let baseUrl = ''

before(async () => {
  await new Promise<void>((resolve, reject) => {
    server.once('listening', resolve)
    server.once('error', reject)
  })
  const address = server.address() as AddressInfo
  baseUrl = `http://127.0.0.1:${address.port}`
})

after(async () => {
  await new Promise<void>((resolve, reject) => {
    (server as Server).close((error) => error ? reject(error) : resolve())
  })
  if (originalApiKey === undefined) delete process.env.GROQ_API_KEY
  else process.env.GROQ_API_KEY = originalApiKey
})

test('health endpoint reports service status', async () => {
  const response = await fetch(`${baseUrl}/api/health`)
  const body = await response.json() as { status: string; mode: string }

  assert.equal(response.status, 200)
  assert.equal(body.status, 'ok')
  assert.ok(['ai', 'demo'].includes(body.mode))
})

test('explain endpoint returns a demo explanation for valid input', async () => {
  const response = await fetch(`${baseUrl}/api/ai/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'Cells use energy to carry out life processes.', level: 'school', style: 'summary', length: 'short' }),
  })
  const body = await response.json() as { explanation: string; mode: string }

  assert.equal(response.status, 200)
  assert.equal(body.mode, 'demo')
  assert.ok(body.explanation.length > 0)
})

test('explain endpoint accepts study material below the 100,000-character limit', async () => {
  const response = await fetch(`${baseUrl}/api/ai/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'x'.repeat(99_000), level: 'school', style: 'summary', length: 'short' }),
  })
  const body = await response.json() as { mode: string }

  assert.equal(response.status, 200)
  assert.equal(body.mode, 'demo')
})

test('translate endpoint returns a demo translation for valid input', async () => {
  const response = await fetch(`${baseUrl}/api/ai/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'Cells use energy.', targetLang: 'hi' }),
  })
  const body = await response.json() as { translation: string; mode: string; targetLang: string }

  assert.equal(response.status, 200)
  assert.equal(body.mode, 'demo')
  assert.equal(body.targetLang, 'hi')
  assert.ok(body.translation.length > 0)
})

test('quiz endpoint returns the default 30 demo questions for valid input', async () => {
  const response = await fetch(`${baseUrl}/api/ai/quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'Cells use energy to carry out life processes.' }),
  })
  const body = await response.json() as { quiz: { questions: unknown[] }; mode: string }

  assert.equal(response.status, 200)
  assert.equal(body.mode, 'demo')
  assert.equal(body.quiz.questions.length, 30)
})

test('quiz endpoint returns the requested number of demo questions', async () => {
  const response = await fetch(`${baseUrl}/api/ai/quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'Cells use energy to carry out life processes.', questionCount: 31 }),
  })
  const body = await response.json() as { quiz: { questions: { id: number }[] }; mode: string }

  assert.equal(response.status, 200)
  assert.equal(body.mode, 'demo')
  assert.equal(body.quiz.questions.length, 31)
  assert.deepEqual(body.quiz.questions.map((question) => question.id), Array.from({ length: 31 }, (_, index) => index + 1))
})

test('quiz endpoint rejects question counts below the material minimum', async () => {
  const response = await fetch(`${baseUrl}/api/ai/quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'Cells use energy.', questionCount: 2 }),
  })
  const body = await response.json() as { status: number }

  assert.equal(response.status, 400)
  assert.equal(body.status, 400)
})

test('malformed JSON returns a client error in JSON', async () => {
  const response = await fetch(`${baseUrl}/api/ai/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"text":',
  })
  const body = await response.json() as { error: string; status: number }

  assert.equal(response.status, 400)
  assert.equal(body.status, 400)
  assert.match(body.error, /valid JSON/i)
})

test('oversized JSON returns 413', async () => {
  const response = await fetch(`${baseUrl}/api/ai/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'x'.repeat(1_100_000) }),
  })
  const body = await response.json() as { status: number }

  assert.equal(response.status, 413)
  assert.equal(body.status, 413)
})

test('invalid AI input returns a validation error', async () => {
  const response = await fetch(`${baseUrl}/api/ai/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: '   ' }),
  })
  const body = await response.json() as { status: number; error: string }

  assert.equal(response.status, 400)
  assert.equal(body.status, 400)
  assert.match(body.error, /Text is required/)
})

test('unknown API routes return JSON 404', async () => {
  const response = await fetch(`${baseUrl}/api/not-a-route`)
  const body = await response.json() as { status: number; error: string }

  assert.equal(response.status, 404)
  assert.equal(body.status, 404)
  assert.match(body.error, /not found/i)
})

test('local Vite port 5174 is allowed by CORS', async () => {
  const response = await fetch(`${baseUrl}/api/ai/explain`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'http://localhost:5174',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type',
    },
  })

  assert.equal(response.status, 204)
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:5174')
})
