from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]


def remove_checkerboard(source: Path, destination: Path) -> None:
    """Turn the neutral checkerboard from the edit output into true alpha."""
    image = Image.open(source).convert("RGB")
    rgb = np.asarray(image).astype(np.float32)
    lightness = rgb.mean(axis=2)
    chroma = rgb.max(axis=2) - rgb.min(axis=2)

    # The rendered checkerboard is neutral and very light. Real photographed
    # product pixels are either darker or have warm/cool color information.
    alpha = np.maximum(chroma * 22.0, (244.0 - lightness) * 7.0)
    alpha = np.clip(alpha, 0, 255)

    # Remove the two light neutral checker tiles completely. This hard cutoff
    # prevents their faint grid from showing after the cutout is placed on the
    # dark site gradient; the photographed products remain protected by their
    # darker values and natural warm/cool color variation.
    checkerboard = (lightness > 228.0) & (chroma < 8.0)
    alpha[checkerboard] = 0
    alpha = alpha.astype(np.uint8)

    rgba = np.dstack((rgb.astype(np.uint8), alpha))
    Image.fromarray(rgba, "RGBA").save(destination, optimize=True)


def copy_alpha_cutout(source: Path, destination: Path) -> None:
    Image.open(source).convert("RGBA").save(destination, optimize=True)


remove_checkerboard(
    Path("/Users/kristinali/.codex/generated_images/01a03173-c8b6-75f2-8a92-53add86eef48/exec-c13c8efa-37ab-4091-82aa-0ab20e01c2e2.png"),
    ROOT / "assets/marketplace-ipad-cutout.png",
)
remove_checkerboard(
    Path("/Users/kristinali/.codex/generated_images/01a03173-c8b6-75f2-8a92-53add86eef48/exec-37b84f25-bc86-49b9-af93-4c72d9727bc0.png"),
    ROOT / "assets/marketplace-airpods-max-cutout.png",
)
copy_alpha_cutout(
    Path("/Users/kristinali/.codex/generated_images/01a03173-c8b6-75f2-8a92-53add86eef48/exec-bc613285-b107-4edf-98ff-4796635f1f1c.png"),
    ROOT / "assets/marketplace-macbook-cutout.png",
)
copy_alpha_cutout(
    Path("/Users/kristinali/.codex/generated_images/01a03173-c8b6-75f2-8a92-53add86eef48/exec-803aa904-8a15-4939-bae6-a19eec80ff3f.png"),
    ROOT / "assets/marketplace-monitor-cutout.png",
)
