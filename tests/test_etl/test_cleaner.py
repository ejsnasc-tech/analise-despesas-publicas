"""Testes do módulo de limpeza de dados."""

import pandas as pd

from src.etl.cleaner import DataCleaner


def test_cleaner_remove_duplicatas_e_normaliza_texto():
    """Valida remoção de duplicatas e limpeza de texto."""
    df = pd.DataFrame(
        [{"nome": " fornecedor x ", "valor": 1}, {"nome": " fornecedor x ", "valor": 1}]
    )
    result = DataCleaner().clean(df)
    assert len(result) == 1
    assert result.iloc[0]["nome"] == "FORNECEDOR X"
