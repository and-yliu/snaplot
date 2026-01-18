#!/usr/bin/env python3
"""
Process the Snapplot logo to remove gray background and make it transparent
"""
from PIL import Image
import numpy as np
import os

# File paths
input_path = '/Users/wangkaiyue/nwhack2026/frontend/assets/images/snapplot_logo.png'
output_path = '/Users/wangkaiyue/nwhack2026/frontend/assets/images/snapplot_logo.png'

print(f"Processing logo: {input_path}")

# Open the image
img = Image.open(input_path)
print(f"Original size: {img.size}, mode: {img.mode}")

# Convert to RGBA if not already
if img.mode != 'RGBA':
    img = img.convert('RGBA')

# Convert to numpy array for processing
data = np.array(img)

# Get color channels
r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]

# Remove gray/white background - more aggressive thresholds
# Target light gray/white pixels (RGB values > 160)
light_mask = (r > 160) & (g > 160) & (b > 160)
data[light_mask, 3] = 0  # Set alpha to 0 (fully transparent)

# Also handle medium gray pixels and shadows (RGB values between 120-160)
medium_gray_mask = (r > 120) & (g > 120) & (b > 120) & (r <= 160) & (g <= 160) & (b <= 160)
data[medium_gray_mask, 3] = 0  # Also make these transparent

# Remove any remaining light pixels where all RGB channels are similar (gray-ish)
# This catches subtle gray tones
for i in range(data.shape[0]):
    for j in range(data.shape[1]):
        pixel_r, pixel_g, pixel_b = data[i, j, 0], data[i, j, 1], data[i, j, 2]
        # If the pixel is grayish (all channels similar) and not very dark
        if abs(pixel_r - pixel_g) < 30 and abs(pixel_g - pixel_b) < 30 and abs(pixel_r - pixel_b) < 30:
            if pixel_r > 100:  # Not dark enough to be part of the logo
                data[i, j, 3] = 0

# Create result image
result = Image.fromarray(data)

# Save the processed image
result.save(output_path)
print(f"✅ Saved transparent logo to: {output_path}")
print(f"New size: {result.size}, mode: {result.mode}")
print("Background removed successfully!")
