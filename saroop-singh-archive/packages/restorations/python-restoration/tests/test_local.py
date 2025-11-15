#!/usr/bin/env python3
"""
Local Image Restoration Test
Test the restoration system with a local image file
"""

import os
import sys
import argparse
from pathlib import Path
from PIL import Image
import json

# Add lib to path
sys.path.append(str(Path(__file__).parent))

from lib.gemini_image_processor import create_processor, ProcessingConfig

def create_test_image(output_path):
    """Create a test vintage-style image"""
    from PIL import Image, ImageDraw, ImageFilter
    import random
    
    # Create base image
    img = Image.new('RGB', (800, 600), color=(200, 180, 150))
    draw = ImageDraw.Draw(img)
    
    # Add some "vintage" elements
    for _ in range(20):
        x = random.randint(0, 800)
        y = random.randint(0, 600)
        radius = random.randint(2, 10)
        color = (
            random.randint(100, 150),
            random.randint(80, 120),
            random.randint(60, 100)
        )
        draw.ellipse([x-radius, y-radius, x+radius, y+radius], fill=color)
    
    # Add some text
    draw.text((50, 50), "Saroop Singh Archive", fill=(80, 60, 40))
    draw.text((50, 100), "Test Image - 1937", fill=(80, 60, 40))
    
    # Apply vintage filter
    img = img.filter(ImageFilter.GaussianBlur(radius=1))
    
    # Add noise
    pixels = img.load()
    for i in range(0, 800, 10):
        for j in range(0, 600, 10):
            if random.random() > 0.8:
                noise = random.randint(-30, 30)
                r, g, b = pixels[i, j]
                pixels[i, j] = (
                    max(0, min(255, r + noise)),
                    max(0, min(255, g + noise)),
                    max(0, min(255, b + noise))
                )
    
    img.save(output_path)
    print(f"✅ Created test image: {output_path}")
    return output_path

def test_restoration(image_path, category="Restoration"):
    """Test image restoration"""
    processor = create_processor()
    
    # Define prompts for each category
    prompts = {
        "Restoration": "Restore this vintage photograph. Remove damage, enhance clarity, and preserve historical authenticity.",
        "Colorization": "Add natural, historically accurate colors to this vintage photograph.",
        "Enhancement": "Enhance this photograph by improving sharpness, contrast, and overall quality.",
        "Creative Remake": "Create a modern artistic interpretation of this vintage photograph.",
        "Document Processing": "Extract and enhance any text or important details from this document image."
    }
    
    prompt = prompts.get(category, prompts["Restoration"])
    config = ProcessingConfig.from_prompt_category(category)
    
    print(f"\n{'='*60}")
    print(f"Testing: {category}")
    print(f"Model: {config.model}")
    print(f"Temperature: {config.temperature}")
    print(f"Prompt: {prompt[:100]}...")
    print("="*60)
    
    try:
        result_path, metadata = processor.process_restoration(
            image_path,
            prompt,
            config
        )
        
        if metadata['status'] == 'completed':
            print(f"✅ Success!")
            print(f"📁 Result saved to: {result_path}")
            print(f"⏱️  Processing time: {metadata.get('processing_time', 'N/A')}s")
            
            if 'analysis' in metadata:
                print(f"\n📝 Analysis:")
                print(f"{metadata['analysis'][:500]}...")
            
            return True
        else:
            print(f"❌ Failed: {metadata.get('error', 'Unknown error')}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Test image restoration locally')
    parser.add_argument('--image', help='Path to image file to process')
    parser.add_argument('--category', default='Restoration', 
                       choices=['Restoration', 'Colorization', 'Enhancement', 'Creative Remake', 'Document Processing'],
                       help='Processing category')
    parser.add_argument('--create-test', action='store_true', help='Create a test image')
    parser.add_argument('--test-all', action='store_true', help='Test all categories')
    
    args = parser.parse_args()
    
    print("="*60)
    print("LOCAL IMAGE RESTORATION TEST")
    print("Gemini 2.5 Flash Image (Nano Banana)")
    print("="*60)
    
    # Determine image path
    if args.image:
        image_path = args.image
        if not os.path.exists(image_path):
            print(f"❌ Image not found: {image_path}")
            return
    else:
        # Use or create test image
        test_image_path = "/tmp/test_vintage_image.jpg"
        
        if args.create_test or not os.path.exists(test_image_path):
            image_path = create_test_image(test_image_path)
        else:
            image_path = test_image_path
            print(f"Using existing test image: {image_path}")
    
    # Test categories
    if args.test_all:
        categories = ['Restoration', 'Colorization', 'Enhancement', 'Creative Remake', 'Document Processing']
        results = {}
        
        for category in categories:
            success = test_restoration(image_path, category)
            results[category] = "✅ Pass" if success else "❌ Fail"
        
        print("\n" + "="*60)
        print("TEST RESULTS")
        print("="*60)
        for category, result in results.items():
            print(f"{category:20} {result}")
    else:
        test_restoration(image_path, args.category)
    
    print("\n✨ Test complete!")

if __name__ == "__main__":
    main()