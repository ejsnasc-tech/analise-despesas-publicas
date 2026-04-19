import unittest

from src.ingestion.referencias.nota_fiscal import NotaFiscalReferencia


class TestNotaFiscalReferencia(unittest.TestCase):
    def test_consultar_nfe(self):
        ref = NotaFiscalReferencia()
        chave = "1" * 44
        nota = ref.consultar_nfe(chave)
        self.assertEqual(nota["chave_acesso"], chave)
        self.assertTrue(nota["autentica"])

    def test_cruzar_notas_com_despesas_detecta_divergencia(self):
        ref = NotaFiscalReferencia()
        despesas = [
            {"nota_chave": "1" * 44, "valor": 100.0, "valor_nota": 150.0},
            {"nota_chave": "curta", "valor": 100.0, "valor_nota": 100.0},
        ]
        cruzado = ref.cruzar_notas_com_despesas(despesas)
        self.assertTrue(cruzado[0]["valor_divergente_nf_pagamento"])
        self.assertTrue(cruzado[1]["nota_adulterada_ou_sem_correspondencia"])


if __name__ == "__main__":
    unittest.main()
