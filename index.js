(function () {
	'use strict';

	const URL = window.webkitURL || window.URL;
	let ctx;
	let wasmEnabled = false;
	let wmodule;
	let grayScale, invert, noise, sobelFilter, brighten;
	let filter = 'Normal', prevFilter;
	let pixels, pixels2;
	let dataHeap
	let w, h

	window.onload = function () {
		addButtons();
		const input = document.getElementById('input');
		input.addEventListener('change', handleFiles, false);
		const wasmButton = document.getElementById('wasmButton');
		wasmButton.addEventListener('click', wasmEnable, false);
	};

	function addButtons(filtersArr) {
		const filters = ['Normal', 'Grayscale', 'Invert', 'Noise', 'Sobel', 'Brighten'];
		const buttonDiv = document.createElement('div');
		buttonDiv.id = 'filters';
		const editor = document.getElementById('editor');
		editor.insertBefore(buttonDiv, editor.firstChild);
		for (let i = 0; i < filters.length; i++) {
			let filterDiv = document.createElement('div');
			filterDiv.className = "indFilter";
			filterDiv.innerText = filters[i];

			filterDiv.addEventListener('click', function () {
				filter = filters[i];

				if (document.getElementsByClassName('selectedFilter')[0]) document.getElementsByClassName('selectedFilter')[0].classList.remove('selectedFilter');
				this.classList.add('selectedFilter');

				if (wasmEnabled) {
					setPixels(filter);
				} else {
					js_setPixels(filter);
				}
			});
			buttonDiv.appendChild(filterDiv);
		}
	}

	function setPixels(filter) {
		dataHeap.set(new Uint8Array(pixels.data.buffer));
		console.time(filter);
		switch (filter) {
			case 'Normal':
				break;
			case 'Grayscale':
				Module.grayScale(dataHeap.byteOffset, pixels.data.length);
				break;
			case 'Invert':
				Module.invert(dataHeap.byteOffset, pixels.data.length);
				break;
			case 'Noise':
				Module.noise(dataHeap.byteOffset, pixels.data.length);
				break;
			case 'Brighten':
				Module.brighten(dataHeap.byteOffset, pixels.data.length, 20);
				break;
			case 'Sobel':
				Module.sobelFilter(dataHeap.byteOffset, w, h, 0);
				break;
		}
		console.timeEnd(filter);
		pixels2.data.set(new Uint8ClampedArray(dataHeap));
		ctx.putImageData(pixels2, 0, 0)
	}

	function js_setPixels (filter) {
		pixels2.data.set(pixels.data);
		console.time(filter);
		switch (filter) {
			case 'Normal': break;
			case 'Grayscale': js_grayScale(pixels2.data); break;
			case 'Invert': js_invert(pixels2.data); break;
			case 'Noise': js_noise(pixels2.data); break;
			case 'Brighten': js_brighten(pixels2.data, 20); break;
			case 'Sobel': js_sobelFilter(pixels2.data, w, h, 0); break;
		}
		console.timeEnd(filter);
		ctx.putImageData(pixels2, 0, 0)
	}

	function js_grayScale(data) {
		for (let i = 0; i < data.length; i += 4) {
			let r = data[i];
			let g = data[i+1];
			let b = data[i+2];
			let a = data[i+3];

			data[i] = r;
			data[i+1] = r;
			data[i+2] = r;
			data[i+3] = a;
		}
		return data;
	}

	function js_brighten(data, brightness=25) {
		for (let i = 0; i < data.length; i += 4) {
			data[i]   += brightness;
			data[i+1] += brightness;
			data[i+2] += brightness;

			data[i]   = data[i]   > 255 ? 255 : data[i];
			data[i+1] = data[i+1] > 255 ? 255 : data[i+1];
			data[i+2] = data[i+2] > 255 ? 255 : data[i+2];
		}
		return data;
	}

	function js_invert(data) {
		for (let i = 0; i < data.length; i += 4) {
			data[i] = 255 - data[i];
			data[i+1] = 255 - data[i+1];
			data[i+2] = 255 - data[i+2];
		}
		return data;
	}

	function js_noise(data) {
		let random;
		for (let i = 0; i < data.length; i += 4) {
			random = (Math.random() - 0.5) * 70;
			data[i] = data[i] + random;
			data[i+1] = data[i+1] + random;
			data[i+2] = data[i+2] + random;
		}
		return data;
	}

	function js_sobelFilter(data, width, height, invert=false) {
		const out = [];
		let wid = width;
		let hei = height;
		var grayData = new Int32Array(wid * hei);

		function getPixel(x, y) {
			if (x < 0 || y < 0) return 0;
			if (x >= (wid) || y >= (hei)) return 0;
			return (grayData[((wid * y) + x)]);
		}
		for (var y = 0; y < height; y++) {
			for (var x = 0; x < width; x++) {
				var goffset = ((wid * y) + x) << 2;
				var r = data[goffset];
				var g = data[goffset + 1];
				var b = data[goffset + 2];
				var avg = (r >> 2) + (g >> 1) + (b >> 3);
				grayData[((wid * y) + x)] = avg;
				var doffset = ((wid * y) + x) << 2;
				data[doffset] = avg;
				data[doffset + 1] = avg;
				data[doffset + 2] = avg;
				data[doffset + 3] = 255;
			}
		}
		for (var y = 0; y < height; y++) {
			for (var x = 0; x < width; x++) {
				var newX;
				var newY;
				if ((x >= width - 1) || (y >= height - 1)) {
					newX = 0;
					newY = 0;
				} else {
					newX = (
						(-1 * getPixel(x - 1, y - 1)) +
						(getPixel(x + 1, y - 1)) +
						(-1 * (getPixel(x - 1, y) << 1)) +
						(getPixel(x + 1, y) << 1) +
						(-1 * getPixel(x - 1, y + 1)) +
						(getPixel(x + 1, y + 1))
					);
					newY = (
						(-1 * getPixel(x - 1, y - 1)) +
						(-1 * (getPixel(x, y - 1) << 1)) +
						(-1 * getPixel(x + 1, y - 1)) +
						(getPixel(x - 1, y + 1)) +
						(getPixel(x, y + 1) << 1) +
						(getPixel(x + 1, y + 1))
					);
					var mag = Math.floor(Math.sqrt((newX * newX) + (newY * newY)) >>> 0);
					if (mag > 255) mag = 255;
					if (invert) mag = 255 - mag;
					data[((wid * y) + x) * 4] = mag;
					data[((wid * y) + x) * 4 + 1] = mag;
					data[((wid * y) + x) * 4 + 2] = mag;
					data[((wid * y) + x) * 4 + 3] = 255;
				}
			}
		}
		return data;
	}

	function wasmEnable() {
		wasmEnabled = !wasmEnabled;
		if (wasmEnabled) document.getElementById('wasmButton').innerHTML = 'WebAssembly disable';
		else document.getElementById('wasmButton').innerHTML = 'WebAssembly enable';
	}

	function handleFiles(e) {
		const canvasElement = document.getElementById('canvas');
		ctx = canvasElement.getContext('2d');
		const url = URL.createObjectURL(e.target.files[0]);
		const img = new Image();

		img.onload = function () {
			const {width, height} = img;
			w = width;
			h = height;
			canvasElement.width = width;
			canvasElement.height = height;

			ctx.drawImage(img, 0, 0, width, height);

			pixels = ctx.getImageData(0, 0, width, height);
			pixels2 = ctx.getImageData(0, 0, width, height);
			dataHeap = new Uint8Array(Module.HEAPU8.buffer, Module._malloc(pixels.data.length * pixels.data.BYTES_PER_ELEMENT),
				pixels.data.length * pixels.data.BYTES_PER_ELEMENT);
		};
		img.src = url;
	}

}());
