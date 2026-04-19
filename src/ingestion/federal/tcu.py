"""Módulo de integração com dados do TCU."""

from src.ingestion.base_collector import BaseCollector


class TCUCollector(BaseCollector):
    """Disponibiliza consultas simplificadas de acórdãos e relatórios."""

    def acordaos(self, **params):
        """Coleta metadados de acórdãos."""
        return self.fetch("acordaos", params=params)

    def relatorios_auditoria(self, **params):
        """Coleta metadados de relatórios de auditoria."""
        return self.fetch("relatorios", params=params)
