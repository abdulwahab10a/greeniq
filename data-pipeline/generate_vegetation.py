"""
GreenIQ — Iraq actually-vegetated areas from ESA WorldCover 2021 (v200).

Reads ESA WorldCover 10 m land-cover tiles directly from the AWS open-data
bucket (no credentials), keeps only the classes that represent real planted /
vegetated ground (Tree cover + Cropland), aggregates them into a ~5 km grid
clipped to the real Iraq border, and writes:

    frontend/public/iraq-vegetation.geojson        (choropleth layer)
    frontend/public/iraq-vegetation-stats.json     (summary numbers)

Run:  python generate_vegetation.py
"""

import json
import math
import os
import sys

import numpy as np
import requests
import rasterio
from rasterio.enums import Resampling
from shapely.geometry import shape, box, mapping
from shapely.prepared import prep
from shapely.ops import unary_union

# --- GDAL / network tuning for fast windowed reads over HTTP --------------
os.environ.setdefault("GDAL_DISABLE_READDIR_ON_OPEN", "EMPTY_DIR")
os.environ.setdefault("CPL_VSIL_CURL_ALLOWED_EXTENSIONS", ".tif")
os.environ.setdefault("GDAL_HTTP_MULTIRANGE", "YES")
os.environ.setdefault("VSI_CACHE", "TRUE")

# --- ESA WorldCover constants --------------------------------------------
BUCKET = "https://esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/map"
TILE_URL = BUCKET + "/ESA_WorldCover_10m_2021_v200_{tile}_Map.tif"

# Classes we treat as "actually planted / vegetated"
CLASS_TREE = 10      # Tree cover
CLASS_CROP = 40      # Cropland
VEG_CLASSES = (CLASS_TREE, CLASS_CROP)

# ESA WorldCover tiles are 3 deg x 3 deg, named by their SW corner.
# Iraq spans lon 38.8..48.6, lat 29.0..37.4 -> these SW corners cover it.
LAT_CORNERS = (27, 30, 33, 36)
LON_CORNERS = (36, 39, 42, 45, 48)

# Output grid resolution (degrees). 0.05 deg ~ 5.5 km.
CELL = 0.05

# Read each 36000x36000 tile decimated to this size (uses internal overviews,
# so only a few MB are transferred per tile). ~333 m effective sampling.
READ_SIZE = 3600

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "public")


def iraq_border():
    """Real Iraq ADM0 polygon from geoBoundaries; falls back to a bbox."""
    try:
        meta = requests.get(
            "https://www.geoboundaries.org/api/current/gbOpen/IRQ/ADM0/",
            timeout=30,
        ).json()
        gj = requests.get(meta["gjDownloadURL"], timeout=60).json()
        geom = unary_union([shape(f["geometry"]) for f in gj["features"]])
        print("Iraq border: loaded from geoBoundaries")
        return geom
    except Exception as exc:  # network / API issues -> bbox fallback
        print(f"Iraq border: geoBoundaries failed ({exc}); using bbox")
        return box(38.79, 29.06, 48.57, 37.38)


def grid_dims(bounds):
    minx, miny, maxx, maxy = bounds
    minx = math.floor(minx / CELL) * CELL
    miny = math.floor(miny / CELL) * CELL
    maxx = math.ceil(maxx / CELL) * CELL
    maxy = math.ceil(maxy / CELL) * CELL
    ncol = int(round((maxx - minx) / CELL))
    nrow = int(round((maxy - miny) / CELL))
    return minx, miny, ncol, nrow


def accumulate_tile(url, minx, miny, ncol, nrow, veg, total):
    """Read one decimated tile and add its pixel counts into the grid."""
    with rasterio.open(url) as ds:
        data = ds.read(
            1, out_shape=(READ_SIZE, READ_SIZE), resampling=Resampling.nearest
        )
        # lon/lat of every decimated pixel centre
        t = ds.transform
        sx = ds.width / READ_SIZE
        sy = ds.height / READ_SIZE
        cols = (np.arange(READ_SIZE) + 0.5) * sx
        rows = (np.arange(READ_SIZE) + 0.5) * sy
        lons = t.c + cols * t.a            # t.a > 0, t.b == 0
        lats = t.f + rows * t.e            # t.e < 0
        lon_grid, lat_grid = np.meshgrid(lons, lats)

    gi = ((lon_grid - minx) / CELL).astype(np.int32)
    gj = ((lat_grid - miny) / CELL).astype(np.int32)
    inside = (gi >= 0) & (gi < ncol) & (gj >= 0) & (gj < nrow) & (data != 0)
    flat = gj[inside] * ncol + gi[inside]
    is_veg = np.isin(data[inside], VEG_CLASSES)

    np.add.at(total, flat, 1)
    np.add.at(veg, flat, is_veg.astype(np.int64))


def main():
    border = iraq_border()
    prepared = prep(border)
    minx, miny, ncol, nrow = grid_dims(border.bounds)
    print(f"Grid: {ncol} x {nrow} cells of {CELL} deg")

    veg = np.zeros(ncol * nrow, dtype=np.int64)
    total = np.zeros(ncol * nrow, dtype=np.int64)

    tiles = [f"N{lat:02d}E{lon:03d}" for lat in LAT_CORNERS for lon in LON_CORNERS]
    for tile in tiles:
        url = TILE_URL.format(tile=tile)
        try:
            print(f"  reading {tile} ...", flush=True)
            accumulate_tile(url, minx, miny, ncol, nrow, veg, total)
        except Exception as exc:
            print(f"    skip {tile}: {exc}")

    # Build choropleth cells (only vegetated cells inside Iraq) + stats
    features = []
    veg_area = 0.0
    for idx in np.nonzero(total)[0]:
        frac = veg[idx] / total[idx]
        if frac < 0.05:
            continue
        gi = idx % ncol
        gj = idx // ncol
        x0 = minx + gi * CELL
        y0 = miny + gj * CELL
        cx, cy = x0 + CELL / 2, y0 + CELL / 2
        if not prepared.contains_properly(box(x0, y0, x0 + CELL, y0 + CELL).centroid):
            continue
        # geographic area of the vegetated part of this cell (km^2)
        cell_km2 = (CELL * 111.32) * (CELL * 111.32 * math.cos(math.radians(cy)))
        area = float(frac) * cell_km2
        veg_area += area
        features.append({
            "type": "Feature",
            "properties": {"veg": round(float(frac), 3), "km2": round(area, 2)},
            "geometry": mapping(box(x0, y0, x0 + CELL, y0 + CELL)),
        })

    os.makedirs(OUT_DIR, exist_ok=True)
    geojson = {"type": "FeatureCollection", "features": features}
    with open(os.path.join(OUT_DIR, "iraq-vegetation.geojson"), "w", encoding="utf-8") as f:
        json.dump(geojson, f)

    stats = {
        "source": "ESA WorldCover 2021 v200 (10 m)",
        "classes": "Tree cover (10) + Cropland (40)",
        "cell_km": round(CELL * 111.32, 1),
        "vegetated_km2": round(veg_area, 1),
        "vegetated_cells": len(features),
        "generated_from_tiles": tiles,
    }
    with open(os.path.join(OUT_DIR, "iraq-vegetation-stats.json"), "w", encoding="utf-8") as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)

    print(f"\nDone: {len(features)} vegetated cells, "
          f"~{veg_area:,.0f} km^2 actually planted across Iraq")
    print(f"Wrote -> {os.path.abspath(OUT_DIR)}")


if __name__ == "__main__":
    sys.exit(main())
