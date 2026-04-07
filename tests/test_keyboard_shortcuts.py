import os
from pathlib import Path
from typing import TYPE_CHECKING

import pytest
from django.urls import reverse
from PIL import Image
from playwright.sync_api import Page, expect

if TYPE_CHECKING:
    from pytest_django.live_server_helper import LiveServer

os.environ["DJANGO_ALLOW_ASYNC_UNSAFE"] = "true"


def handle_create_dummy_image(path: Path) -> None:
    img = Image.new("RGB", (200, 200), color="blue")
    img.save(path)


def setup_canvas_with_image(
    live_server: "LiveServer", page: Page, tmp_path: Path
) -> None:
    img_path = tmp_path / "test_kb.png"
    handle_create_dummy_image(img_path)
    page.goto(f"{live_server.url}{reverse('home')}")
    page.set_input_files("#imageUpload", str(img_path))
    page.wait_for_selector("#addTextBtn", state="visible")


def dispatch_kb_event(
    page: Page, key: str, *, ctrl: bool = False, shift: bool = False
) -> None:
    """Dispara evento diretamente no window."""
    page.evaluate(
        f"""
        window.dispatchEvent(new KeyboardEvent('keydown', {{
            key: '{key}',
            ctrlKey: {str(ctrl).lower()},
            shiftKey: {str(shift).lower()},
            bubbles: true,
            cancelable: true
        }}));
    """
    )


@pytest.mark.django_db
def test_keyboard_delete_object(
    live_server: "LiveServer", page: Page, tmp_path: Path
) -> None:
    """Verifica remoção via Delete."""
    setup_canvas_with_image(live_server, page, tmp_path)
    page.click("#addTextBtn")
    textarea = page.locator("#text-boxes-container textarea")
    expect(textarea).to_have_count(1)

    dispatch_kb_event(page, "Delete")
    expect(textarea).to_have_count(0)


@pytest.mark.django_db
def test_keyboard_move_object(
    live_server: "LiveServer", page: Page, tmp_path: Path
) -> None:
    """Verifica movimento via setas."""
    setup_canvas_with_image(live_server, page, tmp_path)
    page.click("#addTextBtn")

    # Foco no canvas e seleção
    page.click("#meme-canvas", force=True)
    page.evaluate(
        """
        () => {
            const container = document.querySelector('.canvas-container');
            const canvas = container.fabricCanvas;
            const obj = canvas.getObjects('i-text')[0];
            canvas.setActiveObject(obj);
            canvas.requestRenderAll();
        }
    """
    )

    initial_pos = page.evaluate(
        """
        () => {
            const container = document.querySelector('.canvas-container');
            const obj = container.fabricCanvas.getActiveObject();
            return { left: obj.left, top: obj.top };
        }
    """
    )

    # Native press para movimento (mais confiável para setas em alguns browsers)
    page.keyboard.press("ArrowRight")
    page.keyboard.down("Shift")
    page.keyboard.press("ArrowDown")
    page.keyboard.up("Shift")

    new_pos = page.evaluate(
        """
        () => {
            const container = document.querySelector('.canvas-container');
            const obj = container.fabricCanvas.getObjects('i-text')[0];
            return { left: obj.left, top: obj.top };
        }
    """
    )

    assert new_pos["left"] == initial_pos["left"] + 1
    assert new_pos["top"] == initial_pos["top"] + 10


@pytest.mark.django_db
def test_keyboard_select_all(
    live_server: "LiveServer", page: Page, tmp_path: Path
) -> None:
    """Verifica seleção total via Ctrl+A."""
    setup_canvas_with_image(live_server, page, tmp_path)
    page.click("#addTextBtn")
    page.click("#addTextBtn")

    dispatch_kb_event(page, "a", ctrl=True)

    selected_count = page.evaluate(
        """
        () => {
            const container = document.querySelector('.canvas-container');
            const active = container.fabricCanvas.getActiveObject();
            return active?.type === 'activeSelection' ? active.getObjects().length : 0;
        }
    """
    )
    assert selected_count == 2


@pytest.mark.django_db
def test_keyboard_copy_paste(
    live_server: "LiveServer", page: Page, tmp_path: Path
) -> None:
    """Verifica duplicação via Ctrl+C/V."""
    setup_canvas_with_image(live_server, page, tmp_path)
    page.click("#addTextBtn")

    dispatch_kb_event(page, "c", ctrl=True)
    dispatch_kb_event(page, "v", ctrl=True)

    count = page.evaluate(
        """
        () => {
            const container = document.querySelector('.canvas-container');
            return container.fabricCanvas.getObjects('i-text').length;
        }
    """
    )
    assert count == 2


@pytest.mark.django_db
def test_keyboard_escape_deselect(
    live_server: "LiveServer", page: Page, tmp_path: Path
) -> None:
    """Verifica deseleção via Esc."""
    setup_canvas_with_image(live_server, page, tmp_path)
    page.click("#addTextBtn")

    dispatch_kb_event(page, "Escape")

    has_selection = page.evaluate(
        """
        () => {
            const container = document.querySelector('.canvas-container');
            return !!container.fabricCanvas.getActiveObject();
        }
    """
    )
    assert has_selection is False


@pytest.mark.django_db
def test_keyboard_ignore_shortcuts_in_input(
    live_server: "LiveServer", page: Page, tmp_path: Path
) -> None:
    """Garante que atalhos são ignorados em inputs."""
    setup_canvas_with_image(live_server, page, tmp_path)
    page.click("#addTextBtn")

    page.locator("#text-boxes-container textarea").focus()
    dispatch_kb_event(page, "Backspace")

    count = page.evaluate(
        """
        () => {
            const container = document.querySelector('.canvas-container');
            return container.fabricCanvas.getObjects('i-text').length;
        }
    """
    )
    assert count == 1
