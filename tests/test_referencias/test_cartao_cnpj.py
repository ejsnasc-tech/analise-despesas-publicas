import tempfile
import unittest
from unittest.mock import patch

from src.ingestion.referencias.cartao_cnpj import CartaoCNPJReferencia


class TestCartaoCNPJReferencia(unittest.TestCase):
    def test_consultar_cnpj_com_fallback(self):
        with tempfile.TemporaryDirectory() as td:
            ref = CartaoCNPJReferencia(cache_path=f"{td}/cache.sqlite")

            calls = {"count": 0}

            def fake_call(template_url, cnpj):
                calls["count"] += 1
                if "brasilapi" in template_url:
                    raise TimeoutError("timeout")
                return {
                    "nome": "EMPRESA TESTE",
                    "situacao": "ATIVA",
                    "capital_social": "5000",
                    "socios": [{"nome": "SOCIO A", "cpf": "12345678901"}],
                }

            with patch.object(ref, "_consultar_api", side_effect=fake_call):
                dados = ref.consultar_cnpj("12.345.678/0001-90")

            self.assertGreaterEqual(calls["count"], 2)
            self.assertEqual(dados["razao_social"], "EMPRESA TESTE")
            self.assertEqual(dados["situacao_cadastral"], "ATIVA")

    def test_detectar_empresa_de_fachada(self):
        with tempfile.TemporaryDirectory() as td:
            ref = CartaoCNPJReferencia(cache_path=f"{td}/cache.sqlite")
            with patch.object(
                ref,
                "consultar_cnpj",
                return_value={
                    "cnpj": "12345678000190",
                    "cnae_principal": "ATIVIDADE INCOMPATIVEL",
                    "capital_social": 1000,
                    "data_abertura": "2026-01-01",
                    "socios_com_restricoes": True,
                },
            ):
                resultado = ref.detectar_empresa_de_fachada("12345678000190")

            self.assertTrue(resultado["suspeita_empresa_fachada"])
            self.assertGreaterEqual(resultado["score_risco"], 2)

    def test_obter_socios_com_cpf_parcial(self):
        with tempfile.TemporaryDirectory() as td:
            ref = CartaoCNPJReferencia(cache_path=f"{td}/cache.sqlite")
            with patch.object(
                ref,
                "consultar_cnpj",
                return_value={"socios": [{"nome": "SOCIO B", "cpf": "98765432100"}]},
            ):
                socios = ref.obter_socios("98765432000100")
            self.assertEqual(socios[0]["cpf_parcial"], "***100")


if __name__ == "__main__":
    unittest.main()
