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

  // Define o número da camada baseado na quantidade de textos atuais
  const textCount = canvas.getObjects("i-text").length;
  const layerTitle = `Texto ${textCount}`;

  const controlWrapper = document.createElement("div");
  controlWrapper.className = "text-control-item mb-3";
  controlWrapper.setAttribute("data-id", id);
  controlWrapper.innerHTML = `
    <div class="text-layer-header d-flex justify-content-between align-items-center p-2 px-3">
      <div class="d-flex align-items-center">
        <i class="fas fa-grip-vertical text-muted mr-2" style="cursor: grab; font-size: 12px;"></i>
        <span class="text-layer-title">${layerTitle}</span>
      </div>
      <button type="button" class="btn-remove-layer" title="Remover Camada">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="p-2 pt-0">
      <textarea class="form-control text-sync-input" data-id="${id}" rows="2" placeholder="Digite seu texto...">${textObject.text}</textarea>
    </div>
  `;

  textBoxesContainer.appendChild(controlWrapper);

  const textarea = controlWrapper.querySelector(".text-sync-input");
  const removeBtn = controlWrapper.querySelector(".btn-remove-layer");

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

/**
 * Atualiza o valor do textarea na UI quando o texto no canvas muda
 */
export function updateTextUI(textObject) {
  if (!textObject || !textObject.id) return;
  const textarea = textBoxesContainer.querySelector(`textarea[data-id="${textObject.id}"]`);
  if (textarea) {
    textarea.value = textObject.text;
  }
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
