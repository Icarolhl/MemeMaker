/**
 * Módulo de Gerenciamento do Canvas (Core)
 */

export let canvas = null;

// Variáveis de estado exportadas para outros módulos
export const state = {
  currentPaddingTop: 0,
  currentPaddingBottom: 0,
  currentPaddingColor: "#ffffff"
};

/**
 * Inicializa o Fabric Canvas
 */
export function initCanvas(memeCanvasElement) {
  if (!canvas && memeCanvasElement) {
    canvas = new fabric.Canvas(memeCanvasElement, {
      preserveObjectStacking: true,
      backgroundColor: "transparent",
      selection: true,
      enableRetinaScaling: true,
      imageSmoothingEnabled: true,
    });

    // Configuração básica do pincel
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.width = 5;
    canvas.freeDrawingBrush.color = "#ff0000";
  }
  return canvas;
}

/**
 * Ajusta o tamanho do canvas e escala a imagem de fundo.
 * Mantém o padding persistente.
 */
export function resizeCanvasToImage() {
  if (!canvas || !canvas.backgroundImage) return;

  const container = document.getElementById("meme-preview-container");
  const maxWidth = container.clientWidth - 80; // Mais margem interna
  const maxHeight = 800; // Limite de altura para não quebrar o layout

  const img = canvas.backgroundImage;
  const angle = img.angle || 0;
  
  // Dimensões considerando a rotação
  const isVertical = angle === 90 || angle === 270 || angle === -90 || angle === -270;
  const renderWidth = isVertical ? img.height : img.width;
  const renderHeight = isVertical ? img.width : img.height;

  let scale = 1;
  if (renderWidth > maxWidth) {
    scale = maxWidth / renderWidth;
  }
  if (renderHeight * scale > maxHeight) {
    scale = maxHeight / renderHeight;
  }

  const finalWidth = renderWidth * scale;
  const baseHeight = renderHeight * scale;
  const finalHeight = baseHeight + state.currentPaddingTop + state.currentPaddingBottom;

  // Aplica dimensões com padding
  canvas.setDimensions({
    width: finalWidth,
    height: finalHeight,
  });

  // Ajusta o wrapper para ter o tamanho EXATO do canvas (remove sobras de quadriculado)
  const wrapper = document.getElementById("canvas-wrapper");
  if (wrapper) {
    wrapper.style.width = `${finalWidth}px`;
    wrapper.style.height = `${finalHeight}px`;
  }

  img.scaleX = scale;
  img.scaleY = scale;
  
  // Centraliza a imagem no canvas e ajusta verticalmente pelo padding
  img.center();
  img.set("top", (baseHeight / 2) + state.currentPaddingTop);

  // O fundo do canvas deve ser sempre transparente
  canvas.setBackgroundColor("transparent", canvas.renderAll.bind(canvas));
  
  // RECALCULA OFFSETS: Essencial para que o modo desenho funcione após mudanças de layout
  canvas.calcOffset();
  
  canvas.renderAll();
}

/**
 * Limpa o estado do padding
 */
export function resetPaddingState() {
  state.currentPaddingTop = 0;
  state.currentPaddingBottom = 0;
}
