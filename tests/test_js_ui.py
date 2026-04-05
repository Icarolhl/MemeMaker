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
    """Cria uma imagem RGB simples para testes."""
    img = Image.new("RGB", (100, 100), color="red")
    img.save(path)


@pytest.mark.django_db
def test_initial_ui_state(live_server: "LiveServer", page: Page) -> None:
    """Valida o estado 'limpo' da aplicação ao carregar."""
    page.goto(f"{live_server.url}{reverse('home')}")

    expect(page.locator("#placeholder-content")).to_be_visible()
    expect(page.locator("#canvas-wrapper")).to_be_hidden()
    expect(page.locator("#editorToolbar")).to_be_hidden()


@pytest.mark.django_db
def test_image_upload_and_canvas_initialization(
    live_server: "LiveServer", page: Page, tmp_path: Path
) -> None:
    """Verifica se o upload ativa o editor e inicializa o canvas com dimensões."""
    img_path = tmp_path / "test.png"
    handle_create_dummy_image(img_path)

    page.goto(f"{live_server.url}{reverse('home')}")
    page.set_input_files("#imageUpload", str(img_path))

    # Verifica transição de visibilidade
    expect(page.locator("#placeholder-content")).to_be_hidden()
    expect(page.locator("#editorToolbar")).to_be_visible()

    # Verifica se the canvas tem dimensões reais
    canvas = page.locator("#meme-canvas")
    width = int(canvas.get_attribute("width") or 0)
    height = int(canvas.get_attribute("height") or 0)
    assert width > 0
    assert height > 0


@pytest.mark.django_db
def test_invalid_upload_error_handling(
    live_server: "LiveServer", page: Page, tmp_path: Path
) -> None:
    """Garante que arquivos inválidos mostram erro e resetem o estado."""
    txt_path = tmp_path / "wrong.txt"
    txt_path.write_text("invalid")

    page.goto(f"{live_server.url}{reverse('home')}")
    page.set_input_files("#imageUpload", str(txt_path))

    expect(page.locator(".alert-danger")).to_contain_text("Arquivo não suportado")
    expect(page.locator("#imageUpload")).to_have_value("")


@pytest.mark.django_db
def test_text_controls_lifecycle_and_sync(
    live_server: "LiveServer", page: Page, tmp_path: Path
) -> None:
    """Valida a criação, edição e remoção de camadas de texto."""
    img_path = tmp_path / "text_test.png"
    handle_create_dummy_image(img_path)

    page.goto(f"{live_server.url}{reverse('home')}")
    page.set_input_files("#imageUpload", str(img_path))
    page.wait_for_selector("#addTextBtn", state="visible")

    # Adição
    page.click("#addTextBtn")
    textarea = page.locator("#text-boxes-container textarea")
    expect(textarea).to_have_count(1)

    # Verifica sincronização na edição
    textarea.fill("EDITADO")
    expect(textarea).to_have_value("EDITADO")

    # Remoção
    page.click(".remove-text-btn")
    expect(textarea).to_have_count(0)
    expect(page.locator("#text-controls-section")).to_be_hidden()


@pytest.mark.django_db
def test_handle_404_error_page(live_server: "LiveServer", page: Page) -> None:
    """Verifica se a página 404 é exibida corretamente."""
    page.goto(f"{live_server.url}/not-found-path")
    expect(page.locator("h1")).to_contain_text("404")
    expect(page.locator("a.btn-primary")).to_be_visible()


@pytest.mark.django_db
def test_rigorous_filename_overflow(
    live_server: "LiveServer", page: Page, tmp_path: Path
) -> None:
    """Valida matematicamente se nomes longos sofrem overflow controlado."""
    long_name = "a" * 100 + ".png"
    img_path = tmp_path / long_name
    handle_create_dummy_image(img_path)

    page.goto(f"{live_server.url}{reverse('home')}")
    page.set_input_files("#imageUpload", str(img_path))

    # Verifica clipping via JS geometry
    overflow_results = page.evaluate("""
        () => {
            const el = document.getElementById('fileName');
            const container = el.closest('.custom-file-upload');
            return {
                isClipped: el.scrollWidth > el.clientWidth,
                isContained: el.offsetWidth <= container.offsetWidth
            };
        }
    """)

    assert overflow_results["isClipped"] is True, "Texto não foi truncado"
    assert overflow_results["isContained"] is True, "Texto vazou do container"
