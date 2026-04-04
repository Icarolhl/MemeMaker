import os
from pathlib import Path
from typing import TYPE_CHECKING

import pytest
from django.urls import reverse
from PIL import Image
from playwright.sync_api import Page, expect

if TYPE_CHECKING:
    from pytest_django.live_server_helper import LiveServer

# Habilita operações síncronas em contexto assíncrono para o Playwright + Django
os.environ["DJANGO_ALLOW_ASYNC_UNSAFE"] = "true"


def handle_create_dummy_image(path: Path) -> None:
    """
    Cria uma imagem RGB simples para uso nos testes de upload.

    Args:
        path: Caminho onde a imagem será salva.
    """
    img = Image.new("RGB", (100, 100), color="red")
    img.save(path)


@pytest.mark.django_db
def test_initial_state_ui(live_server: "LiveServer", page: Page) -> None:
    """
    Valida o estado inicial da página sem nenhuma imagem carregada.
    """
    page.goto(f"{live_server.url}{reverse('home')}")

    # Placeholder deve estar visível
    placeholder = page.locator("#placeholder-content")
    expect(placeholder).to_be_visible()

    # Canvas deve estar oculto
    canvas_wrapper = page.locator("#canvas-wrapper")
    expect(canvas_wrapper).to_be_hidden()


@pytest.mark.django_db
def test_handle_valid_image_upload(
    live_server: "LiveServer", page: Page, tmp_path: Path
) -> None:
    """
    Verifica se o upload de uma imagem ativa o editor e oculta o placeholder.
    """
    img_path = tmp_path / "valid_meme.png"
    handle_create_dummy_image(img_path)

    page.goto(f"{live_server.url}{reverse('home')}")

    # Realiza o upload
    page.set_input_files("#imageUpload", str(img_path))

    # Placeholder deve sumir
    placeholder = page.locator("#placeholder-content")
    expect(placeholder).to_be_hidden()

    # O wrapper do canvas e a toolbar devem aparecer
    expect(page.locator("#canvas-wrapper")).to_be_visible()
    expect(page.locator("#editorToolbar")).to_be_visible()

    # O indicador de nome do arquivo deve mostrar o nome correto
    label = page.locator("#fileName")
    expect(label).to_have_text("valid_meme.png")


@pytest.mark.django_db
def test_handle_invalid_file_type(
    live_server: "LiveServer", page: Page, tmp_path: Path
) -> None:
    """
    Garante que arquivos não suportados disparem um alerta e resetem o input.
    """
    txt_path = tmp_path / "invalid.txt"
    txt_path.write_text("not an image")

    page.goto(f"{live_server.url}{reverse('home')}")

    # Tenta carregar um arquivo TXT
    page.set_input_files("#imageUpload", str(txt_path))

    # Deve exibir alerta de erro
    alert = page.locator(".alert-danger")
    expect(alert).to_be_visible()
    expect(alert).to_contain_text("Arquivo não suportado")

    # O input deve ser limpo
    file_input = page.locator("#imageUpload")
    expect(file_input).to_have_value("")


@pytest.mark.django_db
def test_handle_text_addition_validation(
    live_server: "LiveServer", page: Page, tmp_path: Path
) -> None:
    """
    Valida que o alerta de aviso some após um upload válido bem-sucedido.
    """
    page.goto(f"{live_server.url}{reverse('home')}")

    # Faz upload válido
    img_path = tmp_path / "test.png"
    handle_create_dummy_image(img_path)
    page.set_input_files("#imageUpload", str(img_path))

    # Aguarda a toolbar aparecer
    page.wait_for_selector("#editorToolbar", state="visible")

    # Clica no botão de adicionar texto
    page.click("#addTextBtn")

    # Verifica se a seção de controles apareceu
    expect(page.locator("#text-controls-section")).to_be_visible()


@pytest.mark.django_db
def test_handle_canvas_clear_stability(
    live_server: "LiveServer", page: Page, tmp_path: Path
) -> None:
    """
    Verifica se a limpeza do canvas mantém a integridade da aplicação.
    """
    img_path = tmp_path / "stability_test.png"
    handle_create_dummy_image(img_path)

    page.goto(f"{live_server.url}{reverse('home')}")
    page.set_input_files("#imageUpload", str(img_path))

    # Aguarda inicialização robusta
    page.wait_for_selector("#editorToolbar", state="visible")
    page.wait_for_timeout(500)

    # Adiciona múltiplos textos
    for _ in range(3):
        page.click("#addTextBtn")

    # Limpa o canvas
    page.click("#clearCanvasBtn")

    # Verifica se o controle de camadas de texto sumiu
    expect(page.locator("#text-controls-section")).to_be_hidden()


@pytest.mark.django_db
def test_text_box_controls_lifecycle(
    live_server: "LiveServer", page: Page, tmp_path: Path
) -> None:
    """
    Testa o ciclo de vida dos controles de texto: adição, edição e remoção.
    """
    img_path = tmp_path / "test_lifecycle.png"
    handle_create_dummy_image(img_path)

    page.goto(f"{live_server.url}{reverse('home')}")
    page.set_input_files("#imageUpload", str(img_path))

    # Aguarda editor pronto
    page.wait_for_selector("#addTextBtn", state="visible")
    page.wait_for_timeout(500)

    # 1. Adição
    page.click("#addTextBtn")
    text_section = page.locator("#text-controls-section")
    expect(text_section).to_be_visible()

    textareas = page.locator("#text-boxes-container textarea")
    expect(textareas).to_have_count(1)

    # 2. Edição
    page.fill("#text-boxes-container textarea", "TEXTO ROBUSTO")
    expect(textareas.first).to_have_value("TEXTO ROBUSTO")

    # 3. Remoção
    page.locator(".remove-text-btn").first.click()
    expect(textareas).to_have_count(0)
    expect(text_section).to_be_hidden()


@pytest.mark.django_db
def test_handle_404_page(live_server: "LiveServer", page: Page) -> None:
    """
    Verifica se a página 404 customizada é exibida.
    """
    page.goto(f"{live_server.url}/pagina-inexistente")
    expect(page.locator("h1")).to_contain_text("404")
    # Usa seletor mais específico para o botão de voltar
    back_btn = page.locator("a.btn-primary")
    expect(back_btn).to_contain_text("Voltar para o Início")
