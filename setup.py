"""Configuração de empacotamento do projeto."""

from setuptools import find_packages, setup

setup(
    name="analise-despesas-publicas",
    version="0.1.0",
    description="Sistema de análise de despesas públicas",
    packages=find_packages(),
    include_package_data=True,
)
