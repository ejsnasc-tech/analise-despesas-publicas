"""Consulta de CNPJ via API pública da ReceitaWS."""

import json
from pathlib import Path

from src.ingestion.base_collector import BaseCollector


class ReceitaFederalCollector(BaseCollector):
    """Consulta e cacheia dados cadastrais de CNPJ."""

    def __init__(
        self,
        base_url: str = "https://receitaws.com.br/v1",
        cache_file: str = "data/reference/cnpj_cache.json",
    ):
        """Inicializa coletor com arquivo de cache local."""
        super().__init__(base_url=base_url)
        self.cache_file = Path(cache_file)
        self.cache_file.parent.mkdir(parents=True, exist_ok=True)
        self._cache = self._load_cache()

    def _load_cache(self) -> dict:
        """Carrega cache local se existir."""
        if self.cache_file.exists():
            return json.loads(self.cache_file.read_text(encoding="utf-8"))
        return {}

    def _save_cache(self) -> None:
        """Persiste cache local em disco."""
        self.cache_file.write_text(
            json.dumps(self._cache, ensure_ascii=False, indent=2), encoding="utf-8"
        )

    def consultar_cnpj(self, cnpj: str) -> dict:
        """Consulta dados do CNPJ com reaproveitamento de cache."""
        normalized = "".join(char for char in cnpj if char.isdigit())
        if normalized in self._cache:
            return self._cache[normalized]
        data = self.fetch(f"cnpj/{normalized}")
        result = data if isinstance(data, dict) else {"raw": data}
        self._cache[normalized] = result
        self._save_cache()
        return result
