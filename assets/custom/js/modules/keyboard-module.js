/**
 * Módulo de Atalhos de Teclado
 */
import { canvas } from "./canvas.js";
import { addTextBoxControl } from "./text-module.js";

/**
 * Inicializa os atalhos de teclado
 */
export function initKeyboardShortcuts() {
  window.addEventListener("keydown", (e) => {
    if (!canvas) return;

    // Ignora atalhos se estiver digitando em um input ou textarea (exceto o próprio canvas)
    const activeElement = document.activeElement;
    const isInput =
      activeElement.tagName === "INPUT" ||
      activeElement.tagName === "TEXTAREA" ||
      activeElement.isContentEditable;

    // Verifica se há um objeto de texto em modo de edição no Fabric
    const activeObject = canvas.getActiveObject();
    const isEditingText = activeObject && activeObject.isEditing;

    if (isInput || isEditingText) {
      // Permite Esc para sair do foco
      if (e.key === "Escape") {
        activeElement.blur();
        if (isEditingText) activeObject.exitEditing();
        canvas.discardActiveObject();
        canvas.requestRenderAll();
      }
      return;
    }

    // Atalhos globais
    switch (e.key) {
      case "Delete":
      case "Backspace":
        handleDelete();
        break;

      case "ArrowLeft":
        if (canvas.getActiveObject()) {
          e.preventDefault();
          handleMove("left", e.shiftKey ? -10 : -1);
        }
        break;
      case "ArrowRight":
        if (canvas.getActiveObject()) {
          e.preventDefault();
          handleMove("left", e.shiftKey ? 10 : 1);
        }
        break;
      case "ArrowUp":
        if (canvas.getActiveObject()) {
          e.preventDefault();
          handleMove("top", e.shiftKey ? -10 : -1);
        }
        break;
      case "ArrowDown":
        if (canvas.getActiveObject()) {
          e.preventDefault();
          handleMove("top", e.shiftKey ? 10 : 1);
        }
        break;

      case "a":
      case "A":
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          canvas.discardActiveObject();
          const sel = new fabric.ActiveSelection(canvas.getObjects(), {
            canvas: canvas,
          });
          canvas.setActiveObject(sel);
          canvas.requestRenderAll();
        }
        break;

      case "c":
      case "C":
        if (e.ctrlKey || e.metaKey) {
          handleCopy();
        }
        break;

      case "v":
      case "V":
        if (e.ctrlKey || e.metaKey) {
          handlePaste();
        }
        break;

      case "Escape":
        canvas.discardActiveObject();
        canvas.requestRenderAll();
        break;
    }
  });
}

/**
 * Remove os objetos selecionados
 */
function handleDelete() {
  const activeObjects = canvas.getActiveObjects();
  if (activeObjects.length) {
    canvas.discardActiveObject();
    activeObjects.forEach((obj) => {
      // Não remove a imagem de fundo nem as margens (padding)
      if (!obj.isPadding && obj !== canvas.backgroundImage) {
        canvas.remove(obj);

        // Se for um texto, precisamos limpar a UI lateral
        if (obj.type === "i-text") {
          const control = document.querySelector(
            `.text-control-item[data-id="${obj.id}"]`,
          );
          if (control) control.remove();
        }
      }
    });
    canvas.requestRenderAll();
  }
}

/**
 * Move os objetos selecionados
 */
function handleMove(prop, value) {
  const activeObject = canvas.getActiveObject();
  if (activeObject) {
    activeObject.set(prop, activeObject.get(prop) + value);
    activeObject.setCoords();
    canvas.requestRenderAll();
  }
}

let _clipboard = null;

/**
 * Copia os objetos selecionados para o clipboard interno
 */
function handleCopy() {
  const activeObject = canvas.getActiveObject();
  if (!activeObject) return;

  activeObject.clone((cloned) => {
    _clipboard = cloned;
  });
}

/**
 * Cola os objetos do clipboard interno
 */
function handlePaste() {
  if (!_clipboard) return;

  _clipboard.clone((clonedObj) => {
    canvas.discardActiveObject();
    clonedObj.set({
      left: clonedObj.left + 10,
      top: clonedObj.top + 10,
      evented: true,
    });

    if (clonedObj.type === "activeSelection") {
      // Se for uma seleção múltipla
      clonedObj.canvas = canvas;
      clonedObj.forEachObject((obj) => {
        canvas.add(obj);
        if (obj.type === "i-text") {
          addTextBoxControl(obj);
        }
      });
      clonedObj.setCoords();
    } else {
      canvas.add(clonedObj);
      if (clonedObj.type === "i-text") {
        addTextBoxControl(clonedObj);
      }
    }

    _clipboard.top += 10;
    _clipboard.left += 10;
    canvas.setActiveObject(clonedObj);
    canvas.requestRenderAll();
  });
}
