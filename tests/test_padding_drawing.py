import os
import re
from pathlib import Path
from typing import TYPE_CHECKING

import pytest
from PIL import Image
from playwright.sync_api import Page, expect

if TYPE_CHECKING:
    from pytest_django.live_server_helper import LiveServer

os.environ["DJANGO_ALLOW_ASYNC_UNSAFE"] = "true"


def handle_create_dummy_image(path: Path) -> None:
    """Cria imagem RGB simples para testes."""
    img = Image.new("RGB", (200, 200), color="blue")
    img.save(path)


@pytest.fixture
def setup_meme_editor(live_server: "LiveServer", page: Page, tmp_path: Path) -> None:
    """Abre o editor e carrega uma imagem de teste."""
    img_path = tmp_path / "test_image.png"
    handle_create_dummy_image(img_path)
    page.goto(live_server.url)
    page.set_input_files("#imageUpload", str(img_path))
    page.wait_for_selector("#editorToolbar", state="visible")
    page.wait_for_timeout(500)


@pytest.mark.usefixtures("setup_meme_editor")
@pytest.mark.django_db
def test_padding_menu_visibility(live_server: "LiveServer", page: Page) -> None:
    """Verifica se o menu de padding abre e fecha corretamente."""
    padding_menu = page.locator("#padding-floating-menu")

    expect(padding_menu).to_be_hidden()
    page.click("#addPaddingBtn")
    expect(padding_menu).to_be_visible()

    page.click("#closePaddingMenu")
    expect(padding_menu).to_be_hidden()


@pytest.mark.usefixtures("setup_meme_editor")
@pytest.mark.django_db
def test_padding_application_instant(live_server: "LiveServer", page: Page) -> None:
    """Verifica se a mudança de padding altera a altura do canvas."""
    canvas = page.locator("#meme-canvas")
    initial_height = int(canvas.get_attribute("height") or 0)

    page.click("#addPaddingBtn")
    page.select_option("#paddingPosition", "top")
    page.wait_for_timeout(300)

    # 80px é o tamanho padrão 'M'
    assert int(canvas.get_attribute("height") or 0) == initial_height + 80

    page.select_option("#paddingPosition", "both")
    page.wait_for_timeout(300)

    assert int(canvas.get_attribute("height") or 0) == initial_height + 160


@pytest.mark.usefixtures("setup_meme_editor")
@pytest.mark.django_db
def test_drawing_mode_color_selector(live_server: "LiveServer", page: Page) -> None:
    """Verifica se o seletor de cor do desenho funciona."""
    draw_btn = page.locator("#toggleDrawBtn")
    draw_actions = page.locator("#canvasDrawingActions")

    draw_btn.click()
    expect(draw_actions).to_be_visible()
    expect(draw_btn).to_have_class(re.compile(r".*active.*"))

    page.evaluate("document.getElementById('drawColorPicker').value = '#00ff00'")
    page.dispatch_event("#drawColorPicker", "input")  # type: ignore

    expect(page.locator("#drawColorBtn")).to_have_css(
        "background-color", "rgb(0, 255, 0)"
    )

    draw_btn.click()
    expect(draw_actions).to_be_hidden()


@pytest.mark.usefixtures("setup_meme_editor")
@pytest.mark.django_db
def test_rotation_persists_padding(live_server: "LiveServer", page: Page) -> None:
    """Verifica se o padding é mantido após rotacionar a imagem."""
    canvas = page.locator("#meme-canvas")

    page.click("#addPaddingBtn")
    page.select_option("#paddingPosition", "top")
    page.wait_for_timeout(300)

    # Rotaciona 90 graus
    page.click("#rotateImgBtn")
    page.wait_for_timeout(500)

    # 200px base + 80px top padding
    assert int(canvas.get_attribute("height") or 0) == 280


@pytest.mark.usefixtures("setup_meme_editor")
@pytest.mark.django_db
def test_clear_canvas_preserves_padding(live_server: "LiveServer", page: Page) -> None:
    """Verifica se 'Limpar Tudo' remove o texto mas mantém as margens."""
    canvas = page.locator("#meme-canvas")

    page.click("#addPaddingBtn")
    page.select_option("#paddingPosition", "top")
    page.wait_for_timeout(300)

    h_with_padding = int(canvas.get_attribute("height") or 0)

    page.click("#addTextBtn")
    page.click("#clearCanvasBtn")

    expect(page.locator(".text-control-item")).to_have_count(0)
    assert int(canvas.get_attribute("height") or 0) == h_with_padding


@pytest.mark.usefixtures("setup_meme_editor")
@pytest.mark.django_db
def test_actual_drawing_interaction(live_server: "LiveServer", page: Page) -> None:
    """Simula um traço de desenho para validar coordenadas."""
    draw_btn = page.locator("#toggleDrawBtn")
    draw_btn.click()

    box = page.locator(".upper-canvas").bounding_box()
    if not box:
        pytest.fail("Canvas não encontrado")

    page.mouse.move(box["x"] + 50, box["y"] + 50)
    page.mouse.down()
    page.mouse.move(box["x"] + 100, box["y"] + 100)
    page.mouse.up()

    expect(draw_btn).to_have_class(re.compile(r".*active.*"))


@pytest.mark.usefixtures("setup_meme_editor")
@pytest.mark.django_db
def test_rotation_reapplies_padding_rects(
    live_server: "LiveServer", page: Page
) -> None:
    """Verifica se as margens físicas são recriadas após rotação."""
    page.click("#addPaddingBtn")
    page.select_option("#paddingPosition", "both")
    page.wait_for_timeout(300)

    page.click("#rotateImgBtn")
    page.wait_for_timeout(500)

    # 200px base + 160px padding
    assert int(page.locator("#meme-canvas").get_attribute("height") or 0) == 360
