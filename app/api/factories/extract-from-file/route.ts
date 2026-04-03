import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mimeType = file.type || 'application/pdf'

    const client = new Anthropic({ apiKey })

    const msg = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: mimeType as 'application/pdf',
              data: base64,
            },
          },
          {
            type: 'text',
            text: `Extract factory details from this vendor assessment or compliance document.
Return ONLY valid JSON, no markdown, no explanation:
{
  "name": string|null,
  "country": string|null,
  "city": string|null,
  "contactName": string|null,
  "contactEmail": string|null,
  "contactPhone": string|null,
  "totalLines": number|null,
  "certifications": string[]|null
}`,
          },
        ],
      }],
    })

    const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const clean = text.replace(/```json|```/g, '').trim()
    return NextResponse.json({ success: true, data: JSON.parse(clean) })
  } catch (err: any) {
    console.error('Factory extraction error:', err?.message)
    return NextResponse.json({ error: 'Extraction failed' }, { status: 500 })
  }
}
