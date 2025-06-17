# main/utils/gltf_utils.py
import subprocess
import os
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


def optimize_glb(input_path: str, output_path: str, compression: str = "draco") -> bool:
    """
    Оптимизирует GLB-файл с помощью @gltf-transform/cli.

    :param input_path: Путь к исходному файлу (например, 'static/models/apartment_standard.glb')
    :param output_path: Путь для сохранения (например, 'static/models/apartment_standard_optimized.glb')
    :param compression: Тип сжатия ('draco', 'meshopt', или 'none')
    :return: True, если успешно
    """
    try:
        project_root = Path(__file__).resolve().parent.parent.parent  # Корень проекта (NovaHaus/)
        cli_path = project_root / "node_modules" / ".bin" / "gltf-transform"

        if not os.path.exists(input_path):
            raise FileNotFoundError(f"Input file not found: {input_path}")

        cmd = [
            str(cli_path),
            "optimize",
            input_path,
            output_path,
            f"--compress {compression}",
            "--texture-compress webp",
        ]

        result = subprocess.run(
            " ".join(cmd),
            shell=True,  # Для поддержки Windows/Linux
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            logger.error(f"GLTF Transform Error: {result.stderr}")
            return False

        logger.info(f"Optimized: {output_path}")
        return True

    except Exception as e:
        logger.error(f"GLTF Processing Failed: {e}")
        return False