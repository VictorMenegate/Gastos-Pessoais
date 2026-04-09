import { NextRequest, NextResponse } from 'next/server'

const GROQ_API_KEY = process.env.GROQ_API_KEY || ''

const PROMPT_BASE = `Você é um especialista em finanças pessoais brasileiras.

Analise com MÁXIMA PRECISÃO e extraia todos os dados financeiros visíveis.

Retorne APENAS JSON válido, sem texto antes ou depois:
{
  "tipoTela": "home" | "extrato" | "cartao" | "emprestimo" | "investimento",
  "saldo": numero_ou_null,
  "faturaAtual": numero_ou_null,
  "limiteDisponivel": numero_ou_null,
  "dataVencimento": "DD/MM/AAAA_ou_null",
  "transacoes": [
    {
      "data": "DD/MM",
      "descricao": "tipo da transação (Pix enviado, Débito, Pagamento, etc.)",
      "contraparte": "nome da pessoa ou empresa ou null",
      "valor": numero (NEGATIVO=saída, POSITIVO=entrada),
      "tipo": "pix_enviado" | "pix_recebido" | "debito" | "credito" | "pagamento" | "transferencia" | "outros",
      "categoria": "alimentacao" | "transporte" | "transferencia" | "streaming" | "tecnologia" | "saude" | "lazer" | "servicos" | "outros"
    }
  ]
}

REGRAS:
- Valores são números puros: 147.57 não "R$ 147,57"
- Pix enviado / débito / pagamento = NEGATIVO
- Pix recebido / crédito / depósito = POSITIVO
- Inclua TODAS as transações visíveis
- Campos ausentes = null`

async function callGroqVision(base64: string, mimeType: string, bankName?: string) {
  const prompt = bankName
    ? `Esta é uma screenshot do app do banco "${bankName}".\n\n${PROMPT_BASE}`
    : PROMPT_BASE

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${GROQ_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      max_tokens: 3000,
      temperature: 0.1,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
          { type: 'text', text: prompt },
        ],
      }],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Erro ${res.status}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

async function callGroqText(text: string, bankName?: string) {
  const prompt = bankName
    ? `Este é o texto extraído de um PDF do banco "${bankName}".\n\n${PROMPT_BASE}\n\nTexto do PDF:\n\n${text}`
    : `${PROMPT_BASE}\n\nTexto do extrato/fatura:\n\n${text}`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${GROQ_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 4000,
      temperature: 0.1,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Erro ${res.status}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

function parseAIResponse(text: string) {
  if (!text) throw new Error('IA não retornou resposta')
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('IA não retornou JSON válido')
  return JSON.parse(match[0])
}

export async function POST(req: NextRequest) {
  if (!GROQ_API_KEY) {
    return NextResponse.json({ error: 'GROQ_API_KEY não configurada' }, { status: 500 })
  }

  try {
    const body = await req.json()
    const { image, mimeType, bankName, pdfText, pdfBase64 } = body

    let responseText: string

    if (pdfBase64) {
      // PDF base64 mode - parse on server with unpdf
      const { extractText, getDocumentProxy } = await import('unpdf')
      const buffer = Buffer.from(pdfBase64, 'base64')
      const uint8 = new Uint8Array(buffer)

      let pdf
      try {
        pdf = await getDocumentProxy(uint8, { password: body.pdfPassword || undefined })
      } catch (e: any) {
        if (e.message?.includes('password') || e.name === 'PasswordException') {
          return NextResponse.json({ error: 'PDF protegido com senha. Informe a senha para continuar.', needsPassword: true }, { status: 400 })
        }
        throw e
      }

      const { text } = await extractText(pdf, { mergePages: true })
      if (!text || text.trim().length < 10) {
        return NextResponse.json({ error: 'Nao foi possivel extrair texto do PDF. Tente enviar como screenshot.' }, { status: 400 })
      }
      responseText = await callGroqText(text, bankName)
    } else if (pdfText) {
      // PDF text mode (legacy)
      responseText = await callGroqText(pdfText, bankName)
    } else if (image && mimeType) {
      // Image vision mode
      responseText = await callGroqVision(image, mimeType, bankName)
    } else {
      return NextResponse.json({ error: 'Envie uma imagem ou PDF' }, { status: 400 })
    }

    const analysis = parseAIResponse(responseText)
    return NextResponse.json(analysis)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}
