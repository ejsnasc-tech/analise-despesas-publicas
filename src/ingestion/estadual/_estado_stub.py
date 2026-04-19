from __future__ import annotations

from typing import Any

from .base_estadual import BaseEstadual


class EstadoStubCollector(BaseEstadual):
    def __init__(self, estado: str, portal_url: str, tce_url: str):
        self.estado = estado
        self.portal_url = portal_url
        self.tce_url = tce_url

    def _entry(self, fonte: str, tipo: str) -> list[dict[str, Any]]:
        return [{"estado": self.estado, "fonte": fonte, "tipo": tipo}]

    def coletar_despesas_por_orgao(self) -> list[dict[str, Any]]:
        return self._entry(self.portal_url, "despesas_por_orgao")

    def coletar_contratos(self) -> list[dict[str, Any]]:
        return self._entry(self.portal_url, "contratos")

    def coletar_licitacoes(self) -> list[dict[str, Any]]:
        return self._entry(self.portal_url, "licitacoes")

    def coletar_convenios(self) -> list[dict[str, Any]]:
        return self._entry(self.portal_url, "convenios")

    def coletar_empenhos_liquidacoes_pagamentos(self) -> list[dict[str, Any]]:
        return self._entry(self.portal_url, "empenhos_liquidacoes_pagamentos")

    def coletar_dados_municipais_tce(self) -> list[dict[str, Any]]:
        return self._entry(self.tce_url, "prestacao_contas_municipios")

    def coletar_relatorios_auditoria(self) -> list[dict[str, Any]]:
        return self._entry(self.tce_url, "relatorios_auditoria")
