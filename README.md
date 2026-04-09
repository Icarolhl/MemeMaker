# ⚡ MemeMaker

[![Python](https://img.shields.io/badge/Python-3.13+-blue.svg)](https://www.python.org/downloads/release/python-3130/)
[![Django](https://img.shields.io/badge/Django-6.0+-green.svg)](https://www.djangoproject.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![uv](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/uv/main/assets/badge/v0.json)](https://github.com/astral-sh/uv)

**MemeMaker** é uma estação de trabalho criativa minimalista e de código aberto. Diferente de editores pesados, ele foca na velocidade e na privacidade, processando tudo diretamente no seu navegador. Crie memes profissionais, anote imagens ou edite fotos sem marcas d'água e com zero anúncios.

---

## ✨ Funcionalidades

- 🔄 **Rotação de Imagem:** Rotacione a imagem base em 90° instantaneamente.
- ✍️ **Texto Editável:** Adicione múltiplas camadas de texto com controle total.
- 🖼️ **Sobreposição (Overlay):** Adicione segundas imagens ou logos por cima do seu projeto.
- 🖌️ **Modo Pincel:** Desenho livre com cores vibrantes e roda cromática.
- 📏 **Margens Dinâmicas (Padding):** Adicione espaços extras no topo ou base para legendas clássicas.
- 🧹 **Limpeza Inteligente:** Remova elementos específicos ou limpe tudo mantendo a base.
- ⌨️ **UX Otimizada:** Atalhos e interface pensados para produtividade rápida.

---

## 🛠️ Tecnologias

- **Backend:** [Python 3.13+](https://www.python.org/) & [Django 6.0+](https://www.djangoproject.com/)
- **Frontend:** Django Templates, Bootstrap 4, Custom CSS/JS
- **Canvas Engine:** [Fabric.js](http://fabricjs.com/)
- **Gerenciamento de Pacotes:** [uv](https://github.com/astral-sh/uv)
- **Qualidade de Código:** Ruff (Lint & Format) & Pyright (Static Typing)

---

## 🚀 Como Executar

O MemeMaker pode ser acessado diretamente pelo navegador através do link:
👉 **[https://icarolhl.github.io/MemeMaker/](https://icarolhl.github.io/MemeMaker/)**

### Execução Local (Desenvolvimento)

#### Pré-requisitos
- Python 3.13+
- [uv](https://github.com/astral-sh/uv) instalado

### Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/Icarolhl/MemeMaker.git
   cd MemeMaker
   ```

2. Instale as dependências:
   ```bash
   uv sync
   ```

3. Execute as migrações:
   ```bash
   uv run python src/manage.py migrate
   ```

4. Inicie o servidor de desenvolvimento:
   ```bash
   uv run python src/manage.py runserver
   ```

Acesse em: `http://127.0.0.1:8000`

---

## 🧪 Testes e Qualidade

Para manter a integridade do projeto, utilizamos um conjunto rigoroso de ferramentas:

- **Executar Testes:** `uv run pytest`
- **Lint/Formatação:** `uv run ruff check .` e `uv run ruff format .`
- **Checagem de Tipos:** `uv run pyright`

---

## 🔄 Fluxo de Deploy (CI/CD)

Este projeto utiliza **GitHub Actions** para automatizar o processo de deploy no **GitHub Pages**:

1.  **Desenvolvimento:** As novas funcionalidades são desenvolvidas e testadas na branch `development`.
2.  **Aprovação:** Após a validação, a branch `development` é mesclada (`merge`) na branch `main`.
3.  **Automação:** Cada `push` na branch `main` dispara o workflow `.github/workflows/deploy.yml`.
4.  **Build Estático:** O workflow instala as dependências, utiliza o Django para renderizar o template em um `index.html` estático, coleta os assets e ajusta os caminhos dos arquivos.
5.  **Publicação:** O resultado final é enviado para a branch `gh-pages`, que serve o site publicamente.

---

## 🤝 Contribuição

Contribuições são muito bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests.

1. Faça um Fork do projeto
2. Crie sua Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Faça o Commit de suas alterações (`git commit -m 'Add some AmazingFeature'`)
4. Faça o Push para a Branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.
