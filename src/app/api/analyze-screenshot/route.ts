import { NextRequest, NextResponse } from 'next/server'

const GROQ_API_KEY = process.env.GROQ_API_KEY || ''

const PROMPT = `Você é um especialista em finanças pessoais brasileiras. Esta é uma screenshot de um app bancário.

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

export async function POST(req: NextRequest) {
  if (!GROQ_API_KEY) {
    return NextResponse.json({ error: 'GROQ_API_KEY não configurada' }, { status: 500 })
  }

  try {
    const { image, mimeType, bankName } = await req.json()

    if (!image || !mimeType) {
      return NextResponse.json({ error: 'Imagem obrigatória' }, { status: 400 })
    }

    const fullPrompt = bankName
      ? `Esta é uma screenshot do app do banco "${bankName}".\n\n${PROMPT}`
      : PROMPT

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
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${image}` } },
            { type: 'text', text: fullPrompt },
          ],
        }],
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      const msg = err.error?.message || `Erro ${res.status}`
      return NextResponse.json({ error: msg }, { status: res.status })
    }

    const data = await res.json()
    const text = data.choices?.[0]?.message?.content
    if (!text) return NextResponse.json({ error: 'IA não retornou resposta' }, { status: 500 })

    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return NextResponse.json({ error: 'IA não retornou JSON válido' }, { status: 500 })

    const analysis = JSON.parse(match[0])
    return NextResponse.json(analysis)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}
