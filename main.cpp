#include <cmath>
#include <limits>
#include <cstdlib>
#include <cstdint>
#include <emscripten/bind.h>

using namespace emscripten;

void gray_scale(unsigned int data, unsigned int length) {
	uint8_t* pixel_data = (uint8_t*) data;
    unsigned int i = 0;
    while (i + 3 <= length) {
        pixel_data[i + 1] = pixel_data[i];
        pixel_data[i + 2] = pixel_data[i];
        i += 4;
    }
}


void invert(unsigned int data, unsigned int length) {
	uint8_t* pixel_data = (uint8_t*) data;
    unsigned int i = 0;
    while (i + 3 <= length) {
        pixel_data[i] = 255 - pixel_data[i];
        pixel_data[i + 1] = 255 - pixel_data[i + 1];
        pixel_data[i + 2] = 255 - pixel_data[i + 2];
        i += 4;
    }
}


uint8_t saturating_add(uint8_t pixel, uint8_t value) {
    uint32_t result = (uint32_t)pixel + (uint32_t)value;
    return result > std::numeric_limits<uint8_t>::max() ? std::numeric_limits<uint8_t>::max() : result;
}


uint8_t saturating_sub(uint8_t pixel, uint8_t value) {
    return pixel <= value ? 0 : pixel - value;
}


void noise(unsigned int data, unsigned int length) {
	uint8_t* pixel_data = (uint8_t*) data;
    unsigned int i = 0;
    unsigned int random;
    while (i + 3 <= length) {
        random = saturating_sub(rand() % 70, 35);
        pixel_data[i] = saturating_add(pixel_data[i], random);
        pixel_data[i + 1] = saturating_add(pixel_data[i + 1], random);
        pixel_data[i + 2] = saturating_add(pixel_data[i + 2], random);
        pixel_data[i + 3] = saturating_add(pixel_data[i + 3], random);
        i += 4;
    }
}


void brighten(unsigned int data, unsigned int length, int brightness) {
	uint8_t* pixel_data = (uint8_t*) data;
    unsigned int i = 0;
    while (i + 3 <= length) {
        pixel_data[i] = saturating_add(pixel_data[i], brightness);   
        pixel_data[i + 1] = saturating_add(pixel_data[i + 1], brightness);   
        pixel_data[i + 2] = saturating_add(pixel_data[i + 2], brightness);   
        i += 4;
    }
}


uint32_t get_pixel(uint8_t* pixel_data, size_t width, size_t height, size_t x, size_t y) {
    uint32_t pixel = 0;
    
    if (/*x >= 0 || y >= 0 ||*/ x < width || y < height) {
        pixel = pixel_data[(width * y) + x];
    }
    
    return pixel;
}


void sobel_filter(unsigned int data, unsigned int width, unsigned int height, bool invert) {
	uint8_t* pixel_data = (uint8_t*) data;
    uint8_t* gray_data = new uint8_t [width * height];
    

    for (size_t y = 0; y < height; y++) {
        for (size_t x = 0; x < width; x++) {
            size_t offset = (((width * y) + x) << 2);
            
            uint8_t r = pixel_data[offset];
            uint8_t g = pixel_data[offset + 1];
            uint8_t b = pixel_data[offset + 2];
            uint8_t avg = (r >> 2) + (g >> 1) + (b >> 3);
            gray_data[(width * y) + x] = avg;

            pixel_data[offset] = avg;
            pixel_data[offset + 1] = avg;
            pixel_data[offset + 2] = avg;
            pixel_data[offset + 3] = 255;
        }
    }


    for (size_t y = 0; y < height; y++) {
        for (size_t x = 0; x < width; x++) {
            size_t new_x = 0;
            size_t new_y = 0;
            
            if (0 < x ||
                (width - 1) > x ||
                0 < y ||
                (height - 1) > y) {
                new_x =
                    get_pixel(gray_data, width, height, x + 1, y - 1) +
                    (get_pixel(gray_data, width, height, x + 1, y) << 1) +
                    get_pixel(gray_data, width, height, x + 1, y + 1) -
                    get_pixel(gray_data, width, height, x - 1, y - 1) -
                    (get_pixel(gray_data, width, height, x - 1, y) << 1) -
                    get_pixel(gray_data, width, height, x - 1, y + 1);
                new_y =
                    get_pixel(gray_data, width, height, x - 1, y + 1) +
                    (get_pixel(gray_data, width, height, x, y + 1) << 1) +
                    get_pixel(gray_data, width, height, x + 1, y + 1) -                    
                    get_pixel(gray_data, width, height, x - 1, y - 1) -
                    (get_pixel(gray_data, width, height, x, y - 1) << 1) -
                    get_pixel(gray_data, width, height, x + 1, y - 1);
            }
            
            uint8_t mag = sqrt(new_x * new_x + new_y * new_y);
            if (invert) {
                mag = 255 - mag;
            }
            
            size_t offset = ((width * y) + x) << 2;
            
            pixel_data[offset] = mag;
            pixel_data[offset + 1] = mag;
            pixel_data[offset + 2] = mag;
            pixel_data[offset + 3] = 255;            
        }
    }
    
    delete []gray_data;
}


int main (int argc, char* argv[]) {
    return 0;
}

EMSCRIPTEN_BINDINGS(filters) {
    function("grayScale", &gray_scale);
    function("invert", &invert);
    function("noise", &noise);
    function("brighten", &brighten);
    function("sobelFilter", &sobel_filter);
}

