from __future__ import annotations

import json
import sqlite3
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import URLError
from urllib.request import urlopen


@dataclass
class CartaoCNPJReferencia:
    cache_path: str = "data/reference/cnpj_cache.sqlite"
    lote_delay_segundos: float = 0.2

    receita_federal_url: str = "https://www.gov.br/receitafederal/pt-br"
    brasilapi_url: str = "https://brasilapi.com.br/api/cnpj/v1/{cnpj}"
    receitaws_url: str = "https://receitaws.com.br/v1/cnpj/{cnpj}"
    cnpjws_url: str = "https://publica.cnpj.ws/cnpj/{cnpj}"

    def __post_init__(self) -> None:
        Path(self.cache_path).parent.mkdir(parents=True, exist_ok=True)
        with sqlite3.connect(self.cache_path) as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS cnpj_cache (
                    cnpj TEXT PRIMARY KEY,
                    payload TEXT NOT NULL,
                    atualizado_em TEXT NOT NULL
                )
                """
            )
            conn.commit()

    @staticmethod
    def _normalizar_cnpj(cnpj: str) -> str:
        return "".join(filter(str.isdigit, cnpj))

    def _consultar_api(self, template_url: str, cnpj: str) -> dict[str, Any]:
        url = template_url.format(cnpj=cnpj)
        with urlopen(url, timeout=8) as response:
            payload = response.read().decode("utf-8")
        data = json.loads(payload)
        return data if isinstance(data, dict) else {}

    @staticmethod
    def _extract_cnae_principal(data: dict[str, Any]) -> str:
        cnae = data.get("cnae_fiscal_descricao")
        if cnae:
            return str(cnae)
        atividade_principal = data.get("atividade_principal")
        if isinstance(atividade_principal, list) and atividade_principal:
            return str(atividade_principal[0].get("text", ""))
        return str(data.get("cnae_principal", ""))

    def _get_cache(self, cnpj: str) -> dict[str, Any] | None:
        with sqlite3.connect(self.cache_path) as conn:
            row = conn.execute("SELECT payload FROM cnpj_cache WHERE cnpj = ?", (cnpj,)).fetchone()
        return json.loads(row[0]) if row else None

    def _set_cache(self, cnpj: str, payload: dict[str, Any]) -> None:
        with sqlite3.connect(self.cache_path) as conn:
            conn.execute(
                """
                INSERT INTO cnpj_cache(cnpj, payload, atualizado_em)
                VALUES (?, ?, datetime('now'))
                ON CONFLICT(cnpj) DO UPDATE SET
                    payload = excluded.payload,
                    atualizado_em = excluded.atualizado_em
                """,
                (cnpj, json.dumps(payload, ensure_ascii=False)),
            )
            conn.commit()

    def consultar_cnpj(self, cnpj: str) -> dict[str, Any]:
        cnpj_norm = self._normalizar_cnpj(cnpj)
        cached = self._get_cache(cnpj_norm)
        if cached is not None:
            return cached

        urls = [self.brasilapi_url, self.receitaws_url, self.cnpjws_url]
        last_error: Exception | None = None
        for template in urls:
            try:
                data = self._consultar_api(template, cnpj_norm)
                if data:
                    normalized = {
                        "cnpj": cnpj_norm,
                        "razao_social": data.get("razao_social") or data.get("nome") or data.get("company", {}).get("name", ""),
                        "nome_fantasia": data.get("nome_fantasia") or data.get("fantasia") or "",
                        "situacao_cadastral": data.get("descricao_situacao_cadastral") or data.get("situacao") or data.get("status", ""),
                        "data_abertura": data.get("data_inicio_atividade") or data.get("abertura") or "",
                        "cnae_principal": self._extract_cnae_principal(data),
                        "cnaes_secundarios": data.get("cnaes_secundarios") or data.get("atividade_secundaria") or [],
                        "endereco": {
                            "logradouro": data.get("logradouro", ""),
                            "numero": data.get("numero", ""),
                            "bairro": data.get("bairro", ""),
                            "municipio": data.get("municipio", ""),
                            "uf": data.get("uf", ""),
                            "cep": data.get("cep", ""),
                        },
                        "socios": data.get("qsa") or data.get("socios") or [],
                        "capital_social": float(data.get("capital_social") or 0),
                        "porte": data.get("porte") or data.get("porte_empresa") or "",
                        "fonte": template,
                    }
                    self._set_cache(cnpj_norm, normalized)
                    return normalized
            except (URLError, TimeoutError, ValueError, KeyError) as exc:
                last_error = exc
                continue

        return {
            "cnpj": cnpj_norm,
            "situacao_cadastral": "DESCONHECIDA",
            "socios": [],
            "capital_social": 0.0,
            "erro": str(last_error) if last_error else "Nenhuma API retornou dados",
        }

    def verificar_situacao_ativa(self, cnpj: str) -> bool:
        situacao = str(self.consultar_cnpj(cnpj).get("situacao_cadastral", "")).upper()
        return "ATIVA" in situacao or situacao == "OK"

    def obter_socios(self, cnpj: str) -> list[dict[str, Any]]:
        socios = self.consultar_cnpj(cnpj).get("socios", [])
        resultado = []
        for socio in socios:
            nome = socio.get("nome") or socio.get("nome_socio") or ""
            cpf = socio.get("cpf") or socio.get("cnpj_cpf_do_socio") or ""
            cpf_sanitizado = "".join(filter(str.isdigit, str(cpf)))
            if len(cpf_sanitizado) >= 3:
                cpf_parcial = f"***{cpf_sanitizado[-3:]}"
            else:
                cpf_parcial = "***"
            resultado.append({"nome": nome, "cpf_parcial": cpf_parcial})
        return resultado

    def detectar_empresa_de_fachada(self, cnpj: str) -> dict[str, Any]:
        dados = self.consultar_cnpj(cnpj)
        indicadores = {
            "cnpj": dados.get("cnpj", cnpj),
            "cnae_incompativel": self._cnae_incompativel(str(dados.get("cnae_principal", ""))),
            "capital_social_baixo": float(dados.get("capital_social", 0)) < 10_000,
            "empresa_muito_recente": self._empresa_muito_recente(dados.get("data_abertura", "")),
            "socios_com_restricoes": bool(dados.get("socios_com_restricoes", False)),
        }
        score = sum(bool(v) for k, v in indicadores.items() if k != "cnpj")
        indicadores["score_risco"] = score
        indicadores["suspeita_empresa_fachada"] = score >= 2
        return indicadores

    @staticmethod
    def _cnae_incompativel(cnae_principal: str) -> bool:
        descricao = cnae_principal.upper()
        if not descricao:
            return True
        categorias_aceitaveis = (
            "SERV",
            "COM",
            "IND",
            "CONSTR",
            "TRANSP",
            "SAUDE",
            "EDUC",
            "TECNO",
            "ADMIN",
            "ENGENH",
            "CONSULT",
            "MANUT",
        )
        return not any(token in descricao for token in categorias_aceitaveis)

    @staticmethod
    def _empresa_muito_recente(data_abertura: str) -> bool:
        if not data_abertura:
            return False
        normalizada = data_abertura.replace("/", "-")
        formatos = ("%Y-%m-%d", "%d-%m-%Y")
        for fmt in formatos:
            try:
                abertura = datetime.strptime(normalizada, fmt).date()
                hoje = datetime.now(timezone.utc).date()
                meses = (hoje.year - abertura.year) * 12 + (hoje.month - abertura.month)
                if hoje.day < abertura.day:
                    meses -= 1
                return meses < 6
            except ValueError:
                continue
        return False

    def consultar_em_lote(self, cnpjs: list[str]) -> Any:
        resultados = []
        for cnpj in cnpjs:
            resultados.append(self.consultar_cnpj(cnpj))
            time.sleep(max(self.lote_delay_segundos, 0))

        try:
            import pandas as pd  # type: ignore

            return pd.DataFrame(resultados)
        except ImportError:  # pragma: no cover
            return resultados
