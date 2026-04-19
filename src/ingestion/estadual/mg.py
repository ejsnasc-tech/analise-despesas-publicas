from ._estado_stub import EstadoStubCollector


class MinasGeraisCollector(EstadoStubCollector):
    def __init__(self) -> None:
        super().__init__("MG", "https://www.transparencia.mg.gov.br/", "https://www.tce.mg.gov.br/")
