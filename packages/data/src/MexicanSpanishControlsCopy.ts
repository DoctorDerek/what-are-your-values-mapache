import type { InterfaceCopy } from "./EnglishInterfaceCopy"

export const MEXICAN_SPANISH_CONTROLS_COPY: Pick<
  InterfaceCopy,
  | "battleSpeed"
  | "controls"
  | "controlActions"
  | "controlDescriptions"
  | "webControls"
  | "nativeControls"
  | "controller"
  | "controllerBindings"
  | "controllerButtonLabels"
> = {
  battleSpeed: {
    label: "Velocidad de las animaciones de batalla",
    options: [
      {
        value: "1x",
        label: "1×",
        accessibleLabel: "Velocidad de las animaciones de batalla: 1×",
      },
      {
        value: "2x",
        label: "2×",
        accessibleLabel: "Velocidad de las animaciones de batalla: 2×",
      },
      {
        value: "3x",
        label: "3×",
        accessibleLabel: "Velocidad de las animaciones de batalla: 3×",
      },
      {
        value: "skip",
        label: "Omitir",
        accessibleLabel: "Omitir las animaciones de batalla",
      },
    ],
  },
  controls: {
    title: "Controles",
    introduction:
      "Usa estos controles para elegir valores, deshacer elecciones recientes, abrir el menú o detener las batallas. Abrir Controles no cambia tu progreso.",
    semanticActionsHeading: "Acciones",
    bindingsHeading: "Controles disponibles",
    closeAction: "Cerrar",
  },
  controlActions: {
    "select-first-value": "Elegir el primer valor",
    "select-second-value": "Elegir el segundo valor",
    undo: "Deshacer",
    redo: "Rehacer",
    menu: "Menú",
    stop: "Detener",
    "move-focus": "Mover el foco",
    "confirm-focused-value": "Confirmar el valor enfocado",
    back: "Volver",
  },
  controlDescriptions: [
    {
      id: "select-first-value",
      description: "Elige la primera tarjeta de valor.",
    },
    {
      id: "select-second-value",
      description: "Elige la segunda tarjeta de valor.",
    },
    { id: "undo", description: "Deshaz tu elección más reciente." },
    { id: "redo", description: "Restaura la elección que acabas de deshacer." },
    { id: "menu", description: "Abre el menú sin cambiar el par actual." },
    {
      id: "stop",
      description:
        "Detén las batallas. Si cambió tu progreso, revisa tus resultados antes de volver al inicio.",
    },
  ],
  webControls: [
    {
      id: "touch-pointer",
      title: "Pantalla táctil y puntero",
      bindings: [
        {
          actionId: "select-first-value",
          input:
            "Toca la primera tarjeta de valor o haz clic con el botón principal",
        },
        {
          actionId: "select-second-value",
          input:
            "Toca la segunda tarjeta de valor o haz clic con el botón principal",
        },
        { actionId: "undo", input: "Activa Deshacer" },
        { actionId: "redo", input: "Activa Rehacer" },
        { actionId: "menu", input: "Activa Menú" },
        { actionId: "stop", input: "Activa Detener" },
      ],
    },
    {
      id: "keyboard",
      title: "Teclado",
      bindings: [
        { actionId: "select-first-value", input: "1 o A" },
        { actionId: "select-second-value", input: "2 o D" },
        {
          actionId: "move-focus",
          input: "Tab, Shift+Tab o las teclas de flecha",
        },
        {
          actionId: "confirm-focused-value",
          input: "Enter o la barra espaciadora",
        },
        { actionId: "undo", input: "Z, Ctrl+Z o Cmd+Z" },
        { actionId: "redo", input: "Y, Ctrl+Y o Cmd+Shift+Z" },
        { actionId: "menu", input: "Escape" },
        {
          actionId: "stop",
          input: "Activa el control Detener que aparece en pantalla",
        },
      ],
    },
  ],
  nativeControls: [
    {
      id: "touch",
      title: "Pantalla táctil",
      bindings: [
        {
          actionId: "select-first-value",
          input: "Toca la primera tarjeta de valor",
        },
        {
          actionId: "select-second-value",
          input: "Toca la segunda tarjeta de valor",
        },
        { actionId: "undo", input: "Toca Deshacer" },
        { actionId: "redo", input: "Toca Rehacer" },
        { actionId: "menu", input: "Toca Menú" },
        { actionId: "stop", input: "Toca Detener" },
      ],
    },
  ],
  controller: {
    title: "Control de juego",
    introduction:
      "Usa un control de juego con una asignación estándar del navegador. La cruceta o la palanca izquierda mueven el foco; el botón frontal inferior activa el elemento enfocado. En un panel desplazable o una lista de valores con el foco, Arriba y Abajo desplazan el contenido; Izquierda y Derecha vuelven a los controles. En Steam Deck, enfoca un campo de texto y presiona Steam + X para abrir el teclado de Steam mientras Steam esté en ejecución. Los cuadros de archivos del navegador usan los controles del sistema.",
    activate:
      "Presiona un botón del control de juego para ver sus indicaciones.",
    unsupported:
      "Este control de juego no tiene una asignación estándar del navegador. Puedes seguir usando el teclado, el puntero o la pantalla táctil.",
    navigate: "Cruceta o palanca izquierda",
  },
  controllerBindings: [
    {
      command: "select-first-value",
      buttons: [4, 6],
      actionId: "select-first-value",
      input: "Botón superior o gatillo izquierdo",
    },
    {
      command: "select-second-value",
      buttons: [5, 7],
      actionId: "select-second-value",
      input: "Botón superior o gatillo derecho",
    },
    {
      command: "confirm",
      buttons: [0],
      actionId: "confirm-focused-value",
      input: "Botón frontal inferior",
    },
    {
      command: "cancel",
      buttons: [1],
      actionId: "undo",
      input:
        "Botón frontal derecho durante la batalla; Cancelar en otras pantallas",
    },
    {
      command: "redo",
      buttons: [3],
      actionId: "redo",
      input: "Botón frontal superior durante la batalla",
    },
    {
      command: "back",
      buttons: [8],
      actionId: "back",
      input: "View / Share / Minus",
    },
    {
      command: "menu",
      buttons: [9],
      actionId: "menu",
      input: "Start / Menu / Options / Plus",
    },
  ],
  controllerButtonLabels: {
    generic: {
      confirm: "Inferior",
      cancel: "Derecho",
      redo: "Superior",
      "select-first-value": "L1 / L2",
      "select-second-value": "R1 / R2",
      menu: "Menú",
      back: "Volver",
    },
    xbox: {
      confirm: "A",
      cancel: "B",
      redo: "Y",
      "select-first-value": "LB / LT",
      "select-second-value": "RB / RT",
      menu: "Menu",
      back: "View",
    },
    playstation: {
      confirm: "Cruz",
      cancel: "Círculo",
      redo: "Triángulo",
      "select-first-value": "L1 / L2",
      "select-second-value": "R1 / R2",
      menu: "Options",
      back: "Share",
    },
    nintendo: {
      confirm: "B",
      cancel: "A",
      redo: "X",
      "select-first-value": "L / ZL",
      "select-second-value": "R / ZR",
      menu: "+",
      back: "−",
    },
    "steam-deck": {
      confirm: "A",
      cancel: "B",
      redo: "Y",
      "select-first-value": "L1 / L2",
      "select-second-value": "R1 / R2",
      menu: "Options",
      back: "View",
    },
    steam: {
      confirm: "A",
      cancel: "B",
      redo: "Y",
      "select-first-value": "LB / LT",
      "select-second-value": "RB / RT",
      menu: "Start",
      back: "Back",
    },
  },
}
