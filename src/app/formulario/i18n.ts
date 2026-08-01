export type Language = "es" | "en";

export const translations = {
  es: {
    hero: {
      titleStart: "Hablemos de tu",
      titleHighlight: "próximo proyecto",
      subtitle:
        "Cuéntanos qué necesitas y te contactaremos en menos de 24 horas. Sin formularios eternos, sin vueltas.",
      copyright: "Todos los derechos reservados.",
    },
    form: {
      heading: "Cuéntanos más",
      subheading: "Completa el formulario y te responderemos a la brevedad.",
      steps: ["Datos de contacto", "Motivo y mensaje", "Confirmación"],
      labels: {
        nombreCompleto: "Nombre completo",
        email: "Email",
        telefono: "Teléfono",
        motivo: "Motivo de contacto",
        mensaje: "Mensaje",
      },
      optional: "(opcional)",
      placeholders: {
        nombreCompleto: "Ej. María Fernández",
        email: "tu@email.com",
        telefono: "+51 999 999 999",
        motivoDefault: "Selecciona una opción",
        mensaje: "Cuéntanos en qué podemos ayudarte...",
      },
      motivos: {
        consulta: "Consulta general",
        soporte: "Soporte",
        ventas: "Ventas",
        otro: "Otro",
      },
      terminos: "Acepto los términos y condiciones y la política de privacidad.",
      errors: {
        nombreCompleto: "El nombre completo es requerido.",
        emailRequired: "El email es requerido.",
        emailInvalid: "Ingresa un email con un formato válido.",
        motivo: "Selecciona un motivo de contacto.",
        mensajeRequired: "El mensaje es requerido.",
        mensajeMin: "El mensaje debe tener al menos 10 caracteres.",
        aceptaTerminos: "Debes aceptar los términos para continuar.",
        submitGeneric: "No se pudo enviar el formulario.",
      },
      buttons: {
        atras: "Atrás",
        siguiente: "Siguiente",
        enviando: "Enviando...",
        enviar: "Enviar mensaje",
        otraRespuesta: "Enviar otra respuesta",
      },
      success: {
        title: (name: string) => `¡Gracias, ${name}!`,
        titleFallback: "¡Gracias!",
        message:
          "Recibimos tu mensaje correctamente. Nuestro equipo se pondrá en contacto contigo muy pronto.",
      },
    },
  },
  en: {
    hero: {
      titleStart: "Let's talk about your",
      titleHighlight: "next project",
      subtitle:
        "Tell us what you need and we'll get back to you within 24 hours. No endless forms, no hassle.",
      copyright: "All rights reserved.",
    },
    form: {
      heading: "Tell us more",
      subheading: "Fill out the form and we'll get back to you shortly.",
      steps: ["Contact details", "Reason & message", "Confirmation"],
      labels: {
        nombreCompleto: "Full name",
        email: "Email",
        telefono: "Phone",
        motivo: "Reason for contact",
        mensaje: "Message",
      },
      optional: "(optional)",
      placeholders: {
        nombreCompleto: "E.g. Maria Fernandez",
        email: "you@email.com",
        telefono: "+1 999 999 9999",
        motivoDefault: "Select an option",
        mensaje: "Tell us how we can help...",
      },
      motivos: {
        consulta: "General inquiry",
        soporte: "Support",
        ventas: "Sales",
        otro: "Other",
      },
      terminos: "I accept the terms and conditions and the privacy policy.",
      errors: {
        nombreCompleto: "Full name is required.",
        emailRequired: "Email is required.",
        emailInvalid: "Enter a valid email address.",
        motivo: "Select a reason for contact.",
        mensajeRequired: "Message is required.",
        mensajeMin: "Message must be at least 10 characters long.",
        aceptaTerminos: "You must accept the terms to continue.",
        submitGeneric: "The form could not be submitted.",
      },
      buttons: {
        atras: "Back",
        siguiente: "Next",
        enviando: "Sending...",
        enviar: "Send message",
        otraRespuesta: "Send another response",
      },
      success: {
        title: (name: string) => `Thanks, ${name}!`,
        titleFallback: "Thank you!",
        message: "We received your message. Our team will get in touch with you shortly.",
      },
    },
  },
} as const;

export type Translations = (typeof translations)[Language];
