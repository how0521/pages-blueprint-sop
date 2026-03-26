from core.auto_migration import AutoMigration

"""
Dummy Migration
"""
class DefaultMigration(AutoMigration):
    def __init__(self) -> None:
        super().__init__()

    def run(self, blueprint: dict) -> dict:
        return blueprint

    def targetVersion(self) -> str:
        pass

    def find_component_and_update(self, subcomponents: list, config: dict) -> list:
        return subcomponents
