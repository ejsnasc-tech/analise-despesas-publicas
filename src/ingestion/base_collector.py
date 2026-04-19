"""Coletores base com retry, backoff e rate limit."""

import json
import logging
import time
from abc import ABC
from pathlib import Path
from typing import Any

try:
    import requests
except ImportError:  # pragma: no cover
    requests = None


class BaseCollector(ABC):
    """Classe base para coletores de dados públicos."""

    def __init__(
        self, base_url: str, rate_limit_seconds: float = 0.2, max_retries: int = 3
    ):
        """Inicializa um coletor com parâmetros de rede."""
        self.base_url = base_url.rstrip("/")
        self.rate_limit_seconds = rate_limit_seconds
        self.max_retries = max_retries
        self.logger = logging.getLogger(self.__class__.__name__)

    def fetch(
        self,
        endpoint: str,
        params: dict[str, Any] | None = None,
        headers: dict[str, str] | None = None,
    ) -> Any:
        """Busca dados de um endpoint com retry e backoff exponencial."""
        if requests is None:
            raise RuntimeError("A biblioteca requests não está instalada.")

        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        for attempt in range(1, self.max_retries + 1):
            try:
                time.sleep(self.rate_limit_seconds)
                response = requests.get(url, params=params, headers=headers, timeout=30)
                response.raise_for_status()
                self.logger.info("Coleta realizada com sucesso: %s", url)
                return (
                    response.json()
                    if "json" in response.headers.get("Content-Type", "")
                    else response.text
                )
            except Exception as exc:
                wait_seconds = 2 ** (attempt - 1)
                self.logger.warning(
                    "Falha na coleta (%s/%s): %s", attempt, self.max_retries, exc
                )
                if attempt == self.max_retries:
                    raise
                time.sleep(wait_seconds)
        return None

    def save_raw(self, data: Any, output_file: str) -> Path:
        """Salva dados brutos no disco para uso offline."""
        path = Path(output_file)
        path.parent.mkdir(parents=True, exist_ok=True)
        if isinstance(data, (dict, list)):
            path.write_text(
                json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
            )
        else:
            path.write_text(str(data), encoding="utf-8")
        self.logger.info("Dados brutos salvos em %s", path)
        return path
