document.addEventListener('DOMContentLoaded', () => {
    // Elementos da Interface
    const imageUpload = document.getElementById('imageUpload');
    const memeCanvasElement = document.getElementById('meme-canvas');
    const canvasWrapper = document.getElementById('canvas-wrapper');
    const placeholderContent = document.getElementById('placeholder-content');
    const customFileLabel = document.querySelector('.custom-file-label');
    const alertContainer = document.getElementById('alert-container');
    
    // Botões de Ação
    const addTextBtn = document.getElementById('addTextBtn');
    const clearCanvasBtn = document.getElementById('clearCanvasBtn');
    const downloadMemeBtn = document.getElementById('downloadMemeBtn');

    let canvas = null;

    /**
     * Inicializa o Fabric Canvas se ainda não existir
     */
    function initCanvas() {
        // SEMPRE garantir que o placeholder suma e o wrapper apareça ao tentar inicializar
        if (placeholderContent) {
            placeholderContent.classList.add('d-none');
            placeholderContent.style.setProperty('display', 'none', 'important');
        }
        if (canvasWrapper) {
            canvasWrapper.style.display = 'block';
        }

        if (!canvas && memeCanvasElement) {
            canvas = new fabric.Canvas('meme-canvas', {
                preserveObjectStacking: true,
                backgroundColor: 'transparent',
                selection: true
            });
            
            console.log('Fabric Canvas Inicializado');
        }
    }

    /**
     * Ajusta o tamanho do canvas para caber no container mantendo a proporção da imagem
     */
    function resizeCanvasToImage() {
        if (!canvas || !canvas.backgroundImage) return;
        
        const container = document.getElementById('meme-preview-container');
        const maxWidth = container.clientWidth - 20; // Margem de segurança
        const maxHeight = 600;
        
        const img = canvas.backgroundImage;
        let scale = 1;
        
        if (img.width > maxWidth) {
            scale = maxWidth / img.width;
        }
        
        if (img.height * scale > maxHeight) {
            scale = maxHeight / img.height;
        }
        
        canvas.setDimensions({
            width: img.width * scale,
            height: img.height * scale
        });
        
        canvas.setZoom(scale);
        canvas.renderAll();
    }

    function showAlert(message, type = 'warning') {
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
            alertContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    if (imageUpload) {
        imageUpload.addEventListener('change', function(event) {
            const file = this.files[0];
            if (file) {
                const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                if (!validMimeTypes.includes(file.type)) {
                    showAlert('Arquivo não suportado!', 'danger');
                    return;
                }

                if (customFileLabel) {
                    customFileLabel.textContent = file.name;
                }

                const reader = new FileReader();
                reader.onload = function(e) {
                    initCanvas();
                    
                    fabric.Image.fromURL(e.target.result, (img) => {
                        // Limpa objetos anteriores com segurança
                        const objects = canvas.getObjects();
                        canvas.remove(...objects);
                        
                        // Define imagem de fundo
                        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
                            originX: 'left',
                            originY: 'top'
                        });
                        
                        setTimeout(() => resizeCanvasToImage(), 50);
                    });
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (addTextBtn) {
        addTextBtn.addEventListener('click', () => {
            if (!canvas || !canvas.backgroundImage) {
                showAlert('Selecione uma imagem primeiro!');
                return;
            }

            const text = new fabric.IText('CLIQUE PARA EDITAR', {
                left: canvas.width / 2,
                top: canvas.height / 2,
                fontFamily: 'Impact',
                fontSize: 40,
                fill: '#ffffff',
                stroke: '#000000',
                strokeWidth: 2,
                textAlign: 'center',
                originX: 'center',
                originY: 'center',
                selectable: true,
                hasControls: true,
                hasBorders: true
            });

            canvas.add(text);
            canvas.setActiveObject(text);
            canvas.renderAll();
        });
    }

    if (clearCanvasBtn) {
        clearCanvasBtn.addEventListener('click', () => {
            if (canvas) {
                // REMOÇÃO ATÔMICA - Evita congelamento
                const objects = canvas.getObjects();
                canvas.remove(...objects);
                canvas.renderAll();
            }
        });
    }

    if (downloadMemeBtn) {
        downloadMemeBtn.addEventListener('click', () => {
            if (!canvas || !canvas.backgroundImage) {
                showAlert('Não há nada para baixar!');
                return;
            }

            canvas.discardActiveObject();
            canvas.renderAll();

            const dataURL = canvas.toDataURL({
                format: 'png',
                quality: 1,
                multiplier: 1 / canvas.getZoom() // Baixa na resolução original
            });

            const link = document.createElement('a');
            link.download = `meme-${Date.now()}.png`;
            link.href = dataURL;
            link.click();
        });
    }
});
