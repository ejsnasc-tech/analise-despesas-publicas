"""Coletor de dados do PNCP."""

from src.ingestion.base_collector import BaseCollector


class PNCPCollector(BaseCollector):
    """Implementa endpoints do Portal Nacional de Contratações Públicas."""

    def contratos(self, **params):
        """Lista contratos."""
        return self.fetch("contratacoes", params=params)

    def editais(self, **params):
        """Lista editais."""
        return self.fetch("editais", params=params)

    def atas_registro_preco(self, **params):
        """Lista atas de registro de preço."""
        return self.fetch("atas-registro-preco", params=params)

    def itens_contratacao(self, **params):
        """Lista itens de contratação."""
        return self.fetch("itens", params=params)
