#!/usr/bin/env python3
"""
Reorder pages script.

Current state:
- Pages 1-50: All prologues + Chapter 1 (no change)
- Pages 51-55: Chapel of Bones
- Pages 56-64: Chapter 2

Target state:
- Pages 1-50: All prologues + Chapter 1 (no change)
- Pages 51-59: Chapter 2 (was 56-64)
- Pages 60-64: Chapel of Bones (was 51-55)
"""

import os
import json
import shutil
from pathlib import Path

# Define the mapping: old_page -> new_page
mapping = {}

# Pages 1-50: no change
for i in range(1, 51):
    mapping[i] = i

# Pages 56-64 (Chapter 2) -> 51-59
for i in range(56, 65):
    mapping[i] = i - 5  # 56->51, 57->52, ..., 64->59

# Pages 51-55 (Chapel) -> 60-64
for i in range(51, 56):
    mapping[i] = i + 9  # 51->60, 52->61, ..., 55->64

print("Mapping (changes only):")
for old, new in sorted(mapping.items()):
    if old != new:
        print(f"  {old:2d} -> {new:2d}")

# Directories
base_dir = Path("/Users/robgruhl/Projects/bens-game")
pages_json_dir = base_dir / "data" / "pages"
panels_dir = base_dir / "output" / "panels"
pages_dir = base_dir / "output" / "pages"

# Step 1: Rename all to temporary names to avoid collisions
print("\nStep 1: Renaming to temporary names...")

# Page JSONs
for old_page in mapping.keys():
    old_file = pages_json_dir / f"page-{old_page:03d}.json"
    if old_file.exists():
        temp_file = pages_json_dir / f"temp-{old_page:03d}.json"
        shutil.move(old_file, temp_file)

# Panels
for f in panels_dir.glob("page-*-panel-*.png"):
    name = f.name
    # Extract page number
    parts = name.split("-")
    page_num = int(parts[1])
    if page_num in mapping:
        temp_name = f"temp-{parts[1]}-panel-{'-'.join(parts[3:])}"
        shutil.move(f, panels_dir / temp_name)

# Assembled pages
for f in pages_dir.glob("page-*.png"):
    name = f.name
    page_num = int(name.split("-")[1].split(".")[0])
    if page_num in mapping:
        temp_name = f"temp-{page_num:03d}.png"
        shutil.move(f, pages_dir / temp_name)

# Step 2: Rename from temporary to final names
print("Step 2: Renaming to final names...")

# Page JSONs
for old_page, new_page in mapping.items():
    temp_file = pages_json_dir / f"temp-{old_page:03d}.json"
    if temp_file.exists():
        new_file = pages_json_dir / f"page-{new_page:03d}.json"
        shutil.move(temp_file, new_file)

        # Update page_num in JSON
        with open(new_file, 'r') as f:
            data = json.load(f)
        data['page_num'] = new_page
        with open(new_file, 'w') as f:
            json.dump(data, f, indent=2)

# Panels
for f in panels_dir.glob("temp-*-panel-*.png"):
    name = f.name
    parts = name.split("-")
    old_page_num = int(parts[1])
    new_page_num = mapping[old_page_num]
    new_name = f"page-{new_page_num:03d}-panel-{'-'.join(parts[3:])}"
    shutil.move(f, panels_dir / new_name)

# Assembled pages
for f in pages_dir.glob("temp-*.png"):
    name = f.name
    old_page_num = int(name.split("-")[1].split(".")[0])
    new_page_num = mapping[old_page_num]
    new_name = f"page-{new_page_num:03d}.png"
    shutil.move(f, pages_dir / new_name)

print("Done!")

# Verify
print("\nVerifying page JSON files:")
for i in range(1, 65):
    f = pages_json_dir / f"page-{i:03d}.json"
    if f.exists():
        with open(f, 'r') as file:
            data = json.load(file)
        print(f"  Page {i:2d}: {data['title'][:50]}")
    else:
        print(f"  Page {i:2d}: MISSING!")
