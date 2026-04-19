from __future__ import annotations

from typing import Any

from src.ingestion.referencias.cartao_cnpj import CartaoCNPJReferencia


class FornecedorEnricher:
    def __init__(self, cartao_cnpj: CartaoCNPJReferencia | None = None) -> None:
        self.cartao_cnpj = cartao_cnpj or CartaoCNPJReferencia()

    def enriquecer_fornecedores(self, despesas: Any) -> Any:
        if hasattr(despesas, "copy") and hasattr(despesas, "columns"):
            df = despesas.copy()
            if "cnpj_fornecedor" not in df.columns:
                return df
            df["fornecedor_cnpj_info"] = df["cnpj_fornecedor"].apply(self.cartao_cnpj.consultar_cnpj)
            df["fornecedor_ativo"] = df["cnpj_fornecedor"].apply(self.cartao_cnpj.verificar_situacao_ativa)
            return df

        enriched = []
        for item in despesas:
            novo = dict(item)
            cnpj = str(item.get("cnpj_fornecedor", ""))
            novo["fornecedor_cnpj_info"] = self.cartao_cnpj.consultar_cnpj(cnpj)
            novo["fornecedor_ativo"] = self.cartao_cnpj.verificar_situacao_ativa(cnpj)
            enriched.append(novo)
        return enriched
