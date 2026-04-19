"""Enriquecimento de despesas com dados externos."""


class DataEnricher:
    """Adiciona metadados de referência às despesas."""

    def enrich(
        self, rows: list[dict], sanctioned_cnpjs: set[str] | None = None
    ) -> list[dict]:
        """Marca fornecedores sancionados e campos derivados."""
        sanctioned = sanctioned_cnpjs or set()
        enriched: list[dict] = []
        for row in rows:
            new_row = dict(row)
            new_row["fornecedor_sancionado"] = (
                new_row.get("cnpj_fornecedor") in sanctioned
            )
            enriched.append(new_row)
        return enriched
