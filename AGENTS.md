# Guía del proyecto (para el asistente de código)

## Comunicación y reporte de avances (REGLA PRINCIPAL - ahorro de tokens)
- NO mostrar en las respuestas el código que se modifica ni se agrega: nada de snippets, diffs, archivos completos ni explicaciones línea por línea.
- El avance de cada modificación se reporta SOLO en la consola con barras de progreso hechas con caracteres, por ejemplo:
  `[██████████░░░░░░░░░░░░] 50% – editando simulador-financiero.page.ts`
- Al terminar cada archivo o subtarea, imprimir su barra al 100%.
- Respuestas finales: lo más breves posibles (1-3 líneas), solo confirmando qué se hizo y cómo verificarlo.
- No repetir en texto lo que ya muestran las barras.

## Stack y comandos
- Ionic 8 + Angular + Capacitor 7 (APK Android). Máscaras numéricas con Maskito (coma decimal, punto de miles).
- Build: `npm run build` · Lint: `npm run lint` · Tests: `npm test`
- Regenerar APK: `npm run build && npx cap sync android` y compilar en Android Studio.

## Convenciones
- Idioma: español en UI y mensajes al usuario.
- Inputs de importes: `type="text"` + `inputmode="decimal"` (campos de solo dígitos: `inputmode="numeric"`). Nunca `type="number"`.
- Parseo de importes: `String(valor).replace(/\./g, '').replace(',', '.')` antes de `Number()`.
