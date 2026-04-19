"""Sistema simples de emissão de alertas."""

import logging


class AlertSystem:
    """Dispara alertas para integrações externas."""

    def __init__(self):
        """Inicializa logger do módulo."""
        self.logger = logging.getLogger(self.__class__.__name__)

    def notify(self, alert: dict) -> None:
        """Publica alerta no log estruturado."""
        self.logger.warning("ALERTA: %s", alert)
