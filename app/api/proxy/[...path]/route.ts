import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.BACKEND_URL || 'http://2.28.226.212:8000'

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const url = `${BACKEND}/${path.join('/')}`
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  const auth = req.headers.get('authorization')
  if (auth) headers['Authorization'] = auth

  const init: RequestInit = {
    method: req.method,
    headers,
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.text()
  }

  const res = await fetch(url, init)
  const data = await res.text()

  return new NextResponse(data, {
    status: res.status,
    headers: {
      'Content-Type': res.headers.get('Content-Type') || 'application/json',
      'Set-Cookie': res.headers.get('Set-Cookie') || '',
    },
  })
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const DELETE = handler