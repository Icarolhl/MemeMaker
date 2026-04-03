import os
import re
from pathlib import Path
from typing import TYPE_CHECKING

import pytest
from PIL import Image
from playwright.sync_api import Page, expect

if TYPE_CHECKING:
    from pytest_django.live_server_helper import LiveServer

# Habilita operações síncronas em contexto assíncrono para o Playwright + Django
os.environ["DJANGO_ALLOW_ASYNC_UNSAFE"] = "true"


def handle_create_dummy_image(path: Path) -> None:
    """
    Cria uma imagem simples para testes.

    Args:
        path: Caminho para salvar a imagem dummy.
    """
    img = Image.new("RGB", (200, 200), color="blue")
    img.save(path)


@pytest.fixture
def setup_meme_editor(
    live_server: "LiveServer", page: Page, tmp_path: Path
) -> None:
    """Abre a página e carrega uma imagem de teste."""
    img_path = tmp_path / "test_image.png"
    handle_create_dummy_image(img_path)
    page.goto(live_server.url)
    page.set_input_files("#imageUpload", str(img_path))

    # Aguarda a toolbar aparecer e a imagem processar
    page.wait_for_selector("#editorToolbar", state="visible")
    # Pequena espera extra para garantir que o Fabric.js terminou o resize
    page.wait_for_timeout(500)


@pytest.mark.usefixtures("setup_meme_editor")
@pytest.mark.django_db
def test_padding_menu_visibility(live_server: "LiveServer", page: Page) -> None:
    """Verifica se o menu de padding abre e fecha corretamente."""
    padding_btn = page.locator("#addPaddingBtn")
    padding_menu = page.locator("#padding-floating-menu")

    expect(padding_menu).to_be_hidden()
    padding_btn.click()
    expect(padding_menu).to_be_visible()

    # Fecha o menu
    page.click("#closePaddingMenu")
    expect(padding_menu).to_be_hidden()


@pytest.mark.usefixtures("setup_meme_editor")
@pytest.mark.django_db
def test_padding_application_instant(
    live_server: "LiveServer", page: Page
) -> None:
    """Verifica se a mudança de padding altera a altura do canvas no DOM."""
    # Pega altura inicial do canvas via atributo HTML
    canvas = page.locator("#meme-canvas")
    initial_height = int(canvas.get_attribute("height") or 0)

    # Abre o menu
    page.click("#addPaddingBtn")

    # Seleciona posição 'Topo' (tamanho médio padrão é 80)
    page.select_option("#paddingPosition", "top")
    page.wait_for_timeout(300)  # Aguarda renderização do Fabric.js

    new_height = int(canvas.get_attribute("height") or 0)
    assert new_height == initial_height + 80

    # Muda para posição 'Ambas' (80 + 80 = 160)
    page.select_option("#paddingPosition", "both")
    page.wait_for_timeout(300)

    new_height_both = int(canvas.get_attribute("height") or 0)
    assert new_height_both == initial_height + 160


@pytest.mark.usefixtures("setup_meme_editor")
@pytest.mark.django_db
def test_drawing_mode_color_selector(
    live_server: "LiveServer", page: Page
) -> None:
    """Verifica se o seletor de cor do desenho aparece corretamente."""
    draw_btn = page.locator("#toggleDrawBtn")
    draw_actions = page.locator("#canvasDrawingActions")

    # Garante que começa escondido
    expect(draw_actions).to_be_hidden()

    # Ativa Modo Desenho
    draw_btn.click()
    expect(draw_actions).to_be_visible()
    expect(draw_btn).to_have_class(re.compile(r".*active.*"))

    # Muda a cor via picker
    page.evaluate("document.getElementById('drawColorPicker').value = '#00ff00'")
    page.dispatch_event("#drawColorPicker", "input")  # type: ignore

    # Verifica se o botão de preview da cor assumiu a cor correta
    expect(page.locator("#drawColorBtn")).to_have_css(
        "background-color", "rgb(0, 255, 0)"
    )

    # Desativa Modo Desenho
    draw_btn.click()
    expect(draw_actions).to_be_hidden()


@pytest.mark.usefixtures("setup_meme_editor")
@pytest.mark.django_db
def test_rotation_persists_padding(
    live_server: "LiveServer", page: Page
) -> None:
    """Verifica se o padding no DOM é mantido após rotacionar a imagem."""
    canvas = page.locator("#meme-canvas")

    # Configura padding
    page.click("#addPaddingBtn")
    page.select_option("#paddingPosition", "top")
    page.wait_for_timeout(300)

    # Rotaciona 90 graus
    page.click("#rotateImgBtn")
    page.wait_for_timeout(500)

    # Verifica persistência (Imagem 200x200 + 80 padding top)
    current_height = int(canvas.get_attribute("height") or 0)
    assert current_height == 280

