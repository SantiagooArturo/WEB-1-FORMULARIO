const AIRTABLE_BASE_ID = "appohqE0Uwz8gWM0s";
const AIRTABLE_TABLE_ID = "tblbfNKUWCNE4BVB8";

type FormularioPayload = {
  nombreCompleto: string;
  email: string;
  telefono: string;
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

const MOTIVO_BY_LABEL: Record<string, FormularioPayload["motivo"]> = {
  "Consulta general": "consulta",
  Soporte: "soporte",
  Ventas: "ventas",
  Otro: "otro",
};

type AirtableRecord = {
  id: string;
  createdTime: string;
  fields: {
    "Nombre completo"?: string;
    Email?: string;
    Teléfono?: string;
    Empresa?: string;
    "Motivo de contacto"?: string;
    Mensaje?: string;
    "Fecha de envío"?: string;
  };
};

export type RespuestaFormulario = {
  id: string;
  nombreCompleto: string;
  email: string;
  telefono?: string;
  empresa?: string;
  motivo: FormularioPayload["motivo"];
  mensaje: string;
  fechaEnvio: string;
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

export async function GET() {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) {
    return Response.json(
      { error: "El servidor no tiene configurado AIRTABLE_TOKEN." },
      { status: 500 }
    );
  }

  const records: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`);
    url.searchParams.set("sort[0][field]", "Fecha de envío");
    url.searchParams.set("sort[0][direction]", "desc");
    if (offset) url.searchParams.set("offset", offset);

    const airtableResponse = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!airtableResponse.ok) {
      const errorBody = await airtableResponse.text();
      console.error("Airtable error:", errorBody);
      return Response.json(
        { error: "No se pudieron cargar los registros desde Airtable." },
        { status: 502 }
      );
    }

    const body: { records: AirtableRecord[]; offset?: string } = await airtableResponse.json();
    records.push(...body.records);
    offset = body.offset;
  } while (offset);

  const respuestas: RespuestaFormulario[] = records.map((record) => ({
    id: record.id,
    nombreCompleto: record.fields["Nombre completo"] || "",
    email: record.fields.Email || "",
    telefono: record.fields.Teléfono,
    empresa: record.fields.Empresa,
    motivo: MOTIVO_BY_LABEL[record.fields["Motivo de contacto"] || ""] || "otro",
    mensaje: record.fields.Mensaje || "",
    fechaEnvio: record.fields["Fecha de envío"] || record.createdTime,
  }));

  return Response.json({ respuestas });
}
