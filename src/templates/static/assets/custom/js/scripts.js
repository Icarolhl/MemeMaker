document.addEventListener('DOMContentLoaded', () => {
    const imageUpload = document.getElementById('imageUpload');
    const memePreviewArea = document.getElementById('meme-preview-area');
    const memePreviewContainer = document.getElementById('meme-preview-container');
    const customFileLabel = document.querySelector('.custom-file-label');
    const alertContainer = document.getElementById('alert-container');

    /**
     * Exibe um alerta na tela para o usuário.
     */
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

    /**
     * Limpa alertas existentes.
     */
    function clearAlerts() {
        if (alertContainer) {
            alertContainer.innerHTML = '';
        }
    }

    if (imageUpload && memePreviewArea) {
        imageUpload.addEventListener('change', function(event) {
            const file = this.files[0];
            if (file) {
                console.log('Arquivo selecionado:', file.name, 'Tipo:', file.type);
                clearAlerts();

                // Validação RIGOROSA no Frontend
                const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                const fileName = file.name.toLowerCase();
                const hasValidExtension = fileName.endsWith('.jpg') || 
                                         fileName.endsWith('.jpeg') || 
                                         fileName.endsWith('.png') || 
                                         fileName.endsWith('.webp');

                if (!validMimeTypes.includes(file.type) || !hasValidExtension) {
                    console.error('Bloqueado: Arquivo não é uma imagem suportada.');
                    showAlert('<strong>Arquivo não suportado!</strong> Use apenas imagens JPG, PNG ou WEBP. Arquivos PDF ou outros formatos não são permitidos.', 'danger');
                    
                    // Reset total do input
                    this.value = ''; 
                    if (customFileLabel) customFileLabel.textContent = 'Selecionar imagem...';
                    return;
                }

                // Atualiza label
                if (customFileLabel) {
                    customFileLabel.textContent = file.name;
                }

                const reader = new FileReader();
                
                reader.onerror = () => showAlert('Erro ao ler arquivo.', 'danger');

                reader.onload = function(e) {
                    if (memePreviewContainer) {
                        memePreviewContainer.classList.remove('bg-dark', 'text-white');
                        memePreviewContainer.classList.add('bg-light');
                    }

                    // Limpa e insere preview
                    while (memePreviewArea.firstChild) {
                        memePreviewArea.removeChild(memePreviewArea.firstChild);
                    }
                    
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.id = 'preview-image';
                    img.className = 'shadow-lg img-fluid';
                    img.style.display = 'block';
                    img.style.margin = '0 auto';
                    
                    memePreviewArea.appendChild(img);
                };
                
                reader.readAsDataURL(file);
            }
        });
    }
});
