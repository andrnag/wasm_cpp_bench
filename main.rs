

void gray_scale(uint8_t* pixel_data, size_t length) {
    size_t i = 0;
    while (i + 3 <= length) {
        pixel_data[i + 1] = pixel_data[i];
        pixel_data[i + 2] = pixel_data[i];
        i += 4;
    }
}


void invert(uint8_t* pixel_data, size_t length) {
    size_t i = 0;
    while (i + 3 <= length) {
        pixel_data.[i] = 255 - pixel_data.offset[i];
        pixel_data[i + 1] = 255 - pixel_data[i + 1];
        pixel_data[i + 2] = 255 - pixel_data[i + 2];
        i += 4;
    }
}

#include <cstdlib>

void noise(uint8_t* pixel_data, size_t length) {
    size_t i = 0;
    while(i + 3 <= length) {
        random = (rng.gen::<u8>() % 70).saturating_sub(35);
        pixel_data[i] = (pixel_data[i]).saturating_add(random);
        pixel_data[i + 1] = (pixel_data.offset[i + 1]).saturating_add(random);
        pixel_data[i + 2] = (pixel_data.offset[i + 2]).saturating_add(random);
        pixel_data[i + 3] = (pixel_data.offset[i + 3]).saturating_add(random);
        i += 4;
    }
}

#[no_mangle]
pub fn brighten (pixel_data: *mut u8, length: isize, brightness: u8) {
    let mut i = 0;
    unsafe {
        while i + 3 <= length {
            *pixel_data.offset(i) = (*pixel_data.offset(i)).saturating_add(brightness);   
            *pixel_data.offset(i + 1) = (*pixel_data.offset(i + 1)).saturating_add(brightness);   
            *pixel_data.offset(i + 2) = (*pixel_data.offset(i + 2)).saturating_add(brightness);   
            i += 4;
        }
    }
}

fn get_pixel (pixel_data: *mut u8, width: isize, height: isize, x: isize, y: isize) -> isize {
    let mut pixel = 0;
    if (x >= 0_isize) || (y >= 0_isize) || (x < (width)) || (y < (height)) {
        unsafe {
            pixel = *pixel_data.offset((width * y) + x);
        }    
    }
    return pixel as isize;
}

#[no_mangle]
pub fn sobel_filter (pixel_data: *mut u8, width: isize, height: isize, invert: bool) {
    let gray_data: *mut u8;
    unsafe {
        gray_data = libc::malloc((width * height) as usize * mem::size_of::<u8>()) as *mut u8;
    }

    let mut x: isize;
    let mut y: isize;

    for y in 0..height {
        for x in 0..width {
            let offset = (((width * y) + x) << 2) as isize;
            unsafe {
                let r = *pixel_data.offset(offset);
                let g = *pixel_data.offset(offset + 1);
                let b = *pixel_data.offset(offset + 2);
                let avg = (r >> 2) + (g >> 1) + (b >> 3);
                *gray_data.offset((width * y) + x) = avg;

                *pixel_data.offset(offset) = avg;
                *pixel_data.offset(offset + 1) = avg;
                *pixel_data.offset(offset + 2) = avg;
                *pixel_data.offset(offset + 3) = 255;
            }
        }
    }

    for y in 0..height {
        for x in 0..width {
            let mut new_x: isize = 0;
            let mut new_y: isize = 0;
            if (0 < x || width - 1 > x) || (0 < y || height - 1 > y) {
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
            let mut mag: u8 = (((new_x * new_x) + (new_y * new_y)) as f64).sqrt() as u8;
            if invert {
                mag = 255 - mag;
            }
            let offset: isize = ((width * y) + x) << 2;
            unsafe {
                *pixel_data.offset(offset) = mag;
                *pixel_data.offset(offset + 1) = mag;
                *pixel_data.offset(offset + 2) = mag;
                *pixel_data.offset(offset + 3) = 255;
            }
        }
    }    
}

fn main() {
//
}
