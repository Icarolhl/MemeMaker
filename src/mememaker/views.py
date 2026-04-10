import os

from django.http import HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import render
from django.views import View


class HomeView(View):
    """
    View principal que gerencia a página inicial e a validação de upload de imagens.
    """

    template_name: str = "base.html"

    def get(self, request: HttpRequest) -> HttpResponse:
        """
        Exibe a página inicial do MemeMaker.
        """
        return render(request, self.template_name)

    def post(self, request: HttpRequest) -> JsonResponse:
        """
        Valida a imagem enviada pelo usuário antes da edição no Canvas.
        Verifica se o arquivo existe e se possui uma extensão suportada
        (JPG, PNG, WEBP).
        """
        image = request.FILES.get("image")

        if not image:
            return JsonResponse(
                {"status": "error", "message": "Nenhuma imagem enviada."}, status=400
            )

        # Validação de Extensão
        ext = os.path.splitext(str(image.name))[1].lower()
        valid_extensions = [".jpg", ".jpeg", ".png", ".webp"]

        if ext not in valid_extensions:
            return JsonResponse(
                {
                    "status": "error",
                    "message": f"Formato {ext} não suportado. Use JPG, PNG ou WEBP.",
                },
                status=400,
            )

        return JsonResponse(
            {
                "status": "success",
                "message": "Imagem validada com sucesso!",
                "filename": str(image.name),
            }
        )


def handler_404(request: HttpRequest, exception: Exception) -> HttpResponse:
    return render(request, "404.html", status=404)
