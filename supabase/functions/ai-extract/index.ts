import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  type: "audio" | "image";
  data: string;
  mimeType: string;
  context: {
    units: { id: string; name: string }[];
    categories: { id: string; name: string; unit_name: string }[];
    subcategories: { id: string; name: string; category_name: string }[];
    payment_methods: string[];
  };
  recordType: "expense" | "revenue";
  apiKey?: string;
}

function buildPrompt(body: RequestBody): string {
  const today = new Date().toISOString().split("T")[0];
  const units = body.context.units.map((u) => u.name).join(", ");
  const categories = body.context.categories
    .map((c) => `${c.name} (unidade: ${c.unit_name})`)
    .join(", ");
  const subcategories = body.context.subcategories
    .map((s) => `${s.name} (categoria: ${s.category_name})`)
    .join(", ");
  const payments = body.context.payment_methods.join(", ");
  const recordLabel =
    body.recordType === "expense" ? "DESPESA" : "RECEITA";

  return `Você é um assistente financeiro. Extraia dados para um lançamento de ${recordLabel}.

Campos para extrair:
- value: valor em reais (número decimal, ex: 150.50)
- observation: descrição breve
- date: data YYYY-MM-DD (se não identificar, use "${today}")
- payment_method: UMA opção exata de [${payments}] ou ""
- unit_name: UMA opção exata de [${units || "nenhuma"}] ou ""
- category_name: UMA opção exata de [${categories || "nenhuma"}] ou ""
- subcategory_name: UMA opção exata de [${subcategories || "nenhuma"}] ou ""

Responda APENAS com JSON válido. Sem markdown, sem explicações.`;
}

function errorResponse(message: string, status: number, details?: string) {
  return new Response(
    JSON.stringify({ error: message, ...(details && { details }) }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function transcribeAudio(apiKey: string, base64: string, mimeType: string): Promise<string> {
  const ext = mimeType.includes("webm") ? "webm" : mimeType.includes("mp4") ? "mp4" : "wav";
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  const formData = new FormData();
  formData.append("file", new Blob([bytes], { type: mimeType }), `audio.${ext}`);
  formData.append("model", "whisper-1");
  formData.append("language", "pt");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}` },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Whisper error: ${err}`);
  }

  const data = await res.json();
  return data.text;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    const apiKey = body.apiKey || Deno.env.get("OPENAI_API_KEY");

    if (!apiKey) {
      return errorResponse("Chave da API OpenAI não configurada.", 400);
    }

    const prompt = buildPrompt(body);
    const messages: unknown[] = [];

    if (body.type === "audio") {
      const transcript = await transcribeAudio(apiKey, body.data, body.mimeType);
      messages.push({
        role: "system",
        content: prompt,
      });
      messages.push({
        role: "user",
        content: `Transcrição do áudio: "${transcript}"`,
      });
    } else {
      messages.push({
        role: "system",
        content: prompt,
      });
      messages.push({
        role: "user",
        content: [
          { type: "text", text: "Extraia os dados desta imagem:" },
          {
            type: "image_url",
            image_url: { url: `data:${body.mimeType};base64,${body.data}` },
          },
        ],
      });
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.1,
        max_tokens: 1024,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      let detail = "";
      try {
        const errBody = await res.json();
        detail = errBody?.error?.message || JSON.stringify(errBody);
      } catch {
        detail = await res.text();
      }
      return errorResponse("Erro na API OpenAI", 502, detail);
    }

    const result = await res.json();
    let text = result.choices?.[0]?.message?.content?.trim() || "";

    if (text.startsWith("```")) {
      text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const extracted = JSON.parse(text);

    return new Response(
      JSON.stringify({ success: true, data: extracted }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return errorResponse("Falha ao processar", 500, String(err));
  }
});
