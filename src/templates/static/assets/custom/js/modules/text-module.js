/**
 * Módulo de Gerenciamento de Texto
 */
import { canvas } from './canvas.js';

const textControlsSection = document.getElementById("text-controls-section");
const textBoxesContainer = document.getElementById("text-boxes-container");

/**
 * Adiciona controles de interface para uma caixa de texto
 */
export function addTextBoxControl(textObject) {
  const id = "text-box-" + Date.now() + Math.floor(Math.random() * 1000);
  textObject.id = id;

  if (textControlsSection) {
    textControlsSection.style.display = "block";
  }

  const controlWrapper = document.createElement("div");
  controlWrapper.className = "text-control-item mb-3 p-3 border rounded bg-light";
  controlWrapper.setAttribute("data-id", id);
  controlWrapper.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-2">
      <span class="badge badge-primary">Texto</span>
      <button type="button" class="btn btn-sm btn-link text-danger p-0 remove-text-btn" title="Remover Texto">
        <i class="fas fa-times-circle"></i>
      </button>
    </div>
    <textarea class="form-control form-control-sm text-sync-input" data-id="${id}" rows="2" style="resize: none;">${textObject.text}</textarea>
  `;

  textBoxesContainer.appendChild(controlWrapper);

  const textarea = controlWrapper.querySelector(".text-sync-input");
  const removeBtn = controlWrapper.querySelector(".remove-text-btn");

  textarea.addEventListener("input", (e) => {
    textObject.set("text", e.target.value);
    canvas.renderAll();
  });

  removeBtn.addEventListener("click", () => {
    canvas.remove(textObject);
    controlWrapper.remove();
    updateTextControlsVisibility();
  });
}

export function updateTextControlsVisibility() {
  const textObjects = canvas.getObjects("i-text");
  if (textObjects.length === 0 && textControlsSection) {
    textControlsSection.style.display = "none";
  }
}

export function clearTextSidebar() {
  if (textBoxesContainer) textBoxesContainer.innerHTML = "";
  if (textControlsSection) textControlsSection.style.display = "none";
}

/**
 * Adiciona novo texto ao canvas
 */
export function addTextToCanvas() {
  if (!canvas || !canvas.backgroundImage) return null;

  const text = new fabric.IText("CLIQUE PARA EDITAR", {
    left: canvas.width / 2,
    top: canvas.height / 2,
    fontFamily: "Impact",
    fontSize: 40,
    fontWeight: "bold",
    fill: "#ffffff",
    stroke: "#000000",
    strokeWidth: 1.5,
    strokeUniform: true,
    textAlign: "center",
    originX: "center",
    originY: "center",
    cornerColor: "#007bff",
    cornerSize: 10,
    transparentCorners: false,
    objectCaching: false,
  });

  canvas.add(text);
  addTextBoxControl(text);
  canvas.setActiveObject(text);
  canvas.renderAll();
  return text;
}
