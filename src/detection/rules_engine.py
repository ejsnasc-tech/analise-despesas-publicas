from __future__ import annotations

from typing import Any

from src.ingestion.referencias.nota_fiscal import NotaFiscalReferencia


class RulesEngine:
    def __init__(self, nota_fiscal: NotaFiscalReferencia | None = None) -> None:
        self.nota_fiscal = nota_fiscal or NotaFiscalReferencia()

    def cruzar_notas_pagamentos(self, despesas: Any) -> Any:
        return self.nota_fiscal.cruzar_notas_com_despesas(despesas)

    def detectar_divergencias_notas(self, despesas: Any) -> list[dict[str, Any]]:
        cruzado = self.cruzar_notas_pagamentos(despesas)
        if hasattr(cruzado, "to_dict"):
            registros = cruzado.to_dict(orient="records")
        else:
            registros = list(cruzado)

        return [
            item
            for item in registros
            if item.get("nota_adulterada_ou_sem_correspondencia") or item.get("valor_divergente_nf_pagamento")
        ]
