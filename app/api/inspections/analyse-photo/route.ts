import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get('photo') as File
    const category = formData.get('category') as string || 'garments'
    const photoType = formData.get('photoType') as string || 'production'
    const defectLibrary = formData.get('defectLibrary') as string || ''

    if (!file) {
      return NextResponse.json({ error: 'No photo provided' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mimeType = (file.type || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp'

    const client = new Anthropic({ apiKey })

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: `You are a quality inspection expert for ${category} manufacturing. You analyse photos of products and identify visible defects. You ONLY report defects that are clearly visible in the photo. You match defects to the provided defect library. Always respond with valid JSON only.`,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mimeType, data: base64 },
          },
          {
            type: 'text',
            text: `Analyse this ${photoType} photo of a ${category} product.

Available defect library for ${category}:
${defectLibrary}

Identify any visible defects. For each defect found:
- Match to the closest defect name from the library above
- Assign severity: critical (structural failure/safety), major (visible/functional issue), minor (cosmetic)
- Note the location on the garment

Return ONLY this JSON structure, no markdown:
{
  "defects": [
    {
      "name": "defect name from library",
      "severity": "critical|major|minor",
      "location": "e.g. left side seam",
      "confidence": 0.0-1.0
    }
  ],
  "overall_quality": "good|acceptable|poor",
  "notes": "brief overall observation"
}

If no defects are visible, return: {"defects": [], "overall_quality": "good", "notes": "No visible defects"}`,
          },
        ],
      }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const clean = text.replace(/```json|```/g, '').trim()
    const result = JSON.parse(clean)

    return NextResponse.json({ success: true, data: result })
  } catch (err: any) {
    console.error('Photo analysis error:', err?.message)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
