import os
import re
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
    Verifica se o upload de uma imagem válida ativa o editor corretamente.
    """
    img_path = tmp_path / "valid_meme.png"
    handle_create_dummy_image(img_path)

    page.goto(f"{live_server.url}{reverse('home')}")

    # Realiza o upload
    page.set_input_files("#imageUpload", str(img_path))

    # Placeholder deve receber a classe d-none (Bootstrap)
    placeholder = page.locator("#placeholder-content")
    expect(placeholder).to_have_class(re.compile(r".*d-none.*"))

    # O wrapper do canvas deve ficar visível
    canvas_wrapper = page.locator("#canvas-wrapper")
    expect(canvas_wrapper).to_be_visible()

    # O label do input deve mostrar o nome do arquivo
    label = page.locator(".custom-file-label")
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

    # Deve exibir alerta de erro (alert-danger)
    alert = page.locator(".alert-danger")
    expect(alert).to_be_visible()
    expect(alert).to_contain_text("Arquivo não suportado")

    # O input deve ser limpo pelo JavaScript
    file_input = page.locator("#imageUpload")
    expect(file_input).to_have_value("")


@pytest.mark.django_db
def test_handle_text_addition_validation(
    live_server: "LiveServer", page: Page, tmp_path: Path
) -> None:
    """
    Valida que o texto só pode ser adicionado se houver uma imagem de fundo.
    """
    page.goto(f"{live_server.url}{reverse('home')}")

    # Tenta adicionar texto sem imagem
    page.click("#addTextBtn")

    # Deve mostrar aviso
    alert = page.locator(".alert-warning")
    expect(alert).to_be_visible()
    expect(alert).to_contain_text("Selecione uma imagem primeiro")

    # Agora faz upload válido
    img_path = tmp_path / "test.png"
    handle_create_dummy_image(img_path)
    page.set_input_files("#imageUpload", str(img_path))

    # Tenta adicionar texto novamente
    page.click("#addTextBtn")

    # O alerta de aviso deve desaparecer (limpeza automática)
    expect(alert).to_be_hidden()


@pytest.mark.django_db
def test_handle_canvas_clear_stability(
    live_server: "LiveServer", page: Page, tmp_path: Path
) -> None:
    """
    Verifica se a limpeza do canvas não causa travamentos na aplicação.
    Regressão para o bug de loop infinito na remoção de objetos.
    """
    img_path = tmp_path / "stability_test.png"
    handle_create_dummy_image(img_path)

    page.goto(f"{live_server.url}{reverse('home')}")
    page.set_input_files("#imageUpload", str(img_path))

    # Adiciona múltiplos textos para forçar o processamento
    for _ in range(5):
        page.click("#addTextBtn")

    # Limpa o canvas
    page.click("#clearCanvasBtn")

    # Se o botão de download ainda responder, a página não congelou
    download_btn = page.locator("#downloadMemeBtn")
    expect(download_btn).to_be_enabled()
