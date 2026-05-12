from core.auto_migration import AutoMigration

"""
Migration from Blueprint v3.36 to v3.37

無需更改任何參數，僅更新 Blueprint 版本號。
"""


class Migration(AutoMigration):
    def __init__(self) -> None:
        super().__init__()

    def run(self, blueprint: dict) -> dict:
        print("現在開始 migrate 到 ", self.targetVersion())
        return blueprint

    def targetVersion(self) -> str:
        return "3.37.0"

    def find_component_and_update(self, subcomponents: list, config: dict) -> list:
        return subcomponents
