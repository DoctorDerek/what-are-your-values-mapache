import type { InterfaceCopy } from "./EnglishInterfaceCopy"

export const MEXICAN_SPANISH_CUSTOMIZATION_COPY: Pick<
  InterfaceCopy,
  "customValues" | "customValueValidation" | "dressingRoom" | "heroChoices"
> = {
  customValues: {
    editorTitle: "Agregar valor personalizado",
    example:
      "Por ejemplo: Trabajo bien hecho — hacer las cosas con cuidado y sentir orgullo por hacerlas bien",
    name: "Nombre del valor",
    definition: "Definición",
    addDraft: "Revisar y guardar",
    updateDraft: "Revisar y guardar",
    back: "Cerrar editor",
    drafts: "Valores por agregar",
    another: "Agregar otro",
    continueDraft: "Seguir editando",
    discardUnfinished: "Descartar edición sin terminar",
    draftCount: "pendientes · aún sin guardar",
    review: "Revisar y guardar",
    reviewTitle: "¿Guardar estos valores?",
    consequences:
      "Los valores nuevos empiezan en el nivel 1 con 0 XP. Los valores existentes conservan su progreso. Agregar valores reinicia el emparejamiento de las batallas y borra los historiales de Deshacer y Rehacer. Tu configuración y tus logros no cambian.",
    export: "Exportar datos",
    exporting: "Preparando exportación…",
    apply: "Guardar",
    saving: "Guardando tus valores…",
    saved:
      "Tus valores personalizados se guardaron y ya pueden participar en las batallas.",
    discard: "Descartar valores pendientes",
    unsaved:
      "Aún no se han guardado. Guarda o descarta tus valores pendientes antes de salir.",
    invalid:
      "Corrige los errores señalados en los borradores antes de aplicar los cambios.",
    edit: "Editar",
    remove: "Quitar",
  },
  customValueValidation: {
    name: {
      required: "Escribe un nombre para este valor.",
      too_many_graphemes:
        "Usa un máximo de 60 caracteres para el nombre del valor.",
      prohibited_characters:
        "Quita los caracteres invisibles o de control del nombre del valor.",
      duplicate_name: "Este valor ya existe. Ábrelo en lugar de crear otro.",
    },
    definition: {
      required: "Escribe una definición personal breve para este valor.",
      too_many_graphemes:
        "Usa un máximo de 280 caracteres para la definición personal.",
      prohibited_characters:
        "Quita los caracteres invisibles o de control de la definición personal.",
      duplicate_name: "",
    },
  },
  dressingRoom: {
    preview: "Vista previa de la apariencia",
    category: "Categoría de apariencia",
    character: "Tu personaje de Heroes99",
    choices: (category) => `Opciones de ${category.toLocaleLowerCase("es-MX")}`,
    palette: (category) => `Paleta de ${category.toLocaleLowerCase("es-MX")}`,
    title: "Vestidor",
    customize: "Personalizar mi tarjeta",
    randomize: "Al azar",
    save: "Guardar apariencia",
    cancel: "Cancelar",
    back: "Volver",
    saving: "Guardando apariencia…",
    error: "Error de guardado local",
    errorDetail:
      "Tus cambios de apariencia siguen aquí, pero no se han guardado.",
    retry: "Reintentar guardado",
    editError:
      "No se pudo aplicar ese cambio de apariencia. Tu selección anterior sigue aquí. Prueba otra opción.",
    keepTitle: "¿Conservar tus cambios?",
    saveReturn: "Guardar y volver",
    discard: "Descartar cambios",
    keepEditing: "Seguir editando",
    placeholder: "Vista previa del héroe no disponible",
    loading: "Cargando tu héroe…",
  },
  heroChoices: {
    categories: {
      Skin: "Piel",
      Face: "Rostro",
      Hair: "Cabello",
      Clothing: "Ropa",
      Weapon: "Arma",
    },
    weapons: {
      sword: "Espada",
      spear: "Lanza",
      wand: "Varita",
      axe: "Hacha",
      dagger: "Daga",
    },
    none: "Nada",
    skin: (number) => `Piel ${number}`,
    face: (number) => `Rostro ${number}`,
    style: (number) => `Estilo ${number}`,
    outfit: (number) => `Atuendo ${number}`,
    palette: (number) => `Paleta ${number}`,
  },
}
