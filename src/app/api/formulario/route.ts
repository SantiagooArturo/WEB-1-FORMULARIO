const AIRTABLE_BASE_ID = "appohqE0Uwz8gWM0s";
const AIRTABLE_TABLE_ID = "tblbfNKUWCNE4BVB8";

type FormularioPayload = {
  nombreCompleto: string;
  email: string;
  telefono: string;
  empresa: string;
  motivo: "consulta" | "soporte" | "ventas" | "otro";
  mensaje: string;
  aceptaTerminos: boolean;
};

const MOTIVO_LABELS: Record<FormularioPayload["motivo"], string> = {
  consulta: "Consulta general",
  soporte: "Soporte",
  ventas: "Ventas",
  otro: "Otro",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validatePayload(payload: Partial<FormularioPayload>): string | null {
  if (!payload.nombreCompleto?.trim()) return "El nombre completo es requerido.";
  if (!payload.email?.trim() || !EMAIL_REGEX.test(payload.email.trim())) {
    return "El email es inválido.";
  }
  if (!payload.motivo || !(payload.motivo in MOTIVO_LABELS)) {
    return "El motivo de contacto es inválido.";
  }
  if (!payload.mensaje?.trim() || payload.mensaje.trim().length < 10) {
    return "El mensaje debe tener al menos 10 caracteres.";
  }
  if (!payload.aceptaTerminos) return "Debes aceptar los términos.";
  return null;
}

export async function POST(request: Request) {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) {
    return Response.json(
      { error: "El servidor no tiene configurado AIRTABLE_TOKEN." },
      { status: 500 }
    );
  }

  const payload: Partial<FormularioPayload> = await request.json();
  const validationError = validatePayload(payload);
  if (validationError) {
    return Response.json({ error: validationError }, { status: 400 });
  }

  const airtableResponse = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        records: [
          {
            fields: {
              "Nombre completo": payload.nombreCompleto,
              Email: payload.email,
              Teléfono: payload.telefono || undefined,
              Empresa: payload.empresa || undefined,
              "Motivo de contacto": MOTIVO_LABELS[payload.motivo as FormularioPayload["motivo"]],
              Mensaje: payload.mensaje,
              "Acepta términos": payload.aceptaTerminos,
              "Fecha de envío": new Date().toISOString(),
            },
          },
        ],
      }),
    }
  );

  if (!airtableResponse.ok) {
    const errorBody = await airtableResponse.text();
    console.error("Airtable error:", errorBody);
    return Response.json(
      { error: "No se pudo guardar el registro en Airtable." },
      { status: 502 }
    );
  }

  return Response.json({ ok: true });
}
