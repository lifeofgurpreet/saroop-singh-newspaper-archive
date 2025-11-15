#!/usr/bin/env python3
"""
System Test Script for Gemini Image Restoration
Tests the complete pipeline with a sample image
"""

import os
import sys
import json
from pathlib import Path

# Add lib to path
sys.path.append(str(Path(__file__).parent))

from lib.gemini_image_processor import create_processor, ProcessingConfig

def test_gemini_api():
    """Test Gemini API connectivity"""
    print("Testing Gemini API connectivity...")
    
    try:
        processor = create_processor()
        print("✓ Gemini API connected")
        return True
    except Exception as e:
        print(f"✗ Gemini API error: {e}")
        return False

def test_airtable_connection():
    """Test Airtable connectivity"""
    print("\nTesting Airtable connection...")
    
    try:
        from pyairtable import Api
        
        api_key = os.getenv("AIRTABLE_API_KEY", "your_airtable_api_key_here")
        base_id = "appQpjCUauAy7Ut1Y"
        
        api = Api(api_key)
        table = api.table(base_id, "PhotoGallery")
        
        # Try to fetch first record
        records = table.all(max_records=1)
        print(f"✓ Airtable connected - Found {len(records)} test record(s)")
        return True
        
    except Exception as e:
        print(f"✗ Airtable error: {e}")
        return False

def test_image_processing():
    """Test image processing with sample"""
    print("\nTesting image processing...")
    
    # Create a simple test image
    from PIL import Image
    import tempfile
    
    # Create test image
    test_image = Image.new('RGB', (512, 512), color=(112, 66, 20))
    
    with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
        test_image.save(tmp.name)
        test_path = tmp.name
    
    try:
        processor = create_processor()
        config = ProcessingConfig.from_prompt_category("Restoration")
        
        # Test with simple prompt
        result, metadata = processor.process_restoration(
            test_path,
            "Analyze this image and describe what you see",
            config
        )
        
        if metadata['status'] == 'completed':
            print("✓ Image processing successful")
            if 'analysis' in metadata:
                print(f"  Analysis: {metadata['analysis'][:100]}...")
            return True
        else:
            print(f"✗ Processing failed: {metadata.get('error')}")
            return False
            
    except Exception as e:
        print(f"✗ Processing error: {e}")
        return False
    finally:
        # Clean up
        os.unlink(test_path)

def test_prompt_categories():
    """Test different prompt categories"""
    print("\nTesting prompt categories...")
    
    categories = ["Restoration", "Colorization", "Enhancement", "Creative Remake", "Document Processing"]
    
    for category in categories:
        config = ProcessingConfig.from_prompt_category(category)
        print(f"  {category}: temp={config.temperature}, model={config.model}")
    
    print("✓ All categories configured")
    return True

def main():
    """Run all tests"""
    print("=" * 50)
    print("GEMINI IMAGE RESTORATION SYSTEM TEST")
    print("=" * 50)
    
    results = []
    
    # Run tests
    results.append(("Gemini API", test_gemini_api()))
    results.append(("Airtable", test_airtable_connection()))
    results.append(("Image Processing", test_image_processing()))
    results.append(("Categories", test_prompt_categories()))
    
    # Summary
    print("\n" + "=" * 50)
    print("TEST SUMMARY")
    print("=" * 50)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{name:20} {status}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! System is ready.")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Please check configuration.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)