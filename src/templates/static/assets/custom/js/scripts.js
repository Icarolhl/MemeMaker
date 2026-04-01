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
  const paddingControlsSection = document.getElementById("padding-controls-section");
  const paddingPositionSelect = document.getElementById("paddingPosition");
  const paddingColorTypeRadios = document.getElementsByName("paddingColorType");
  const paddingCustomColorInput = document.getElementById("paddingCustomColor");
  const applyPaddingBtn = document.getElementById("applyPaddingBtn");

  let canvas = null;
  let originalImageWidth = 0;
  let originalImageHeight = 0;
  let currentPaddingTop = 0;
  let currentPaddingBottom = 0;

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
   * Suporta rotação da imagem de fundo.
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

    canvas.setDimensions({
      width: renderWidth * scale,
      height: renderHeight * scale,
    });

    img.scaleX = scale;
    img.scaleY = scale;
    
    // Centraliza a imagem no canvas redimensionado
    img.center();
    canvas.renderAll();
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
      currentPaddingTop = 0;
      currentPaddingBottom = 0;
    });
  }

  if (addPaddingBtn) {
    addPaddingBtn.addEventListener("click", () => {
      if (!canvas || !canvas.backgroundImage) {
        showAlert("Selecione uma imagem primeiro!");
        return;
      }
      const isVisible = paddingControlsSection.style.display === "block";
      paddingControlsSection.style.display = isVisible ? "none" : "block";
      if (!isVisible) {
        paddingControlsSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
  }

  if (paddingColorTypeRadios) {
    paddingColorTypeRadios.forEach((radio) => {
      radio.addEventListener("change", (e) => {
        if (paddingCustomColorInput) {
          paddingCustomColorInput.style.display =
            e.target.value === "custom" ? "inline-block" : "none";
        }
      });
    });
  }

  if (applyPaddingBtn) {
    applyPaddingBtn.addEventListener("click", () => {
      if (!canvas || !canvas.backgroundImage) return;

      const position = paddingPositionSelect.value;
      const size = parseInt(
        document.querySelector('input[name="paddingSize"]:checked').value
      );
      const colorType = document.querySelector(
        'input[name="paddingColorType"]:checked'
      ).value;
      const customColor = paddingCustomColorInput.value;
      const bgColor = colorType === "white" ? "#ffffff" : customColor;

      // Reset para o estado base para evitar acúmulo
      resizeCanvasToImage();

      const baseHeight = canvas.height;
      const objects = canvas.getObjects();
      const bgImg = canvas.backgroundImage;

      let paddingTop = 0;
      let paddingBottom = 0;

      if (position === "top" || position === "both") paddingTop = size;
      if (position === "bottom" || position === "both") paddingBottom = size;

      canvas.setHeight(baseHeight + paddingTop + paddingBottom);
      bgImg.set("top", baseHeight / 2 + paddingTop);

      objects.forEach((obj) => {
        obj.set("top", obj.top + paddingTop);
      });

      canvas.setBackgroundColor(bgColor, canvas.renderAll.bind(canvas));

      currentPaddingTop = paddingTop;
      currentPaddingBottom = paddingBottom;

      showAlert("Espaçamento aplicado!", "success");
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
