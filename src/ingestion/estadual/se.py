from __future__ import annotations

from typing import Any

from .base_estadual import BaseEstadual


class SergipeCollector(BaseEstadual):
    """Coletor estadual principal para Sergipe (SE)."""

    estado = "SE"
    portal_transparencia_url = "https://www.transparencia.se.gov.br/"
    sagres_tce_url = "https://sagres.tce.se.gov.br/"
    siga_url = "https://www.siga.se.gov.br/"
    compras_url = "https://www.comprasnet.se.gov.br/"

    def _entry(self, fonte: str, tipo: str) -> list[dict[str, Any]]:
        return [{"estado": self.estado, "fonte": fonte, "tipo": tipo}]

    def coletar_despesas_por_orgao(self) -> list[dict[str, Any]]:
        return self._entry(self.portal_transparencia_url, "despesas_por_orgao")

    def coletar_contratos(self) -> list[dict[str, Any]]:
        return self._entry(self.portal_transparencia_url, "contratos_celebrados")

    def coletar_licitacoes(self) -> list[dict[str, Any]]:
        return self._entry(self.portal_transparencia_url, "licitacoes")

    def coletar_convenios(self) -> list[dict[str, Any]]:
        return self._entry(self.portal_transparencia_url, "convenios")

    def coletar_empenhos_liquidacoes_pagamentos(self) -> list[dict[str, Any]]:
        return self._entry(self.portal_transparencia_url, "empenhos_liquidacoes_pagamentos")

    def coletar_dados_municipais_tce(self) -> list[dict[str, Any]]:
        return self._entry(self.sagres_tce_url, "prestacao_contas_municipios")

    def coletar_relatorios_auditoria(self) -> list[dict[str, Any]]:
        return self._entry(self.sagres_tce_url, "relatorios_auditoria")

    def coletar_portal_compras(self) -> list[dict[str, Any]]:
        return self._entry(self.compras_url, "compras_estaduais")

    def coletar_siga(self) -> list[dict[str, Any]]:
        return self._entry(self.siga_url, "siga_sergipe")
