import unittest

from src.ingestion.estadual.base_estadual import BaseEstadual
from src.ingestion.estadual.se import SergipeCollector


class TestSergipeCollector(unittest.TestCase):
    def test_sergipe_is_main_state_collector(self):
        coletor = SergipeCollector()
        self.assertIsInstance(coletor, BaseEstadual)
        self.assertEqual(coletor.estado, "SE")
        self.assertIn("transparencia.se.gov.br", coletor.portal_transparencia_url)
        self.assertIn("sagres.tce.se.gov.br", coletor.sagres_tce_url)

    def test_sergipe_is_not_generic(self):
        coletor = SergipeCollector()
        despesas = coletor.coletar_despesas_por_orgao()
        self.assertEqual(despesas[0]["estado"], "SE")
        self.assertNotEqual(despesas[0]["fonte"], "https://dados.gov.br/")


if __name__ == "__main__":
    unittest.main()
