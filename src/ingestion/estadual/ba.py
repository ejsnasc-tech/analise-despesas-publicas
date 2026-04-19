from ._estado_stub import EstadoStubCollector


class BahiaCollector(EstadoStubCollector):
    def __init__(self) -> None:
        super().__init__("BA", "https://www.transparencia.ba.gov.br/", "https://www.tce.ba.gov.br/")
