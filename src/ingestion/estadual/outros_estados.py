from ._estado_stub import EstadoStubCollector


class OutrosEstadosCollector(EstadoStubCollector):
    def __init__(self, uf: str) -> None:
        super().__init__(uf.upper(), "https://dados.gov.br/", "https://dados.gov.br/")
