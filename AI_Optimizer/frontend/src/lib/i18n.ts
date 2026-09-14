export const translations = {
  es: {
    appTitle: "CONSOLA DE ANÁLISIS IA",
    subtitle: "Optimizador de prompts multimodelo con arquitectura Bento",
    engineTag: "Motor: Groq + Gemini + Ollama (Cascada de 3 niveles)",
    promptPlaceholder: "Introduce tu prompt aquí (ej. Hazme una publicación persuasiva sobre inteligencia artificial)...",
    btnAnalyze: "Analizar Prompt",
    btnAnalyzing: "Analizando...",
    btnIterate: "Seguir Mejorando",
    btnAudio: "Escuchar Audio Neural",
    btnAudioPlaying: "Detener Audio",
    btnAudioLoading: "Generando voz...",
    btnTranslate: "Traducir a Inglés",
    btnTranslating: "Traduciendo...",
    btnCopy: "Copiar Prompt",
    btnCopied: "¡Copiado!",
    btnClearHistory: "Limpiar Historial",
    
    // Formatos de salida
    expectedFormat: "Formato de Salida Esperado",
    formatMarkdown: "Markdown",
    formatJson: "JSON",
    formatStructured: "Texto Estructurado",
    formatCode: "Código",
    formatTable: "Tabla",
    formatStructuredLabel: "Estructurado",
    formatCodeLabel: "Código",
    formatTableLabel: "Tabla",
    descMarkdown: "Encabezados, listas y negritas",
    descJson: "Estructura estricta clave-valor",
    descStructured: "Paso a paso numerado",
    descCode: "Script o sintaxis técnica",
    descTable: "Formato tabular comparativo",
    viewFormatted: "Vista Formateada",
    viewRaw: "Código / Raw",
    
    // Gateway status
    gatewayActive: "NestJS Gateway: Activo",
    gatewayDirect: "Python AI: Directo",

    // Counters & details
    charsLabel: "caracteres",
    wordsLabel: "palabras",

    // Audio
    audioTooltip: "Reproducir síntesis de voz neural (Edge-TTS)",
    audioTitle: "Audio",
    audioErrorText: "No se pudo reproducir el audio neural.",
    
    // Bento Tiles Titles
    tilePromptInput: "ENTRADA & ACCIONES",
    tileTokenMetrics: "CONSUMO DE TOKENS (cl100k_base)",
    tileQualityScores: "MÉTRICAS DE CALIDAD",
    tileDiagnostics: "DIAGNÓSTICO ESTRUCTURAL",
    tileOptimized: "PROMPT OPTIMIZADO",
    tileSuggestions: "RECOMENDACIONES DE MEJORA",
    tileHistory: "HISTORIAL DE OPTIMIZACIÓN",

    // Token metrics
    inputTokens: "Tokens Entrada",
    outputTokens: "Tokens Salida",
    totalTokens: "Total Tokens",
    latency: "Latencia",
    noTokensYet: "Tokens disponibles tras el análisis",

    // Token Savings & Efficiency
    tokenSavings: "Ahorro & Eficiencia",
    tokensSaved: "Tokens Ahorrados",
    savingPercentage: "Ahorro Estimado",
    costSavedPer1k: "Ahorro USD / 1k llamadas",
    iterationsAvoided: "Iteraciones Reducidas",
    unoptimizedEstimate: "Tokens sin optimizar (estimado)",
    optimizedCostText: "Ahorro frente a ciclo ambiguo de repreguntas y alucinación.",
    optimizedTokensBadge: "1 llamada precisa",
    avoidedTurnsBadge: "~2 iteraciones evitadas",

    // Prompt Improvement Details
    techniquesApplied: "Técnicas de Prompt Engineering",
    keyImprovements: "Mejoras Estructurales Clave",
    estimatedImpact: "Impacto Estimado",
    nextAction: "Próxima Acción Recomendada",
    criticalPoints: "Puntos Críticos Detectados",

    // Diagnostics
    roleDetected: "Rol detectado",
    promptType: "Tipo de prompt",
    languageDetected: "Idioma detectado",
    flawsDetected: "Deficiencias detectadas",
    noFlaws: "¡Estructura óptima sin fallas críticas!",
    ambiguity: "Ambigüedad",
    lackContext: "Falta de contexto",
    lackObjective: "Falta de objetivo",
    lackConstraints: "Falta de restricciones",

    // Scores
    clarity: "Claridad",
    specificity: "Especificidad",
    objectivity: "Objetividad",
    truthfulness: "Veracidad",
    context: "Contexto",
    coherence: "Coherencia",
    overallQuality: "Calidad General",

    // Prompts and history
    waitingPrompt: "Introduce un prompt y haz clic en Analizar para comenzar la evaluación.",
    emptyHistory: "No hay análisis en el historial todavía.",
    confirmClearTitle: "¿Resetear historial?",
    confirmClearText: "Esta acción borrará todas las evaluaciones almacenadas localmente.",
    confirmClearBtn: "Sí, limpiar",
    cancelBtn: "Cancelar",
    historyCleared: "Historial reiniciado exitosamente",
    copySuccess: "Prompt mejorado copiado al portapapeles",
    transSuccess: "Prompt traducido correctamente",
    iterationLabel: "Iteración",

    // Etiquetas adicionales y alertas
    optimizedTokens: "Tokens Optimizados",
    turnsLabel: "turnos",
    tooltipOptimized: "Tokens consumidos con prompt optimizado",
    tooltipSaved: "Tokens ahorrados por prompt engineering",
    techniquesBadge: "Técnicas",
    historySavingsBadge: "ahorro",
    historyLoadBtn: "Cargar",
    cacheLabel: "Caché Local",
    scoreLabel: "Score",
    emptyFieldTitle: "Campo vacío",
    emptyFieldText: "Por favor ingresa un prompt para evaluar.",
    analysisSuccessToast: "¡Análisis completado con éxito!",
    analysisFailedToast: "Fallo en el análisis",
    transErrorTitle: "Error al traducir",
    transServiceError: "Error en el servicio de traducción",
    understoodBtn: "Entendido",
    langSwitched: "Idioma cambiado a Español",
  },
  en: {
    appTitle: "AI PROMPT ANALYSIS CONSOLE",
    subtitle: "Multi-provider prompt optimizer with Bento design",
    engineTag: "Engine: Groq + Gemini + Ollama (3-Tier Fallback)",
    promptPlaceholder: "Enter your prompt here (e.g., Write a persuasive article about artificial intelligence)...",
    btnAnalyze: "Analyze Prompt",
    btnAnalyzing: "Analyzing...",
    btnIterate: "Refine Further",
    btnAudio: "Listen Neural Audio",
    btnAudioPlaying: "Stop Audio",
    btnAudioLoading: "Generating voice...",
    btnTranslate: "Translate to Spanish",
    btnTranslating: "Translating...",
    btnCopy: "Copy Prompt",
    btnCopied: "Copied!",
    btnClearHistory: "Clear History",

    // Output Formats
    expectedFormat: "Expected Output Format",
    formatMarkdown: "Markdown",
    formatJson: "JSON",
    formatStructured: "Structured Text",
    formatCode: "Code",
    formatTable: "Table",
    formatStructuredLabel: "Structured",
    formatCodeLabel: "Code",
    formatTableLabel: "Table",
    descMarkdown: "Headers, lists and bold styling",
    descJson: "Strict key-value schema",
    descStructured: "Numbered step-by-step guidance",
    descCode: "Technical script or syntax",
    descTable: "Comparative tabular matrix",
    viewFormatted: "Formatted View",
    viewRaw: "Raw / Source",

    // Gateway status
    gatewayActive: "NestJS Gateway: Active",
    gatewayDirect: "Python AI: Direct",

    // Counters & details
    charsLabel: "chars",
    wordsLabel: "words",

    // Audio
    audioTooltip: "Play neural voice synthesis (Edge-TTS)",
    audioTitle: "Audio",
    audioErrorText: "Could not play neural audio.",

    // Bento Tiles Titles
    tilePromptInput: "INPUT & ACTIONS",
    tileTokenMetrics: "TOKEN USAGE (cl100k_base)",
    tileQualityScores: "QUALITY METRICS",
    tileDiagnostics: "STRUCTURAL DIAGNOSTICS",
    tileOptimized: "OPTIMIZED PROMPT",
    tileSuggestions: "ACTIONABLE SUGGESTIONS",
    tileHistory: "OPTIMIZATION HISTORY",

    // Token metrics
    inputTokens: "Input Tokens",
    outputTokens: "Output Tokens",
    totalTokens: "Total Tokens",
    latency: "Latency",
    noTokensYet: "Tokens available after evaluation",

    // Token Savings & Efficiency
    tokenSavings: "Savings & Efficiency",
    tokensSaved: "Tokens Saved",
    savingPercentage: "Estimated Savings",
    costSavedPer1k: "Cost Saved USD / 1k calls",
    iterationsAvoided: "Iterations Avoided",
    unoptimizedEstimate: "Unoptimized tokens (est.)",
    optimizedCostText: "Savings vs multi-turn ambiguous prompting and hallucination.",
    optimizedTokensBadge: "1 precise call",
    avoidedTurnsBadge: "~2 turns saved",

    // Prompt Improvement Details
    techniquesApplied: "Applied Prompt Engineering Techniques",
    keyImprovements: "Key Structural Improvements",
    estimatedImpact: "Estimated Impact",
    nextAction: "Recommended Next Action",
    criticalPoints: "Critical Flaws Detected",

    // Diagnostics
    roleDetected: "Detected Role",
    promptType: "Prompt Type",
    languageDetected: "Detected Language",
    flawsDetected: "Flaws Detected",
    noFlaws: "Optimal structure with no critical flaws!",
    ambiguity: "Ambiguity",
    lackContext: "Lack of Context",
    lackObjective: "Lack of Objective",
    lackConstraints: "Lack of Constraints",

    // Scores
    clarity: "Clarity",
    specificity: "Specificity",
    objectivity: "Objectivity",
    truthfulness: "Truthfulness",
    context: "Context",
    coherence: "Coherence",
    overallQuality: "Overall Quality",

    // Prompts and history
    waitingPrompt: "Enter a prompt and click Analyze to begin the evaluation.",
    emptyHistory: "No analyses in history yet.",
    confirmClearTitle: "Reset history?",
    confirmClearText: "This action will permanently delete all locally stored evaluations.",
    confirmClearBtn: "Yes, clear",
    cancelBtn: "Cancel",
    historyCleared: "History cleared successfully",
    copySuccess: "Optimized prompt copied to clipboard",
    transSuccess: "Prompt translated successfully",
    iterationLabel: "Iteration",

    // Additional labels and alerts
    optimizedTokens: "Optimized Tokens",
    turnsLabel: "turns",
    tooltipOptimized: "Tokens consumed with optimized prompt",
    tooltipSaved: "Tokens saved via prompt engineering",
    techniquesBadge: "Techniques",
    historySavingsBadge: "savings",
    historyLoadBtn: "Load",
    cacheLabel: "Local Cache",
    scoreLabel: "Score",
    emptyFieldTitle: "Empty field",
    emptyFieldText: "Please enter a prompt to evaluate.",
    analysisSuccessToast: "Analysis completed successfully!",
    analysisFailedToast: "Analysis failed",
    transErrorTitle: "Translation error",
    transServiceError: "Error in translation service",
    understoodBtn: "Got it",
    langSwitched: "Language switched to English",
  }
};
