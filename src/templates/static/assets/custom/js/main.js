/**
 * Ponto de Entrada Principal (Main)
 */
import { initCanvas, resizeCanvasToImage, canvas, resetPaddingState } from './modules/canvas.js';
import { addTextToCanvas, clearTextSidebar } from './modules/text-module.js';
import { updatePadding, togglePaddingMenu, closePaddingMenu } from './modules/padding-module.js';
import { toggleDrawingMode, initDrawingHandlers } from './modules/drawing-module.js';
import { showAlert, clearAlerts } from './modules/utils.js';

// Elementos da Interface
const imageUpload = document.getElementById("imageUpload");
const memeCanvasElement = document.getElementById("meme-canvas");
const canvasWrapper = document.getElementById("canvas-wrapper");
const placeholderContent = document.getElementById("placeholder-content");
const fileNameDisplay = document.getElementById("fileName");

// Botões
const addTextBtn = document.getElementById("addTextBtn");
const clearCanvasBtn = document.getElementById("clearCanvasBtn");
const downloadMemeBtn = document.getElementById("downloadMemeBtn");
const rotateImgBtn = document.getElementById("rotateImgBtn");
const addPaddingBtn = document.getElementById("addPaddingBtn");
const closePaddingMenuBtn = document.getElementById("closePaddingMenu");
const toggleDrawBtn = document.getElementById("toggleDrawBtn");
const addOverlayBtn = document.getElementById("addOverlayBtn");
const overlayUpload = document.getElementById("overlayUpload");

// Controles de Padding
const paddingPositionSelect = document.getElementById("paddingPosition");
const paddingSizeSelect = document.getElementById("paddingSize");
const paddingColorTypeRadios = document.getElementsByName("paddingColorType");
const paddingCustomColorInput = document.getElementById("paddingCustomColor");

/**
 * Ativa a UI do Editor
 */
function activateEditorUI() {
  if (placeholderContent) {
    placeholderContent.style.display = "none";
  }
  if (canvasWrapper) {
    canvasWrapper.style.display = "inline-block";
  }
  const editorToolbar = document.getElementById("editorToolbar");
  if (editorToolbar) {
    editorToolbar.classList.remove("d-none");
    editorToolbar.classList.add("d-flex");
  }
}

// --- Listeners de Upload ---
if (imageUpload) {
  imageUpload.addEventListener("change", function (event) {
    const file = this.files[0];
    if (file) {
      const validMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!validMimeTypes.includes(file.type)) {
        showAlert("Arquivo não suportado!", "danger");
        this.value = "";
        return;
      }

      clearAlerts();
      if (fileNameDisplay) fileNameDisplay.textContent = file.name;

      const reader = new FileReader();
      reader.onload = function (e) {
        activateEditorUI();
        const c = initCanvas(memeCanvasElement);
        fabric.Image.fromURL(e.target.result, (img) => {
          c.clear();
          resetPaddingState();
          clearTextSidebar();
          toggleDrawingMode(false);

          c.setBackgroundImage(img, c.renderAll.bind(c), {
            originX: "center",
            originY: "center",
          });

          setTimeout(() => resizeCanvasToImage(), 50);
        });
      };
      reader.readAsDataURL(file);
    }
  });
}

// --- Listeners de Texto ---
if (addTextBtn) {
  addTextBtn.addEventListener("click", () => {
    if (!canvas || !canvas.backgroundImage) {
      showAlert("Selecione uma imagem primeiro!");
      return;
    }
    addTextToCanvas();
  });
}

// --- Listeners de Padding ---
if (addPaddingBtn) addPaddingBtn.addEventListener("click", togglePaddingMenu);
if (closePaddingMenuBtn) closePaddingMenuBtn.addEventListener("click", closePaddingMenu);
if (paddingPositionSelect) paddingPositionSelect.addEventListener("change", updatePadding);
if (paddingSizeSelect) paddingSizeSelect.addEventListener("change", updatePadding);
if (paddingColorTypeRadios) {
  paddingColorTypeRadios.forEach(radio => radio.addEventListener("change", updatePadding));
}
if (paddingCustomColorInput) {
  paddingCustomColorInput.addEventListener("input", () => {
    const customRadio = document.getElementById("colorCustom");
    if (customRadio) customRadio.checked = true;
    updatePadding();
  });
}

// --- Listeners de Desenho ---
if (toggleDrawBtn) {
  toggleDrawBtn.addEventListener("click", () => {
    if (!canvas || !canvas.backgroundImage) {
      showAlert("Selecione uma imagem primeiro!");
      return;
    }
    toggleDrawingMode();
  });
}
initDrawingHandlers();

// --- Outras Ações ---
if (rotateImgBtn) {
  rotateImgBtn.addEventListener("click", () => {
    if (!canvas || !canvas.backgroundImage) return;
    canvas.backgroundImage.set("angle", (canvas.backgroundImage.angle + 90) % 360);
    resizeCanvasToImage();
  });
}

if (addOverlayBtn) {
  addOverlayBtn.addEventListener("click", () => {
    if (!canvas || !canvas.backgroundImage) {
      showAlert("Selecione uma imagem primeiro!");
      return;
    }
    overlayUpload.click();
  });
}

if (overlayUpload) {
  overlayUpload.addEventListener("change", function(e) {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(f) {
        fabric.Image.fromURL(f.target.result, (img) => {
          img.scaleToWidth(canvas.width * 0.4);
          img.set({
            left: canvas.width / 2,
            top: canvas.height / 2,
            originX: "center",
            originY: "center",
            cornerColor: "#28a745",
            cornerSize: 10,
            transparentCorners: false
          });
          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.renderAll();
        });
      };
      reader.readAsDataURL(file);
      this.value = "";
    }
  });
}

if (clearCanvasBtn) {
  clearCanvasBtn.addEventListener("click", () => {
    if (canvas) {
      const objects = canvas.getObjects();
      canvas.remove(...objects);
      clearTextSidebar();
      toggleDrawingMode(false);
      canvas.renderAll();
    }
  });
}

if (downloadMemeBtn) {
  downloadMemeBtn.addEventListener("click", () => {
    if (!canvas || !canvas.backgroundImage) {
      showAlert("Não há nada para baixar!");
      return;
    }
    canvas.discardActiveObject();
    toggleDrawingMode(false);
    canvas.renderAll();

    const img = canvas.backgroundImage;
    const exportMultiplier = 1 / img.scaleX;

    const dataURL = canvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: exportMultiplier,
    });

    const link = document.createElement("a");
    link.download = `meme-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  });
}
