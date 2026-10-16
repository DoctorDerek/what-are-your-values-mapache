import type { InterfaceCopy } from "./EnglishInterfaceCopy"

export const MEXICAN_SPANISH_RECOVERY_COPY: Pick<
  InterfaceCopy,
  | "portability"
  | "recovery"
  | "resets"
  | "resetBackupReady"
  | "runtimeRecovery"
  | "writerConflict"
> = {
  portability: {
    activity: {
      creatingBackup: "Creando respaldo…",
      checkingBackup: "Revisando respaldo…",
      creatingSafetyBackup: "Creando respaldo de seguridad…",
      restoringBackup: "Restaurando respaldo…",
      applyingReset: "Aplicando reinicio…",
      deletingData: "Eliminando datos…",
      creatingDiagnostic: "Creando archivo de diagnóstico…",
    },
    preview: {
      backupCreated: "Respaldo creado",
      sourceApplication: "Aplicación de origen",
      sourceBuild: "Compilación de origen",
      saveSchema: "Esquema de guardado",
      totalComparisons: "Comparaciones totales",
      canonicalCatalog: "Catálogo de valores incluidos",
      includedValues: "Valores incluidos",
      customValues: "Valores personalizados",
      activeValues: "Valores activos",
      currentCycle: "Ciclo actual",
      cyclePairings: "Emparejamientos del ciclo",
      deckRevision: "Revisión del conjunto de valores",
      progressGeneration: "Generación del progreso",
      achievements: "Logros",
      achievementProgressGeneration: "Generación del progreso de logros",
      language: "Idioma",
      replacement: "Reemplazo",
    },
    screenTitle: "Importar y exportar",
    introduction:
      "Tu progreso, valores personalizados, logros, idioma y configuración se guardan en este dispositivo. Exporta un respaldo JSON para conservar una copia portátil o mover tus datos entre aplicaciones de WAYVM compatibles.",
    exportTitle: "Exportar datos",
    exportDescription:
      "Guarda un respaldo JSON con versión de tu progreso, valores personalizados, logros, idioma, configuración y otros datos portátiles de WAYVM. Exportar no nos envía tus datos.",
    exportAction: "Exportar datos",
    exportSuccess: "Tu respaldo de WAYVM está listo.",
    exportFailure:
      "WAYVM no pudo crear un respaldo. Tus datos guardados no cambiaron. Inténtalo de nuevo o revisa el espacio disponible en tu dispositivo.",
    importTitle: "Importar datos",
    importDescription:
      "Elige un respaldo JSON de WAYVM. La aplicación lo validará y te mostrará una vista previa antes de reemplazar los datos de este dispositivo.",
    chooseBackupAction: "Elegir respaldo",
    importPreviewTitle: "Revisar importación",
    importPreviewWarning:
      "Importar este respaldo reemplazará los datos actuales de WAYVM en este dispositivo. Primero se creará un respaldo de seguridad local.",
    importCancelAction: "Cancelar",
    importReplaceAction: "Importar y reemplazar",
    importCancelled: "Se canceló la importación. Tus datos no cambiaron.",
    importSuccess: "Respaldo restaurado. Tu progreso importado está listo.",
    importInvalid:
      "Este archivo no es un respaldo válido de WAYVM. Tus datos no cambiaron.",
    importNewer:
      "Este respaldo se creó con una versión más reciente de WAYVM y no se puede abrir aquí de forma segura. Actualiza la aplicación e inténtalo de nuevo. Tus datos no cambiaron.",
    importUnsupported:
      "Este respaldo usa una versión de formato que WAYVM no puede abrir de forma segura. Tus datos no cambiaron.",
    importUnsafe:
      "Este respaldo es demasiado grande o contiene datos que WAYVM no puede procesar de forma segura. Tus datos no cambiaron.",
    importRestoreFailure:
      "WAYVM no pudo restaurar este respaldo. Tus datos guardados no cambiaron. Inténtalo de nuevo.",
  },
  recovery: {
    loading: "Cargando tus valores…",
    unreadableData: {
      title: "Tus datos guardados necesitan atención",
      body: [
        "WAYVM no pudo cargar de forma segura la partida guardada actual de este dispositivo. No se ha borrado nada.",
        "Puedes restaurar la última partida guardada válida, importar otro respaldo, descargar los datos ilegibles para recuperarlos o elegir Eliminar todos los datos.",
      ],
      restoreConfirmation:
        "¿Restaurar la última partida guardada válida? La partida actual ilegible se conservará hasta que se complete la restauración.",
      restoreReviewTitle: "¿Restaurar la última partida guardada válida?",
      restoreReviewAction: "Restaurar partida",
      selectedBackupConfirmation:
        "¿Importar este respaldo? La partida actual ilegible se conservará hasta que se complete el reemplazo.",
      selectedBackupReviewTitle: "Revisar importación",
      selectedBackupReviewAction: "Importar y reemplazar",
      restoreSuccess: "Se restauró la última partida guardada válida.",
      selectedBackupSuccess:
        "Tu respaldo reemplazó los datos locales ilegibles.",
      noKnownGoodSave:
        "No hay una última partida guardada válida disponible. Puedes importar un respaldo, exportar los datos ilegibles o elegir Eliminar todos los datos.",
      diagnosticReady:
        "Tus datos locales ilegibles están listos en un archivo de diagnóstico para su recuperación.",
    },
    storageUnavailable: {
      title: "No se puede guardar el progreso de forma confiable",
      body: "Por ahora, WAYVM no puede escribir en el almacenamiento del dispositivo. Mantén esta pantalla abierta mientras exportas un respaldo o liberas espacio. Continuar sin un guardado confiable podría hacerte perder progreso nuevo.",
      currentBackupReady: "El respaldo de tus datos actuales está listo.",
      pendingBackupReady:
        "El respaldo de tus datos de jugador pendientes está listo.",
    },
    pendingSave: {
      title: "Error de guardado local",
      body: "Tu cambio pendiente se conserva, pero no se ha guardado. Mantén esta pantalla abierta mientras reintentas el guardado o exportas un respaldo.",
      retry: "Reintentar guardado",
      export: "Exportar datos pendientes",
    },
    actions: {
      restoreLastKnownGoodSave: "Restaurar la última partida guardada válida",
      importBackup: "Importar respaldo",
      exportUnreadableData: "Exportar datos ilegibles",
      deleteAllData: "Eliminar todos los datos",
      exportCurrentData: "Exportar datos actuales",
      tryAgain: "Intentar de nuevo",
      returnWithoutNewChanges: "Volver sin los cambios nuevos",
    },
  },
  resets: {
    "delete-all-custom-values": {
      actionLabel: "Eliminar todos los valores personalizados",
      summary:
        "Elimina todos los valores personalizados y conserva el progreso de los valores incluidos, los logros y la configuración.",
      confirmationTitle: "¿Eliminar todos los valores personalizados?",
      confirmationBody: [
        "Esto elimina permanentemente todos los valores personalizados, su XP, nivel y contadores de victorias y derrotas, y los quita de las batallas futuras.",
        "Conserva los 103 valores incluidos y su progreso, los logros y su progreso acumulado, el idioma, la configuración de accesibilidad, los controles, la personalización del avatar y las demás preferencias.",
        "Tus batallas vuelven a los 103 valores incluidos. El emparejamiento de las batallas se reinicia y los historiales de Deshacer y Rehacer se borran.",
        "Una vez que confirmes, no se puede deshacer. Exporta tus datos primero si podrías necesitarlos después.",
      ],
      successAnnouncement:
        "Se eliminaron todos los valores personalizados. Tus valores incluidos conservaron su progreso. Se conservaron los logros y la configuración.",
    },
    "reset-levels-and-experience": {
      actionLabel: "Reiniciar niveles y experiencia",
      summary:
        "Devuelve todos los valores activos al nivel 1 con 0 XP y conserva los valores personalizados, los logros y la configuración.",
      confirmationTitle: "¿Reiniciar los niveles y la experiencia?",
      confirmationBody: [
        "Esto devuelve todos los valores activos al nivel 1 con 0 XP, borra sus contadores de victorias y derrotas, reinicia el ciclo actual de pares y borra los historiales de Deshacer y Rehacer.",
        "La clasificación de tus valores vuelve a empezar con todos los valores empatados.",
        "Conserva las definiciones de tus valores personalizados, los logros y su progreso acumulado, el idioma, la configuración de accesibilidad, los controles, la personalización del avatar y las demás preferencias.",
        "Una vez que confirmes, no se puede deshacer. Exporta tus datos primero si podrías necesitarlos después.",
      ],
      successAnnouncement:
        "Se reiniciaron los niveles y la experiencia. Se conservaron los valores personalizados, los logros y la configuración.",
    },
    "reset-achievements": {
      actionLabel: "Reiniciar logros",
      summary:
        "Borra los logros locales desbloqueados y el progreso exclusivo de logros, y conserva tus valores y su clasificación.",
      confirmationTitle: "¿Reiniciar los logros?",
      confirmationBody: [
        "Esto borra los logros desbloqueados y el progreso exclusivo de logros, incluido el conteo acumulado de batallas que se usa para los logros.",
        "Conserva tus valores incluidos y personalizados, XP, niveles, contadores de victorias y derrotas de los valores, el ciclo actual de pares, los historiales de Deshacer y Rehacer, el idioma, la configuración de accesibilidad, los controles, la personalización del avatar y las demás preferencias.",
        "Después del reinicio, los logros requieren progreso nuevo que cumpla sus requisitos. Un logro que ya alcanzaste no se desbloquea otra vez solo por reiniciar los logros. Usa también Reiniciar niveles y experiencia si quieres volver a obtener los logros de nivel desde el principio.",
        "Una vez que confirmes, no se puede deshacer. Exporta tus datos primero si podrías necesitarlos después.",
      ],
      successAnnouncement:
        "Se reiniciaron los logros y su progreso. Se conservaron tus valores, su clasificación y tu configuración.",
    },
    "delete-all-data": {
      actionLabel: "Eliminar todos los datos",
      summary:
        "Elimina todos los datos de jugador de WAYVM de este dispositivo o perfil del navegador y vuelve a la introducción.",
      confirmationTitle: "¿Eliminar todos los datos?",
      confirmationBody: [
        "Esto elimina permanentemente todos los datos de jugador de WAYVM de este dispositivo o perfil del navegador, incluidos los niveles, la experiencia, los valores personalizados, los logros, el emparejamiento de las batallas, los historiales de Deshacer y Rehacer, el idioma, la configuración, los respaldos locales y las asignaciones de controles.",
        "Volverás a la introducción. Esto no desinstala la aplicación ni elimina los archivos del programa necesarios para abrirlo sin conexión. No se puede deshacer. Exporta tus datos primero si podrías necesitarlos después.",
      ],
      successAnnouncement:
        "Se eliminaron todos los datos locales de jugador de WAYVM.",
    },
  },
  resetBackupReady:
    "Tu respaldo privado está listo. Revisa el reinicio cuando quieras.",
  runtimeRecovery: {
    title: "Volvamos a tu juego",
    renderDetail:
      "Esta pantalla tuvo un problema. Intenta mostrarla otra vez sin borrar tus datos guardados.",
    actorDetail:
      "La sesión de juego se detuvo de forma inesperada. Puedes exportar un respaldo antes de volver a abrir tu perfil guardado.",
    startupDetail:
      "No se pudo abrir el juego. Inténtalo de nuevo. Tus datos guardados no se han borrado.",
    retry: "Intentar de nuevo",
    exportPlayer: "Exportar respaldo del jugador",
    exportStored: "Exportar archivo de recuperación almacenado",
    exportFailed:
      "No se pudo exportar el respaldo. Tus datos no se han borrado. Puedes intentarlo de nuevo.",
    exportReady:
      "Se envió el respaldo a tu dispositivo. Comprueba que tienes el archivo antes de salir.",
    exporting: "Preparando respaldo…",
    reopen: "Volver a abrir el perfil guardado",
    confirmTitle: "¿Volver a abrir tu perfil guardado?",
    confirmDetail:
      "Esto termina la sesión actual. Los cambios sin guardar no se restaurarán automáticamente. Exporta un respaldo primero si quieres conservarlos. Los datos guardados no se eliminarán.",
    confirm: "Volver a abrir sin los cambios no guardados",
    cancel: "Mantener esta pantalla abierta",
  },
  writerConflict: {
    title: "Hay otra pestaña activa",
    message:
      "Este juego se actualizó en otra pestaña. Carga el progreso más reciente o exporta el estado actual de esta pestaña antes de continuar.",
    loadLatestAction: "Cargar lo más reciente",
    exportThisTabAction: "Exportar esta pestaña",
    cancelAction: "Cancelar",
    reviewOptionsAction: "Revisar opciones",
    exportActivity: "Creando respaldo…",
  },
}
