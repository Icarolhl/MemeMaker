/**
 * Módulo de Espaçamento (Padding)
 */
import { canvas, state, resizeCanvasToImage } from './canvas.js';

let topPaddingRect = null;
let bottomPaddingRect = null;

const paddingFloatingMenu = document.getElementById("padding-floating-menu");
const paddingPositionSelect = document.getElementById("paddingPosition");
const paddingSizeSelect = document.getElementById("paddingSize");
const paddingCustomColorInput = document.getElementById("paddingCustomColor");

/**
 * Gerencia os retângulos físicos de padding no canvas
 */
export function applyPaddingRects() {
  if (!canvas || !canvas.backgroundImage) return;

  const finalWidth = canvas.width;
  const baseHeight = canvas.height - state.currentPaddingTop - state.currentPaddingBottom;

  // Remove retângulos antigos
  if (topPaddingRect) canvas.remove(topPaddingRect);
  if (bottomPaddingRect) canvas.remove(bottomPaddingRect);

  // Superior
  if (state.currentPaddingTop > 0) {
    topPaddingRect = new fabric.Rect({
      left: 0,
      top: 0,
      width: finalWidth,
      height: state.currentPaddingTop,
      fill: state.currentPaddingColor,
      selectable: false,
      evented: false,
      hoverCursor: "default"
    });
    canvas.add(topPaddingRect);
    canvas.sendToBack(topPaddingRect);
  }

  // Inferior
  if (state.currentPaddingBottom > 0) {
    bottomPaddingRect = new fabric.Rect({
      left: 0,
      top: baseHeight + state.currentPaddingTop,
      width: finalWidth,
      height: state.currentPaddingBottom,
      fill: state.currentPaddingColor,
      selectable: false,
      evented: false,
      hoverCursor: "default"
    });
    canvas.add(bottomPaddingRect);
    canvas.sendToBack(bottomPaddingRect);
  }
}

/**
 * Atualiza o padding baseado nos inputs da UI
 */
export function updatePadding() {
  if (!canvas || !canvas.backgroundImage) return;

  const position = paddingPositionSelect.value;
  const size = parseInt(paddingSizeSelect.value) || 0;
  
  const colorTypeInput = document.querySelector('input[name="paddingColorType"]:checked');
  const colorType = colorTypeInput ? colorTypeInput.value : "white";
  const customSwatch = document.querySelector(".swatch-custom");
  
  if (colorType === "white") {
    state.currentPaddingColor = "#ffffff";
  } else if (colorType === "black") {
    state.currentPaddingColor = "#000000";
  } else if (colorType === "gray") {
    state.currentPaddingColor = "#888888";
  } else {
    state.currentPaddingColor = paddingCustomColorInput.value;
    if (customSwatch) customSwatch.style.background = state.currentPaddingColor;
  }

  // Classes dos swatches
  document.querySelectorAll(".color-swatch").forEach(swatch => {
    const inputId = swatch.getAttribute("for");
    const input = document.getElementById(inputId);
    if (input && input.checked) swatch.classList.add("active");
    else swatch.classList.remove("active");
  });

  const oldPaddingTop = state.currentPaddingTop;
  state.currentPaddingTop = (position === "top" || position === "both") ? size : 0;
  state.currentPaddingBottom = (position === "bottom" || position === "both") ? size : 0;

  // Ajusta posição dos objetos
  const diff = state.currentPaddingTop - oldPaddingTop;
  canvas.getObjects().forEach(obj => {
    if (obj.id && obj.id.startsWith("text-box")) {
      obj.set("top", obj.top + diff);
    }
  });

  resizeCanvasToImage();
  applyPaddingRects();
}

export function togglePaddingMenu(e) {
  e.stopPropagation();
  const isVisible = paddingFloatingMenu.style.display === "block";
  paddingFloatingMenu.style.display = isVisible ? "none" : "block";
}

export function closePaddingMenu() {
  paddingFloatingMenu.style.display = "none";
}
