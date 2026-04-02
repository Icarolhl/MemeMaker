/**
 * Módulo de Desenho (Drawing Mode)
 */
import { canvas } from './canvas.js';

const canvasDrawingActions = document.getElementById("canvasDrawingActions");
const drawColorBtn = document.getElementById("drawColorBtn");
const drawColorPicker = document.getElementById("drawColorPicker");
const toggleDrawBtn = document.getElementById("toggleDrawBtn");

/**
 * Alterna o modo de desenho
 */
export function toggleDrawingMode(forceState = null) {
  if (!canvas) return;
  
  const newState = forceState !== null ? forceState : !canvas.isDrawingMode;
  canvas.isDrawingMode = newState;
  
  if (toggleDrawBtn) {
    if (newState) {
      toggleDrawBtn.classList.add("active");
      canvas.defaultCursor = "crosshair";
      if (canvasDrawingActions) canvasDrawingActions.style.display = "flex";
    } else {
      toggleDrawBtn.classList.remove("active");
      canvas.defaultCursor = "default";
      if (canvasDrawingActions) canvasDrawingActions.style.display = "none";
    }
  }
}

/**
 * Inicializa os handlers de desenho
 */
export function initDrawingHandlers() {
  if (drawColorBtn) {
    drawColorBtn.addEventListener("click", () => {
      if (drawColorPicker) drawColorPicker.click();
    });
  }

  if (drawColorPicker) {
    drawColorPicker.addEventListener("input", (e) => {
      const color = e.target.value;
      if (canvas && canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = color;
      }
      if (drawColorBtn) {
        drawColorBtn.style.background = color;
      }
    });
  }
}
