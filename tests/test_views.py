import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client
from django.urls import reverse


@pytest.mark.django_db
class TestHomeView:
    """
    Testes para a HomeView do MemeMaker.
    """

    def test_get_home_page(self, client: Client) -> None:
        """
        Testa se a requisição GET para a home retorna status 200
        e usa o template correto.
        """
        url = reverse("home")
        response = client.get(url)
        assert response.status_code == 200
        # Verifica se o template base.html está na lista de templates renderizados
        templates = [t.name for t in response.templates if t.name]
        assert "base.html" in templates

    def test_post_no_image(self, client: Client) -> None:
        """
        Testa se a requisição POST sem imagem retorna erro 400.
        """
        url = reverse("home")
        response = client.post(url)
        assert response.status_code == 400
        assert response.json() == {
            "status": "error",
            "message": "Nenhuma imagem enviada.",
        }

    def test_post_invalid_extension(self, client: Client) -> None:
        """
        Testa se a requisição POST com extensão de arquivo inválida retorna erro 400.
        """
        url = reverse("home")
        file_content = b"fake image content"
        file = SimpleUploadedFile("test.txt", file_content, content_type="text/plain")
        response = client.post(url, {"image": file})
        assert response.status_code == 400
        data = response.json()
        assert data["status"] == "error"
        assert "não suportado" in data["message"]

    @pytest.mark.parametrize("ext", ["jpg", "jpeg", "png", "webp"])
    def test_post_valid_image(self, client: Client, ext: str) -> None:
        """
        Testa se a requisição POST com extensões de imagem válidas retorna sucesso 200.
        """
        url = reverse("home")
        file_name = f"test.{ext}"
        file_content = b"fake image content"
        content_type = f"image/{ext}" if ext != "jpg" else "image/jpeg"
        file = SimpleUploadedFile(file_name, file_content, content_type=content_type)

        response = client.post(url, {"image": file})
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["filename"] == file_name


@pytest.mark.django_db
class TestErrorViews:
    """
    Testes para as views de erro do MemeMaker.
    """

    def test_handler_404(self, client: Client) -> None:
        """
        Testa se uma URL inexistente retorna status 404 e usa o template correto.
        """
        url = "/url-que-nao-existe/"
        response = client.get(url)
        assert response.status_code == 404
        templates = [t.name for t in response.templates if t.name]
        assert "404.html" in templates
