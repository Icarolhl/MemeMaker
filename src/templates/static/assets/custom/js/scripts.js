document.addEventListener("DOMContentLoaded", () => {
  const imageUpload = document.getElementById("imageUpload");
  const memePreviewArea = document.getElementById("meme-preview-area");
  const memePreviewContainer = document.getElementById(
    "meme-preview-container",
  );
  const customFileLabel = document.querySelector(".custom-file-label");

  if (imageUpload && memePreviewArea) {
    imageUpload.addEventListener("change", function (event) {
      const file = this.files[0];
      if (file) {
        // Atualiza o texto do label do Bootstrap
        if (customFileLabel) {
          customFileLabel.textContent = file.name;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
          // Remove o fundo escuro do container
          if (memePreviewContainer) {
            memePreviewContainer.classList.remove("bg-dark", "text-white");
            memePreviewContainer.classList.add("bg-light");
          }

          // LIMPEZA TOTAL: Remove o placeholder
          while (memePreviewArea.firstChild) {
            memePreviewArea.removeChild(memePreviewArea.firstChild);
          }

          // Cria o elemento de imagem em TAMANHO REAL
          const img = document.createElement("img");
          img.src = e.target.result;
          img.id = "preview-image";
          img.className = "shadow-lg";
          img.style.display = "block";

          // Insere a imagem
          memePreviewArea.appendChild(img);
        };
        reader.readAsDataURL(file);
      }
    });
  }
});
