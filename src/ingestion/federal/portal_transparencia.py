"""Coletor do Portal da Transparência Federal."""

from src.ingestion.base_collector import BaseCollector


class PortalTransparenciaCollector(BaseCollector):
    """Implementa endpoints relevantes do Portal da Transparência."""

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://portaldatransparencia.gov.br/api-de-dados",
    ):
        """Inicializa coletor com chave da API."""
        super().__init__(base_url=base_url)
        self.api_key = api_key

    def _headers(self) -> dict[str, str]:
        """Retorna cabeçalhos para autenticação na API."""
        return {"chave-api-dados": self.api_key} if self.api_key else {}

    def despesas_por_orgao(self, **params):
        """Consulta despesas por órgão."""
        return self.fetch("despesas/por-orgao", params=params, headers=self._headers())

    def recursos_recebidos(self, **params):
        """Consulta recursos recebidos."""
        return self.fetch(
            "despesas/recursos-recebidos", params=params, headers=self._headers()
        )

    def contratos(self, **params):
        """Consulta contratos."""
        return self.fetch("contratos", params=params, headers=self._headers())

    def licitacoes(self, **params):
        """Consulta licitações."""
        return self.fetch("licitacoes", params=params, headers=self._headers())

    def convenios(self, **params):
        """Consulta convênios."""
        return self.fetch("convenios", params=params, headers=self._headers())

    def servidores(self, **params):
        """Consulta dados de servidores."""
        return self.fetch("servidores", params=params, headers=self._headers())
