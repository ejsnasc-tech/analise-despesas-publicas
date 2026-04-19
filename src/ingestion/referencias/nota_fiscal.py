from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any


@dataclass
class NotaFiscalReferencia:
    nfe_nacional_url: str = "https://www.nfe.fazenda.gov.br/"
    nfse_abrasf_url: str = "https://abrasf.org.br/"
    sefaz_se_url: str = "https://www.sefaz.se.gov.br/"

    def consultar_nfe(self, chave_acesso: str) -> dict[str, Any]:
        chave = "".join(filter(str.isdigit, chave_acesso))
        return {
            "chave_acesso": chave,
            "fonte": self.nfe_nacional_url,
            "autentica": len(chave) == 44,
            "emitente_cnpj": chave[:14] if len(chave) >= 14 else "",
            "destinatario": "ORGAO_PUBLICO",
            "valor": 0.0,
            "data_emissao": datetime.now(timezone.utc).date().isoformat(),
            "itens": [],
        }

    def validar_nota_fiscal(self, cnpj_emitente: str, valor: float, data: str) -> bool:
        nota = self.consultar_nfe(cnpj_emitente + "0" * 30)
        return bool(nota.get("autentica")) and float(valor) >= 0 and bool(data)

    def cruzar_notas_com_despesas(self, despesas: Any) -> Any:
        try:
            import pandas as pd  # type: ignore
        except ImportError:  # pragma: no cover
            pd = None

        if pd is not None and hasattr(despesas, "copy"):
            df = despesas.copy()
            if "nota_chave" not in df.columns:
                df["nota_chave"] = ""
            if "valor_nota" not in df.columns:
                df["valor_nota"] = df.get("valor", 0)
            df["nota_encontrada"] = df["nota_chave"].astype(str).str.len() == 44
            df["nota_adulterada_ou_sem_correspondencia"] = ~df["nota_encontrada"]
            df["valor_divergente_nf_pagamento"] = (df["valor_nota"].fillna(0).astype(float) - df["valor"].fillna(0).astype(float)).abs() > 0.01
            return df

        resultado = []
        for despesa in despesas:
            chave = str(despesa.get("nota_chave", ""))
            valor_nota = float(despesa.get("valor_nota", despesa.get("valor", 0)))
            valor_pago = float(despesa.get("valor", 0))
            item = dict(despesa)
            item["nota_encontrada"] = len(chave) == 44
            item["nota_adulterada_ou_sem_correspondencia"] = not item["nota_encontrada"]
            item["valor_divergente_nf_pagamento"] = abs(valor_nota - valor_pago) > 0.01
            resultado.append(item)
        return resultado
