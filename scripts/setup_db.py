"""Script de inicialização de banco de dados."""

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from config.settings import get_settings  # noqa: E402
from src.storage.database import create_session  # noqa: E402


def main() -> None:
    """Inicializa conexão com banco configurado."""
    settings = get_settings()
    try:
        session = create_session(settings.database_url)
        print(f"Conexão estabelecida: {session}")
    except RuntimeError as exc:
        print(f"Dependência ausente para inicialização do banco: {exc}")


if __name__ == "__main__":
    main()
