"""Script de coleta de dados públicos."""

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from config.settings import get_settings  # noqa: E402
from src.ingestion.federal.portal_transparencia import (  # noqa: E402
    PortalTransparenciaCollector,
)


def main() -> None:
    """Executa coleta inicial de exemplo."""
    settings = get_settings()
    collector = PortalTransparenciaCollector(
        api_key=settings.portal_transparencia_api_key,
        base_url=settings.portal_transparencia_base_url,
    )
    print(f"Coletor inicializado para: {collector.base_url}")


if __name__ == "__main__":
    main()
