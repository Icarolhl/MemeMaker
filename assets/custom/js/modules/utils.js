/**
 * Módulo de Utilitários
 */

export function showAlert(message, type = "warning") {
  const alertContainer = document.getElementById("alert-container");
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

export function clearAlerts() {
  const alertContainer = document.getElementById("alert-container");
  if (alertContainer) {
    alertContainer.innerHTML = "";
  }
}
