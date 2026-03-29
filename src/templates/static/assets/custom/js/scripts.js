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

  // Botões de Ação
  const addTextBtn = document.getElementById("addTextBtn");
  const clearCanvasBtn = document.getElementById("clearCanvasBtn");
  const downloadMemeBtn = document.getElementById("downloadMemeBtn");

  let canvas = null;

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
    }

    if (!canvas && memeCanvasElement) {
      canvas = new fabric.Canvas("meme-canvas", {
        preserveObjectStacking: true,
        backgroundColor: "transparent",
        selection: true,
        enableRetinaScaling: true, // Ativa suporte a telas high-DPI
        imageSmoothingEnabled: true,
      });

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

    // Sincroniza textarea -> canvas
    textarea.addEventListener("input", (e) => {
      textObject.set("text", e.target.value);
      canvas.renderAll();
    });

    // Remove texto
    removeBtn.addEventListener("click", () => {
      canvas.remove(textObject);
      controlWrapper.remove();
      updateTextControlsVisibility();
    });
  }

  /**
   * Atualiza a visibilidade da seção de controles de texto
   */
  function updateTextControlsVisibility() {
    const textObjects = canvas.getObjects("i-text");
    if (textObjects.length === 0 && textControlsSection) {
      textControlsSection.style.display = "none";
    }
  }

  /**
   * Ajusta o tamanho do canvas e escala a imagem de fundo para caber no container.
   * EVITA setZoom para manter o texto nítido.
   */
  function resizeCanvasToImage() {
    if (!canvas || !canvas.backgroundImage) return;

    const container = document.getElementById("meme-preview-container");
    const maxWidth = container.clientWidth - 20;
    const maxHeight = 1200;

    const img = canvas.backgroundImage;
    let scale = 1;

    if (img.width > maxWidth) {
      scale = maxWidth / img.width;
    }

    if (img.height * scale > maxHeight) {
      scale = maxHeight / img.height;
    }

    // Redimensiona o canvas físico
    canvas.setDimensions({
      width: img.width * scale,
      height: img.height * scale,
    });

    // Escala apenas a imagem, NÃO o zoom global do canvas
    img.scaleX = scale;
    img.scaleY = scale;

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
        const validMimeTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/webp",
        ];
        if (!validMimeTypes.includes(file.type)) {
          showAlert("Arquivo não suportado!", "danger");
          this.value = "";
          if (customFileLabel)
            customFileLabel.textContent = "Selecionar imagem...";
          return;
        }

        clearAlerts();

        if (customFileLabel) {
          customFileLabel.textContent = file.name;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
          initCanvas();

          fabric.Image.fromURL(e.target.result, (img) => {
            const objects = canvas.getObjects();
            canvas.remove(...objects);

            // Limpa controles de texto ao carregar nova imagem
            if (textBoxesContainer) {
              textBoxesContainer.innerHTML = "";
            }
            if (textControlsSection) {
              textControlsSection.style.display = "none";
            }

            canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
              originX: "left",
              originY: "top",
            });

            // Pequeno delay para garantir que o container renderizou
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

  if (clearCanvasBtn) {
    clearCanvasBtn.addEventListener("click", () => {
      if (canvas) {
        const objects = canvas.getObjects();
        canvas.remove(...objects);
        
        // Limpa controles de texto
        if (textBoxesContainer) {
          textBoxesContainer.innerHTML = "";
        }
        if (textControlsSection) {
          textControlsSection.style.display = "none";
        }
        
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
      canvas.renderAll();

      const img = canvas.backgroundImage;
      const currentScale = img.scaleX;

      // O multiplicador inverte a escala aplicada para o preview,
      // garantindo que o download seja no tamanho original da imagem.
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
