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

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
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
              text: `Extract the following fields from this purchase order or tech pack document.
Return ONLY a JSON object with these exact keys (use null if not found):
{
  "projectName": string or null,
  "poNumber": string or null,
  "factoryName": string or null,
  "quantity": number or null,
  "unit": string or null,
  "country": string or null,
  "buyer": string or null,
  "deliveryDate": string (YYYY-MM-DD) or null,
  "aqlLevel": string or null,
  "category": string or null,
  "productType": string or null,
  "season": string or null,
  "sizes": { "XS": number, "S": number, "M": number, "L": number, "XL": number, "XXL": number } or null
}
Return only the JSON, no explanation.`,
            },
          ],
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const clean = text.replace(/```json|```/g, '').trim()
    const extracted = JSON.parse(clean)

    return NextResponse.json({ success: true, data: extracted })
  } catch (error: any) {
    console.error('Extraction error:', error?.message)
    return NextResponse.json({ error: 'Extraction failed' }, { status: 500 })
  }
}
