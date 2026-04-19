from ._estado_stub import EstadoStubCollector


class RioDeJaneiroCollector(EstadoStubCollector):
    def __init__(self) -> None:
        super().__init__("RJ", "https://www.transparencia.rj.gov.br/", "https://www.tce.rj.gov.br/")
