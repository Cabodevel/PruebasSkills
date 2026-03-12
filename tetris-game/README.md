# 🎮 Tetris Game - React Edition

Una implementación completa del clásico juego Tetris construida con **React** y **Vite**.

## 🚀 Características

- ✨ **Juego clásico de Tetris** con todos los 7 tetrominós (I, O, T, S, Z, J, L)
- 🔄 **Rotación de piezas** con mecánica de wall kick (se ajusta automáticamente en paredes)
- ⌨️ **Controles responsivos** con soporte para teclado
- 📊 **Sistema de puntuación** con limpieza de líneas
- ⏸️ **Pausar/Reanudar** el juego en cualquier momento
- 🎨 **Interfaz visual atractiva** con tema oscuro y colores vivos
- 🧪 **Suite de tests integrada** con Playwright
- 🎯 **Canvas-based rendering** para máximo rendimiento

## 🎮 Controles

| Tecla | Acción |
|-------|--------|
| **← →** Arrow Keys | Mover bloque izquierda/derecha |
| **↓** Down Arrow | Bajar bloque lentamente |
| **W** o **↑** Arrow Up | **Rotar bloque** 🎯 |
| **SPACE** | Hard drop (caída instantánea) |
| **P** | Pausar/Reanudar (desde el menú) |

## 🏃 Instalación y Ejecución

### Requisitos
- Node.js 16+
- npm

### Pasos

```bash
# 1. Navegar al directorio del proyecto
cd tetris-game

# 2. Instalar dependencias (si no está hecho)
npm install

# 3. Iniciar servidor de desarrollo
npm run dev

# 4. Abrir en navegador
# http://localhost:5173
```

## 🧪 Tests

Para ejecutar la suite de tests con Playwright:

```bash
# Asegúrate de que el servidor está corriendo (npm run dev en otra terminal)
npm run dev  # Terminal 1

# En otra terminal:
node test-game.mjs  # Terminal 2
```

Los tests verifiean:
- ✅ Botón de inicio funciona
- ✅ Controles de teclado (flechas y espacio)
- ✅ Pausa/Reanudación
- ✅ Reset del juego
- ✅ Función `render_game_to_text` para debugging
- ✅ Toda la interfaz visual

### Resultados de Tests
- **11/11 tests pasados** ✅
- Capturas de pantalla generadas automáticamente en `test-screenshots/`
- Salida JSON disponible en `test-output.json`

## 📁 Estructura del Proyecto

```
tetris-game/
├── src/
│   ├── App.jsx           # Componente raíz
│   ├── App.css           # Estilos de la app
│   ├── Game.jsx          # Lógica principal del juego
│   ├── Game.css          # Estilos del juego
│   ├── main.jsx          # Punto de entrada React
│   └── index.css         # Estilos globales
├── index.html            # HTML raíz
├── vite.config.js        # Configuración de Vite
├── test-game.mjs         # Suite de tests Playwright
├── progress.md           # Historial de progreso
├── package.json
└── node_modules/
```

## 🎯 Cómo Jugar

1. **Haz clic en "START GAME"** para comenzar
2. **Mueve los bloques** con las flechas izquierda/derecha
3. **Acelera la caída** con la flecha abajo
4. **Usa SPACE** para caída instantánea (hard drop)
5. **Completa líneas horizontales** para limpiarlas y ganar puntos
6. **Pausa el juego** con el botón PAUSE en cualquier momento
7. **Game Over** cuando los bloques alcancen la parte superior

## 🔧 Tecnologías Utilizadas

- **React 19.2** - Framework UI
- **Vite 8** - Build tool y dev server
- **Canvas API** - Renderización del juego
- **Playwright** - Testing automatizado
- **CSS 3** - Estilos y animaciones

## 💡 API para Testing

### `window.render_game_to_text()`
Retorna un JSON string con el estado actual del juego:

```json
{
  "mode": "playing",
  "started": true,
  "gameOver": false,
  "paused": false,
  "score": 100,
  "current": {
    "x": 3,
    "y": 5,
    "type": "T"
  },
  "boardRows": 20,
  "boardCols": 10
}
```

### `window.advanceTime(ms)`
Avanza el tiempo del juego de forma determinística para testing.

## 📝 Notas de Desarrollo

- El juego usa un loop determinístico (500ms entre caídas)
- Colisiones y validaciones están optimizadas
- Los tests usan headless Chromium para máxima compatibilidad
- Las capturas de pantalla se generan automáticamente para cada test

## 🎨 Paleta de Colores

| Pieza | Color |
|-------|-------|
| I | Cian (#00F0F0) |
| O | Amarillo (#F0F000) |
| T | Púrpura (#A000F0) |
| S | Verde (#00F000) |
| Z | Rojo (#F00000) |
| J | Azul (#0000F0) |
| L | Naranja (#F0A000) |

## 🐛 Troubleshooting

### El servidor no inicia
```bash
# Limpia node_modules y reinstala
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Los tests fallan
```bash
# Asegúrate de tener Playwright instalado
npx playwright install

# Verifica que el servidor DevChamberlain esté corriendo
npm run dev  # en otra terminal
```

### Canvas no se ve bien
- Intenta actualizar la página (F5)
- Abre las DevTools (F12) para buscar errores en la consola

## 📜 Licencia

Este proyecto es de propósito educativo.

---

¡Disfruta jugando Tetris! 🎮✨
