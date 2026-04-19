"""Normalização de campos de despesas públicas."""

from __future__ import annotations

import re

try:
    import pandas as pd
except ImportError:  # pragma: no cover
    pd = None


class DataNormalizer:
    """Normaliza documentos e valores monetários."""

    @staticmethod
    def _normalize_document(document: str) -> str:
        """Remove pontuação de CPF/CNPJ."""
        return re.sub(r"\D", "", str(document or ""))

    @staticmethod
    def _normalize_currency(value) -> float:
        """Converte valores monetários em float."""
        text = (
            str(value or "0")
            .replace("R$", "")
            .replace(".", "")
            .replace(",", ".")
            .strip()
        )
        try:
            return float(text)
        except ValueError:
            return 0.0

    def normalize(self, dataframe):
        """Aplica normalização sobre colunas relevantes."""
        if pd is None:
            raise RuntimeError("pandas não está instalado.")

        df = dataframe.copy()
        if "cnpj_fornecedor" in df:
            df["cnpj_fornecedor"] = df["cnpj_fornecedor"].apply(
                self._normalize_document
            )
        if "valor" in df:
            df["valor"] = df["valor"].apply(self._normalize_currency)
        return df
