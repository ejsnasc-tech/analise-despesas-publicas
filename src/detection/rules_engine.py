"""Motor de regras determinísticas para suspeitas em despesas."""

from __future__ import annotations

import hashlib


class RulesEngine:
    """Aplica regras de negócio para geração de alertas."""

    def __init__(self, rules: dict | None = None):
        """Inicializa motor com configuração de regras."""
        self.rules = rules or {}

    @staticmethod
    def _key_hash(row: dict) -> str:
        """Gera hash para identificação de pagamento duplicado."""
        key = "|".join(
            str(row.get(field, ""))
            for field in ["cnpj_fornecedor", "valor", "data_pagamento", "objeto"]
        )
        return hashlib.md5(key.encode("utf-8")).hexdigest()

    def evaluate(
        self, rows: list[dict], sanctioned_cnpjs: set[str] | None = None
    ) -> list[dict]:
        """Executa regras e retorna alertas encontrados."""
        alerts: list[dict] = []
        sanctioned = sanctioned_cnpjs or set()
        seen_hashes: dict[str, dict] = {}
        service_limit = self.rules.get("bid_exemption_limits", {}).get("servicos", 8800)

        for row in rows:
            if float(row.get("valor", 0) or 0) <= 0:
                alerts.append({"tipo": "VALOR_ZERADO_OU_NEGATIVO", "registro": row})

            if row.get("cnpj_fornecedor") in sanctioned:
                alerts.append({"tipo": "EMPRESA_INIDONEA", "registro": row})

            if (
                row.get("modalidade") == "DISPENSA"
                and float(row.get("valor", 0) or 0) > service_limit
            ):
                alerts.append(
                    {"tipo": "CONTRATO_SEM_LICITACAO_INDEVIDO", "registro": row}
                )

            row_hash = self._key_hash(row)
            if row_hash in seen_hashes:
                alerts.append(
                    {
                        "tipo": "PAGAMENTO_DUPLICADO",
                        "registro": row,
                        "duplicado_de": seen_hashes[row_hash],
                    }
                )
            else:
                seen_hashes[row_hash] = row

        return alerts
