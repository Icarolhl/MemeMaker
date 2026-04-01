document.addEventListener("DOMContentLoaded", () => {
  // Elementos da Interface
  const imageUpload = document.getElementById("imageUpload");
  const memeCanvasElement = document.getElementById("meme-canvas");
  const canvasWrapper = document.getElementById("canvas-wrapper");
  const placeholderContent = document.getElementById("placeholder-content");
  const customFileLabel = document.querySelector(".custom-file-label");
  const alertContainer = document.getElementById("alert-container");
  const textControlsSection = document.getElementById("text-controls-section");
  const textBoxesContainer = document.getElementById("text-boxes-container");

  // Botões de Ação Principais
  const addTextBtn = document.getElementById("addTextBtn");
  const clearCanvasBtn = document.getElementById("clearCanvasBtn");
  const downloadMemeBtn = document.getElementById("downloadMemeBtn");

  // Botões de Ações Rápidas
  const canvasQuickActions = document.getElementById("canvasQuickActions");
  const rotateImgBtn = document.getElementById("rotateImgBtn");
  const addPaddingBtn = document.getElementById("addPaddingBtn");
  const addOverlayBtn = document.getElementById("addOverlayBtn");
  const overlayUpload = document.getElementById("overlayUpload");
  const toggleDrawBtn = document.getElementById("toggleDrawBtn");

  // Controles de Espaçamento (Padding)
  const paddingFloatingMenu = document.getElementById("padding-floating-menu");
  const closePaddingMenu = document.getElementById("closePaddingMenu");
  const paddingPositionSelect = document.getElementById("paddingPosition");
  const paddingSizeSelect = document.getElementById("paddingSize");
  const paddingColorTypeRadios = document.getElementsByName("paddingColorType");
  const paddingCustomColorInput = document.getElementById("paddingCustomColor");

  let canvas = null;
  let currentPaddingTop = 0;
  let currentPaddingBottom = 0;
  let currentPaddingColor = "#ffffff";
  let topPaddingRect = null;
  let bottomPaddingRect = null;

  /**
   * Inicializa o Fabric Canvas
   */
  function initCanvas() {
    if (placeholderContent) {
      placeholderContent.classList.add("d-none");
      placeholderContent.style.setProperty("display", "none", "important");
    }
    if (canvasWrapper) {
      canvasWrapper.style.display = "block";
      canvasWrapper.classList.add("has-image");
    }
    
    // Mostra os botões de ação rápida
    if (canvasQuickActions) {
      canvasQuickActions.classList.add("show");
    }

    if (!canvas && memeCanvasElement) {
      canvas = new fabric.Canvas("meme-canvas", {
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

      // Evento para atualizar textarea quando o texto é editado no canvas
      canvas.on("text:changed", (e) => {
        const obj = e.target;
        if (obj && obj.id) {
          const textarea = document.querySelector(`textarea[data-id="${obj.id}"]`);
          if (textarea) {
            textarea.value = obj.text;
          }
        }
      });

      // Evento para desativar modo desenho ao selecionar objeto
      canvas.on("selection:created", () => {
        if (canvas.isDrawingMode) {
          toggleDrawingMode(false);
        }
      });
    }
  }

  /**
   * Alterna o modo de desenho
   */
  function toggleDrawingMode(forceState = null) {
    if (!canvas) return;
    
    const newState = forceState !== null ? forceState : !canvas.isDrawingMode;
    canvas.isDrawingMode = newState;
    
    if (toggleDrawBtn) {
      if (newState) {
        toggleDrawBtn.classList.add("active");
        canvas.defaultCursor = "crosshair";
      } else {
        toggleDrawBtn.classList.remove("active");
        canvas.defaultCursor = "default";
      }
    }
  }

  /**
   * Adiciona controles de interface para uma caixa de texto
   */
  function addTextBoxControl(textObject) {
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

  function updateTextControlsVisibility() {
    const textObjects = canvas.getObjects("i-text");
    if (textObjects.length === 0 && textControlsSection) {
      textControlsSection.style.display = "none";
    }
  }

  /**
   * Ajusta o tamanho do canvas e escala a imagem de fundo.
   * Aplica padding persistente usando retângulos físicos para preservar transparência.
   */
  function resizeCanvasToImage() {
    if (!canvas || !canvas.backgroundImage) return;

    const container = document.getElementById("meme-preview-container");
    const maxWidth = container.clientWidth - 20;
    const maxHeight = 1200;

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

    // Aplica dimensões com padding
    canvas.setDimensions({
      width: finalWidth,
      height: baseHeight + currentPaddingTop + currentPaddingBottom,
    });

    img.scaleX = scale;
    img.scaleY = scale;
    
    // Centraliza a imagem no canvas e ajusta verticalmente pelo padding
    img.center();
    img.set("top", (baseHeight / 2) + currentPaddingTop);

    // Gerenciamento de Retângulos de Padding para preservar transparência central
    // Remove retângulos antigos se existirem
    if (topPaddingRect) canvas.remove(topPaddingRect);
    if (bottomPaddingRect) canvas.remove(bottomPaddingRect);

    // Cria retângulo superior se houver padding top
    if (currentPaddingTop > 0) {
      topPaddingRect = new fabric.Rect({
        left: 0,
        top: 0,
        width: finalWidth,
        height: currentPaddingTop,
        fill: currentPaddingColor,
        selectable: false,
        evented: false,
        hoverCursor: "default",
        id: "padding-rect-top"
      });
      canvas.add(topPaddingRect);
      canvas.sendToBack(topPaddingRect);
    }

    // Cria retângulo inferior se houver padding bottom
    if (currentPaddingBottom > 0) {
      bottomPaddingRect = new fabric.Rect({
        left: 0,
        top: baseHeight + currentPaddingTop,
        width: finalWidth,
        height: currentPaddingBottom,
        fill: currentPaddingColor,
        selectable: false,
        evented: false,
        hoverCursor: "default",
        id: "padding-rect-bottom"
      });
      canvas.add(bottomPaddingRect);
      canvas.sendToBack(bottomPaddingRect);
    }

    // O fundo do canvas deve ser sempre transparente para respeitar o PNG original
    canvas.setBackgroundColor("transparent", canvas.renderAll.bind(canvas));
    
    canvas.renderAll();
  }

  /**
   * Atualiza o padding instantaneamente
   */
  function updatePadding() {
    if (!canvas || !canvas.backgroundImage) return;

    const position = paddingPositionSelect.value;
    const size = parseInt(paddingSizeSelect.value) || 0;
    
    const colorTypeInput = document.querySelector('input[name="paddingColorType"]:checked');
    const colorType = colorTypeInput ? colorTypeInput.value : "white";
    const customSwatch = document.querySelector(".swatch-custom");
    
    if (colorType === "white") {
        currentPaddingColor = "#ffffff";
    } else if (colorType === "black") {
        currentPaddingColor = "#000000";
    } else if (colorType === "gray") {
        currentPaddingColor = "#888888";
    } else {
        currentPaddingColor = paddingCustomColorInput.value;
        // Atualiza a cor da swatch personalizada
        if (customSwatch) customSwatch.style.background = currentPaddingColor;
    }

    // Atualiza classes ativas nos swatches
    document.querySelectorAll(".color-swatch").forEach(swatch => {
        const inputId = swatch.getAttribute("for");
        const input = document.getElementById(inputId);
        if (input && input.checked) {
            swatch.classList.add("active");
        } else {
            swatch.classList.remove("active");
        }
    });

    const oldPaddingTop = currentPaddingTop;
    
    let paddingTop = 0;
    let paddingBottom = 0;

    if (position === "top" || position === "both") paddingTop = size;
    if (position === "bottom" || position === "both") paddingBottom = size;

    currentPaddingTop = paddingTop;
    currentPaddingBottom = paddingBottom;

    // Reposiciona objetos baseados na mudança do padding superior
    const objects = canvas.getObjects();
    const diff = currentPaddingTop - oldPaddingTop;
    objects.forEach(obj => {
      obj.set("top", obj.top + diff);
    });

    resizeCanvasToImage();
  }

  function showAlert(message, type = "warning") {
    if (alertContainer) {
      alertContainer.innerHTML = `
                <div class="alert alert-${type} alert-dismissible fade show shadow-sm" role="alert">
                    <i class="fas fa-exclamation-triangle mr-2"></i>
                    ${message}
                    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
            `;
      alertContainer.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function clearAlerts() {
    if (alertContainer) {
      alertContainer.innerHTML = "";
    }
  }

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
        if (customFileLabel) customFileLabel.textContent = file.name;

        const reader = new FileReader();
        reader.onload = function (e) {
          initCanvas();
          fabric.Image.fromURL(e.target.result, (img) => {
            canvas.clear();
            currentPaddingTop = 0;
            currentPaddingBottom = 0;
            if (textBoxesContainer) textBoxesContainer.innerHTML = "";
            if (textControlsSection) textControlsSection.style.display = "none";
            toggleDrawingMode(false);

            canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
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

  if (addTextBtn) {
    addTextBtn.addEventListener("click", () => {
      if (!canvas || !canvas.backgroundImage) {
        showAlert("Selecione uma imagem primeiro!");
        return;
      }

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
    });
  }

  // Lógica dos Novos Botões
  if (rotateImgBtn) {
    rotateImgBtn.addEventListener("click", () => {
      if (!canvas || !canvas.backgroundImage) return;
      const img = canvas.backgroundImage;
      img.set("angle", (img.angle + 90) % 360);
      resizeCanvasToImage();
      canvas.renderAll();
    });
  }

  if (addPaddingBtn) {
    addPaddingBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!canvas || !canvas.backgroundImage) {
        showAlert("Selecione uma imagem primeiro!");
        return;
      }
      const isVisible = paddingFloatingMenu.style.display === "block";
      paddingFloatingMenu.style.display = isVisible ? "none" : "block";
    });
  }

  if (closePaddingMenu) {
    closePaddingMenu.addEventListener("click", () => {
      paddingFloatingMenu.style.display = "none";
    });
  }

  // Listeners instantâneos para Padding
  if (paddingPositionSelect) {
    paddingPositionSelect.addEventListener("change", updatePadding);
  }

  if (paddingSizeSelect) {
    paddingSizeSelect.addEventListener("change", updatePadding);
  }

  if (paddingColorTypeRadios) {
    paddingColorTypeRadios.forEach((radio) => {
      radio.addEventListener("change", () => {
        updatePadding();
      });
    });
  }

  if (paddingCustomColorInput) {
    paddingCustomColorInput.addEventListener("input", () => {
      const customRadio = document.getElementById("colorCustom");
      if (customRadio) customRadio.checked = true;
      updatePadding();
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
        this.value = ""; // Reset para permitir carregar a mesma imagem
      }
    });
  }

  if (toggleDrawBtn) {
    toggleDrawBtn.addEventListener("click", () => {
      if (!canvas || !canvas.backgroundImage) {
        showAlert("Selecione uma imagem primeiro!");
        return;
      }
      toggleDrawingMode();
    });
  }

  if (clearCanvasBtn) {
    clearCanvasBtn.addEventListener("click", () => {
      if (canvas) {
        // Remove todos os objetos (textos, imagens sobrepostas, desenhos) 
        // sem afetar a imagem de fundo (backgroundImage)
        const objects = canvas.getObjects();
        canvas.remove(...objects);
        
        // Limpa controles de texto na barra lateral
        if (textBoxesContainer) textBoxesContainer.innerHTML = "";
        if (textControlsSection) textControlsSection.style.display = "none";
        
        // Desativa modo desenho se estiver ativo
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
      const currentScale = img.scaleX;
      const exportMultiplier = 1 / currentScale;

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
});
