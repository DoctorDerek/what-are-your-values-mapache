import type { InterfaceCopy } from "./EnglishInterfaceCopy"
import { MEXICAN_SPANISH_PRESENTATION_COPY } from "./MexicanSpanishPresentationCopy"

const introduction = MEXICAN_SPANISH_PRESENTATION_COPY.introduction

export const MEXICAN_SPANISH_INFORMATION_COPY: InterfaceCopy["information"] = {
  introduction: {
    id: "introduction",
    title: introduction.title,
    accessibleCloseLabel: introduction.accessibleCloseLabel,
    primaryActionLabel: introduction.closeAction,
    blocks: [
      { kind: "lead", text: introduction.tagline },
      ...introduction.body.map((text) => ({
        kind: "paragraph" as const,
        text,
      })),
    ],
  },
  "how-it-works": {
    id: "how-it-works",
    title: "Cómo funciona",
    accessibleCloseLabel: "Cerrar Cómo funciona",
    primaryActionLabel: "Cerrar",
    blocks: [
      {
        kind: "lead",
        text: "WAYVM convierte la exploración de tus valores en un juego sencillo: elige cuál de dos valores te importa más en este momento.",
      },
      {
        kind: "section",
        heading: "Empieza con 103 valores o agrega los tuyos",
        paragraphs: [
          "El juego incluye 103 valores: 100 del Personal Values Card Sort de 2011, de dominio público, más Ingenio, Destino y Mascotas. Ninguna lista puede incluir todos los valores que podrían importarle a cada persona, así que puedes agregar tantos valores personalizados privados como te resulten útiles, con tus propios nombres y definiciones.",
        ],
      },
      {
        kind: "section",
        heading: "Elige entre dos valores",
        paragraphs: [
          "Toca, haz clic o selecciona el valor que te importe más. Ambos valores pueden ser importantes. La idea es hacer una comparación honesta cuando no puedes elegir los dos.",
        ],
      },
      {
        kind: "section",
        heading: "Construye una clasificación que evoluciona",
        paragraphs: [
          "El valor que eliges gana XP. Cada victoria otorga 4 veces el rango de recompensa del oponente al inicio del ciclo de pares, hasta un máximo de 400 XP. Tus elecciones van dando forma a tus niveles, tus cinco valores principales y tu clasificación completa.",
          "Cada victoria del primer ciclo otorga 4 XP porque todos los valores empiezan en el rango de recompensa 1. En ciclos posteriores se usa el rango de recompensa fijado para cada oponente, con un límite de 100, de modo que el orden de los pares dentro de un ciclo no cambia la recompensa.",
        ],
      },
      {
        kind: "section",
        heading: "Consulta tus cinco principales y todos los demás",
        paragraphs: [
          "Tus cinco valores principales te dan un resumen breve de lo que más te importa. En Ver todos los valores puedes consultar tu clasificación completa y las definiciones. Las definiciones también se muestran durante las batallas.",
        ],
      },
      {
        kind: "section",
        heading: "Juega tanto o tan poco como quieras",
        paragraphs: [
          "Con el tiempo, el juego presenta todos los pares posibles en un orden equilibrado. Con los 103 valores incluidos, un ciclo completo contiene 5,253 comparaciones únicas. Agregar valores personalizados aumenta ese total, pero nunca tienes que completar un ciclo de una sola vez. Detente cuando quieras y continúa después.",
        ],
      },
      {
        kind: "section",
        heading: "Cambia tus valores personalizados con cuidado",
        paragraphs: [
          "Agregar, editar o quitar un valor personalizado reinicia el emparejamiento de las batallas y borra los historiales de Deshacer y Rehacer. Cada valor que conserves mantiene su progreso. Puedes exportar un respaldo JSON antes de confirmar. Cuando agregas valores, las comparaciones que incluyen valores nuevos se alternan con las comparaciones entre valores existentes mientras queden comparaciones de ambos tipos.",
        ],
      },
      {
        kind: "section",
        heading: "Deshaz los errores",
        paragraphs: [
          "Un toque o un clic basta para elegir. Si eliges la tarjeta equivocada por accidente, o simplemente cambias de opinión, usa Deshacer. Rehacer restaura una elección que deshiciste hasta que hagas una elección nueva.",
        ],
      },
      {
        kind: "section",
        heading: "En qué se diferencia del ejercicio original",
        paragraphs: [
          "El Personal Values Card Sort de 2011 pide ordenar los valores en tres a cinco grupos según su importancia, identificar entre cinco y diez valores centrales y ordenar esos valores seleccionados. A menudo continúa con una entrevista de preguntas abiertas y escucha reflexiva.",
          "WAYVM toma otro camino: compara pares repetidamente en todo tu conjunto de valores activos y conserva un resultado que evoluciona y que puedes consultar otra vez. Es una adaptación, no un reemplazo de la conversación, la ACT, la entrevista motivacional, la terapia ni la atención profesional.",
        ],
      },
      {
        kind: "section",
        heading: "Toma el resultado como una reflexión, no como un veredicto",
        paragraphs: [
          "El juego genera tu clasificación a partir de tus elecciones a lo largo del tiempo. No es un diagnóstico, una calificación moral ni una etiqueta permanente. Las preferencias pueden cambiar, y eso es información útil.",
        ],
      },
      {
        kind: "paragraph",
        text: "No hay una clasificación correcta. Tus valores te pertenecen.",
      },
    ],
  },
  "why-values-matter": {
    id: "why-values-matter",
    title: "Por qué importan los valores",
    accessibleCloseLabel: "Cerrar Por qué importan los valores",
    primaryActionLabel: "Cerrar",
    blocks: [
      {
        kind: "paragraph",
        text: "Los valores son cualidades y direcciones que quieres expresar en tu forma de vivir. No son reglas que tengas que obedecer, virtudes que tengas que demostrar ante otras personas ni metas que completas y tachas de una lista.",
      },
      {
        kind: "paragraph",
        text: "Muchos valores pueden parecer importantes por separado. Familia, Salud, Creatividad, Logro, Aventura, Servicio, Autonomía y Paz interior pueden caber en un mismo grupo amplio de Muy importante o Lo más importante.",
      },
      {
        kind: "paragraph",
        text: "Los grupos amplios pueden ser un punto de partida útil. El Personal Values Card Sort de 2011 va más allá al pedir elegir entre cinco y diez valores centrales y ordenarlos. WAYVM toma otro rumbo: compara pares repetidamente en todo el conjunto de valores activos para que sigan siendo visibles las decisiones entre todos los valores incluidos y los que tú escribas.",
      },
      {
        kind: "paragraph",
        text: "Las comparaciones directas hacen visible el costo de oportunidad. Elegir un valor en lugar de otro no vuelve malo al otro. Simplemente te obliga a hacer una distinción que las categorías amplias pueden ocultar.",
      },
      {
        kind: "paragraph",
        text: "Ninguna lista publicada puede incluir todos los valores que le importan a cada persona. Por eso WAYVM incluye valores personalizados privados sin un límite numérico fijo. Un valor como Ingenio puede ser central para alguien aunque no aparezca en la lista original.",
      },
      {
        kind: "paragraph",
        text: "La privacidad también facilita distinguir entre “valores que apruebo” y “cuáles son realmente mis valores centrales”. No hay un coach, empleador, anunciante, público global ni respuesta moralmente aprobada esperando para juzgar el resultado.",
      },
      {
        kind: "paragraph",
        text: "Repetir esas comparaciones ayuda a distinguir: muchas elecciones pequeñas revelan patrones. Después, tus cinco valores principales sirven como resumen: convierten 103 o más posibilidades en un conjunto breve que puedes recordar, sin dejar de tener disponible la clasificación completa.",
      },
      {
        kind: "paragraph",
        text: "Saber qué te importa más puede ayudarte a notar lo que implica elegir una cosa sobre otra, recordar tus prioridades y elegir acciones que se sientan más tuyas. No vuelve fácil cada decisión, no te dice qué deberías valorar ni garantiza que siempre actuarás de forma coherente.",
      },
      {
        kind: "paragraph",
        text: "WAYVM se inspira en ejercicios para ordenar valores que se usan en la terapia de aceptación y compromiso, o ACT. En la ACT, los valores pueden entenderse como direcciones elegidas para actuar continuamente, no como tareas que se completan una sola vez. WAYVM es un juego de reflexión personal, no es ACT, terapia, diagnóstico ni atención médica.",
      },
      {
        kind: "paragraph",
        text: "Tu resultado puede evolucionar conforme hagas más comparaciones o cambie tu vida. Que la clasificación cambie no es un fracaso. Es otra oportunidad para notar lo que te importa ahora.",
      },
      {
        kind: "paragraph",
        text: "No hay una clasificación correcta. Puedes volver a empezar cuando quieras reiniciando tu progreso en el juego.",
      },
    ],
  },
  "why-i-made-this-game": {
    id: "why-i-made-this-game",
    title: "Por qué hice este juego",
    accessibleCloseLabel: "Cerrar Por qué hice este juego",
    primaryActionLabel: "Cerrar",
    blocks: [
      {
        kind: "paragraph",
        text: "Un coach de productividad con quien trabajé durante unos dos años me hizo una pregunta sencilla: ¿cuáles son tus valores? Me di cuenta de que no lo sabía.",
      },
      {
        kind: "paragraph",
        text: "El ejercicio de valores que tenía entonces me pedía ordenar palabras en grupos amplios según su importancia. Era un punto de partida útil, pero no me obligaba a hacer las comparaciones directas que necesitaba. Todavía era fácil poner cerca de los primeros lugares un valor socialmente admirable porque parecía algo que se suponía que debía valorar.",
      },
      {
        kind: "paragraph",
        text: "Así que construí la primera versión de ¿Cuáles son tus valores, Mapache? en un día. En lugar de quedarme con categorías amplias, comparé los valores directamente. Esas elecciones repetidas me ayudaron a identificar Diversión, Salud, Curiosidad, Ingenio y Creatividad como mis valores centrales.",
      },
      {
        kind: "paragraph",
        text: "Esos cinco valores se han mantenido notablemente estables. Me han ayudado a tomar decisiones, comprenderme y construir una vida que se siente más mía.",
      },
      {
        kind: "paragraph",
        text: "El juego actual conserva los 100 valores del Personal Values Card Sort de 2011, de dominio público, y agrega Ingenio, Destino y Mascotas como valores incluidos creados para WAYVM. Ninguna lista de valores puede estar completa para todas las personas, así que WAYVM también te permite agregar tantos valores personalizados privados como te resulten útiles.",
      },
      {
        kind: "paragraph",
        text: "Reconstruí este juego para que otras personas pudieran tener la misma oportunidad: en privado, gratis y sin que les digan qué deberían valorar.",
      },
      {
        kind: "paragraph",
        text: "El juego no puede decirte cuáles deberían ser tus valores y no hay un resultado moralmente correcto. Solo te da una forma más clara de notar lo que más te importa.",
      },
      { kind: "signature", text: "—Dr. Derek Austin" },
    ],
  },
  "free-resources": {
    id: "free-resources",
    title: "Recursos gratuitos",
    accessibleCloseLabel: "Cerrar Recursos gratuitos",
    primaryActionLabel: "Cerrar",
    blocks: [
      {
        kind: "lead",
        text: "¿Quieres explorar más a fondo los valores, el sentido, la libertad, la acción o la práctica? Puedes acceder gratis a estos recursos independientes.",
      },
      {
        kind: "paragraph",
        text: "WAYVM es un juego de reflexión personal, no es terapia ni asesoría médica. Las organizaciones y los autores que aparecen abajo no avalan ni patrocinan este juego. Estas perspectivas no son intercambiables y su inclusión no implica que una tradición coincida con otra.",
      },
      {
        kind: "paragraph",
        text: "Los enlaces externos requieren acceso a internet y se rigen por las prácticas de privacidad y accesibilidad de cada sitio.",
      },
      {
        kind: "resource",
        title: "En tiempos de estrés, haz lo que importa",
        description:
          "Una guía ilustrada gratuita de la Organización Mundial de la Salud para afrontar la adversidad mediante habilidades prácticas de manejo del estrés, incluida la acción basada en valores.",
        actionLabel: "Abrir recurso de la OMS",
        url: "https://www.who.int/europe/publications/i/item/9789240003910",
      },
      {
        kind: "resource",
        title:
          "Recursos sobre valores de la terapia de aceptación y compromiso",
        description:
          "Explora herramientas independientes para aclarar tus valores e información de la Association for Contextual Behavioral Science.",
        actionLabel: "Abrir recurso de ACT",
        url: "https://contextualscience.org/values_list_interactive_tool",
      },
      {
        kind: "resource",
        title: "Personal Values Card Sort — actualización de 2011",
        description:
          "Consulta la fuente de dominio público de los 100 valores originales y sus definiciones, el procedimiento de tres a cinco grupos, la clasificación final de cinco a diez valores y las tres tarjetas en blanco de “Otro valor” que WAYVM adapta.",
        actionLabel: "Abrir Personal Values Card Sort",
        url: "https://www.guilford.com/add/miller11_old/pers_val.pdf?t=1",
      },
      {
        kind: "resource",
        title: "Instituto Viktor Frankl de Viena",
        description:
          "Encuentra información auténtica sobre Viktor Frankl, la logoterapia, el análisis existencial y el trabajo orientado al sentido.",
        actionLabel: "Visitar el Instituto Viktor Frankl",
        url: "https://www.viktorfrankl.org/institute_agendaE.html",
      },
      {
        kind: "resource",
        title: "Erich Fromm Online",
        description:
          "Explora el sitio oficial sobre la vida y obra de Erich Fromm, incluido material sobre libertad, humanismo, autenticidad y conformidad.",
        actionLabel: "Visitar Erich Fromm Online",
        url: "https://fromm-online.org/en/",
      },
      {
        kind: "resource",
        title: "Bruce Lee Foundation: Jeet Kune Do",
        description:
          "Explora el énfasis de Bruce Lee en la sencillez, la franqueza, la libertad, la expresión personal honesta y el aprendizaje a partir de la experiencia.",
        actionLabel: "Visitar Bruce Lee Foundation",
        url: "https://bruceleefoundation.org/jeetkunedo/",
      },
      {
        kind: "resource",
        title: "El noble óctuple sendero",
        description:
          "Lee la introducción gratuita de Bhikkhu Bodhi al camino budista de comprensión, intención, habla, acción, sustento, esfuerzo, atención plena y concentración.",
        actionLabel: "Leer la guía gratuita",
        url: "https://www.accesstoinsight.org/lib/authors/bodhi/waytoend.html",
      },
      {
        kind: "paragraph",
        text: "Toma lo que te resulte útil, examínalo con cuidado y elige tu siguiente paso.",
      },
    ],
  },
  "credits-privacy": {
    id: "credits-privacy",
    title: "Créditos y privacidad",
    accessibleCloseLabel: "Cerrar Créditos y privacidad",
    primaryActionLabel: "Cerrar",
    blocks: [
      {
        kind: "section",
        heading: "Privado. Sin conexión. Sin cuenta.",
        paragraphs: [
          "Esta aplicación usa el almacenamiento de tu dispositivo para guardar tu progreso, valores personalizados, logros, apariencia del avatar, idioma y configuración, y para funcionar sin conexión. No usa ese almacenamiento para analítica, publicidad ni seguimiento.",
          "WAYVM no tiene cuentas, sincronización en la nube, tablas de clasificación globales, publicidad ni analítica de tus elecciones de juego. La aplicación no nos envía tus comparaciones, valores incluidos o personalizados, definiciones, clasificación, cinco valores principales, logros ni configuración.",
          "El sitio web de producción usa Vercel Web Analytics sin cookies para recopilar datos agregados de visitas a páginas, fuentes de referencia, ubicación aproximada e información del navegador y dispositivo. Las URL de páginas reportadas excluyen los parámetros de consulta y los fragmentos. No se incluye ningún estado del juego y las aplicaciones nativas no cargan este servicio de analítica.",
          "WAYVM no establece cookies de seguimiento ni de publicidad.",
          "Solo se exportan datos cuando tú lo eliges. La exportación JSON crea un respaldo que tú controlas. Si envías un archivo a otra aplicación o servicio, ese destino lo maneja conforme a su propia política de privacidad.",
          "Los enlaces a recursos externos abren sitios fuera de WAYVM. Esos sitios pueden recibir información habitual de las solicitudes web y siguen sus propias prácticas de privacidad.",
          "En su lanzamiento, WAYVM no cifra los datos locales. Alguien con acceso a tu dispositivo desbloqueado o a tu perfil del navegador podría acceder a ellos. Usa las funciones de seguridad de tu dispositivo si esto es importante en tu situación.",
          "Borrar los datos del navegador o del sitio, usar almacenamiento de navegación privada, desinstalar la aplicación o restablecer el dispositivo puede eliminar el progreso local. Exporta un respaldo JSON si quieres una copia portátil.",
          "Reiniciar niveles y experiencia devuelve todos los valores activos al nivel 1 con 0 XP y conserva las definiciones de los valores personalizados, los logros, el idioma y la configuración. Eliminar todos los datos elimina todos los datos de jugador de WAYVM de este dispositivo o perfil del navegador.",
        ],
      },
      {
        kind: "section",
        heading: "Un juego de reflexión, no terapia",
        paragraphs: [
          "WAYVM no es un dispositivo médico, una prueba diagnóstica, un servicio de psicoterapia, un servicio de atención en crisis ni un sustituto de la atención profesional. No determina si un valor es bueno, saludable, moral o correcto.",
        ],
      },
      {
        kind: "section",
        heading: "Creado por el Dr. Derek Austin",
        paragraphs: [
          "¿Cuáles son tus valores, Mapache? es propiedad intelectual de Mapachito Enterprise.",
        ],
      },
      {
        kind: "section",
        heading: "Fuente de los valores",
        paragraphs: [
          "Los 100 valores originales y sus definiciones se adaptaron de la actualización de 2011 del Personal Values Card Sort de William R. Miller, Janet C’de Baca, Daniel B. Matthews y Paula L. Wilbourne, de la Universidad de Nuevo México. El instrumento original indica que es de dominio público y que puede copiarse o adaptarse sin permiso adicional. Ingenio, Destino y Mascotas son tres incorporaciones creadas para WAYVM, no entradas de esa fuente.",
          "La fuente también incluye tres tarjetas en blanco de “Otro valor”, lo que demuestra que su vocabulario impreso es intencionalmente abierto. WAYVM adapta esa apertura mediante valores privados opcionales escritos por quien juega, sin tratar los tres espacios del formato en papel como un límite del producto. Los nombres y las definiciones escritos por quien juega no forman parte del instrumento original ni cuentan con el aval de sus autores.",
        ],
      },
      {
        kind: "section",
        heading: "Influencias intelectuales",
        paragraphs: [
          "WAYVM se inspira en ejercicios para ordenar valores que se usan en la terapia de aceptación y compromiso, y toma ideas sobre el sentido, la libertad, la práctica y la expresión personal honesta. Mencionar la ACT, la Organización Mundial de la Salud, Viktor Frankl, Erich Fromm, Bruce Lee, el budismo o cualquier organización enlazada no implica aval, asociación ni patrocinio.",
        ],
      },
      {
        kind: "section",
        heading: "Indicaciones de controles de juego",
        paragraphs: [
          "Las ilustraciones de las indicaciones de controles son de Kenney, del paquete Input Prompts, y se usan bajo Creative Commons Zero (CC0). El conjunto compartido incluye diseños genéricos y para Xbox, PlayStation, Nintendo, Steam Deck y Steam Controller. Los registros de fuentes y licencias se incluyen en el proyecto.",
        ],
      },
      {
        kind: "resource",
        title: "Kenney Input Prompts",
        description:
          "Ilustraciones de botones de controles, compartidas entre las plataformas de WAYVM.",
        actionLabel: "Visitar Kenney",
        url: "https://kenney.nl/assets/input-prompts",
      },
      {
        kind: "section",
        heading: "Ilustraciones de medallas",
        paragraphs: [
          "Las medallas 3D de oro, plata y bronce son ilustraciones de Microsoft Fluent Emoji, incluidas en WAYVM bajo la licencia MIT. Copyright (c) Microsoft Corporation.",
        ],
      },
      {
        kind: "resource",
        title: "Microsoft Fluent Emoji",
        description:
          "Fuente de los archivos PNG de medallas incluidos en el juego y en las imágenes para compartir.",
        actionLabel: "Ver ilustraciones de medallas",
        url: "https://github.com/microsoft/fluentui-emoji/tree/1ffb34c752ecf5d402f04cfb4b392c77f57c54bc/assets",
      },
      {
        kind: "resource",
        title: "Licencia MIT de Microsoft Fluent Emoji",
        description:
          "Permiso y aviso de derechos de autor de Microsoft para las ilustraciones de medallas. La licencia completa también se incluye en el proyecto.",
        actionLabel: "Leer licencia MIT",
        url: "https://github.com/microsoft/fluentui-emoji/blob/1ffb34c752ecf5d402f04cfb4b392c77f57c54bc/LICENSE",
      },
      {
        kind: "section",
        heading: "Arte y animación de animales",
        paragraphs: [
          "El arte en píxeles y las animaciones de animales son de SeethingSwarm y se usan bajo las licencias correspondientes de los paquetes de animales. Estos recursos comerciales no están cubiertos por la licencia del software de la aplicación. El diseño de la interfaz es del Dr. Derek Austin. La presentación actual del juego es silenciosa. Los avisos completos del software de código abierto están disponibles en los registros de licencias del proyecto.",
        ],
      },
      {
        kind: "resource",
        title: "SeethingSwarm",
        description:
          "Creador del arte en píxeles y las animaciones de animales de WAYVM.",
        actionLabel: "Visitar SeethingSwarm",
        url: "https://seethingswarm.itch.io/",
      },
      {
        kind: "resource",
        title: "Heroes99 de AU_pixel",
        description:
          "Creador del arte y las animaciones del héroe personalizable de WAYVM, utilizados bajo la licencia de Heroes99.",
        actionLabel: "Visitar Heroes99",
        url: "https://au-pixel.itch.io/heroes99",
      },
      {
        kind: "section",
        heading: "Código fuente",
        paragraphs: [
          "El código de la aplicación puede estar disponible bajo la licencia de código abierto que se indica. El arte comercial, las fuentes, la música y otros recursos de terceros conservan sus propias licencias y no se conceden mediante la licencia del código.",
        ],
      },
      {
        kind: "resource",
        title: "Anton de Vernon Adams",
        description:
          "El título web usa Anton como fuente condensada alternativa, bajo la SIL Open Font License 1.1. Derechos de autor 2020: The Anton Project Authors.",
        actionLabel: "Ver Anton",
        url: "https://github.com/googlefonts/AntonFont",
      },
    ],
  },
}
