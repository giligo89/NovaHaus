import os
from PIL import Image

def compress_images():
    IMAGE_DIR = "static/images/"
    
    for root, _, files in os.walk(IMAGE_DIR):
        for file in files:
            if file.lower().endswith((".jpg", ".jpeg", ".png")):
                filepath = os.path.join(root, file)
                try:
                    img = Image.open(filepath)
                    # Оптимизация JPEG (качество 70%)
                    if file.lower().endswith((".jpg", ".jpeg")):
                        new_path = filepath.replace(".jpeg", ".jpg").replace(".JPG", ".jpg")
                        img.save(new_path, quality=70, optimize=True)
                    # Оптимизация PNG
                    elif file.lower().endswith(".png"):
                        img.save(filepath, optimize=True)
                    print(f"✓ Оптимизировано: {filepath}")
                except Exception as e:
                    print(f"✗ Ошибка {filepath}: {e}")

if __name__ == "__main__":
    compress_images()
