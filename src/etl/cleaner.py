"""Rotinas de limpeza de dados de despesas."""

from __future__ import annotations

try:
    import pandas as pd
except ImportError:  # pragma: no cover
    pd = None


class DataCleaner:
    """Executa operações básicas de limpeza de dados."""

    def clean(self, dataframe):
        """Remove duplicatas, normaliza texto e trata nulos."""
        if pd is None:
            raise RuntimeError("pandas não está instalado.")

        df = dataframe.copy()
        df = df.drop_duplicates()
        for column in df.select_dtypes(include=["object", "string"]).columns:
            df[column] = df[column].fillna("").astype(str).str.strip().str.upper()
        return df
