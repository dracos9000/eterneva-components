// Closure


	let currentCut = 'asscher',
		currentColor = 'colorless';

	

	/*
	* Dev logger
	*/
	function devLogger(msg) {
		// console.log(msg);
	}

	/*
	* Load the animation images for the current cut and color
	*/
	function loadCut(prefix) {
		let i = 0, l = 21, numLength = 5, promises = [],
			container = document.getElementById('vizualizer-animator-images');

		devLogger('Loading cut ' + prefix);
		container.style.height = Math.max(container.offsetHeight, 200) + 'px';
		container.innerHTML = '';
		document.getElementById('vizualizer-animator').classList.add('loading');

		for(; i < l; i++) {
			promises.push(new Promise(function(resolve, reject) {
				let img = new Image();
				img.src = 'https://res.cloudinary.com/etnva/image/upload/diamond-visualizer/' + prefix + '/' + prefix + '_' + (Array.apply(null, Array(numLength - i.toString().length)).map(function() { return '0' }).join('') + i.toString()) +'.png';
				img.onload = function() {
					resolve();
				};
				container.appendChild(img);
			}));
		}

		return Promise.all(promises).then(function() {
			devLogger(prefix + ' cut loaded');
			container.style.height = 'auto';
			document.getElementById('vizualizer-animator').classList.remove('loading');
		})
	}

	/*
	* Create dragger
	*/
	var vizualizer = function vizualizerDragger() {
		let container, items, length,
			active = 0,
			current = 0,
			timeout = false;

		function init(id) {
			container = document.getElementById(id);
			items = container.querySelectorAll('img');
			length = items.length;
			step = 100 / length;
			current = length - 1;

			window.removeEventListener('scroll', onScroll);
			onScroll();
			window.addEventListener('scroll', onScroll);
		}

		function onScroll(e) {
			let rect = container.getBoundingClientRect();
			if(window.scrollY > rect.y - (container.offsetHeight / 3)) {
				stepTo(0, 60);
				window.removeEventListener('scroll', onScroll);
			}
		}
		
		rangeSlider('vizualizer-animator', function(percent) {
			active = Math.floor(Math.min(percent / step, length - 1));
			devLogger('Dragging at ' + percent + ', active: ' + active);
			stepTo(active, 40);
		});

		function stepTo(nextActive, interval) {
			active = nextActive;
			if( ! timeout) {
				timeout = setInterval(function() {
					if(current === active) {
						clearInterval(timeout);
						timeout = false;
						return;
					}
					items[current].classList.remove('active');
					current = active > current ? current + 1 : current - 1;
					items[current].classList.add('active');
				}, interval);
			}
		}

		return {
			stepTo: stepTo,
			init: init
		}
	}();

	function rangeSlider(id, onDrag) {
		devLogger('Creating rangeSlider on ' + id);
		var range = document.getElementById(id),
			down = false,
			rangeWidth, rangeLeft;

		range.addEventListener('mousedown', startDrag);
		range.addEventListener('touchstart', startDrag);
		document.addEventListener('mousemove', updateDragger);
		document.addEventListener('touchmove', updateDragger);
		document.addEventListener('mouseup', function() { down = false; });
		document.addEventListener('touchend', function() { down = false; });

		function startDrag(e) {
			devLogger('mousedown');
			let rect = this.getBoundingClientRect();
			rangeWidth = this.offsetWidth;
			rangeLeft = rect.left;
			down = true;
			updateDragger(e);
			return false;
		}

		function updateDragger(e) {
			let x = e.pageX || (e.changedTouches.length >= 1 && e.changedTouches[0].clientX);
			if (down && x >= rangeLeft && x <= (rangeLeft + rangeWidth)) {
				// dragger.style.left = x - rangeLeft - draggerWidth + 'px';
				if (typeof onDrag == 'function') onDrag(Math.round(((x - rangeLeft) / rangeWidth) * 100));
			}
		}
	}

	/*
	* Handle form submission
	*/
	function handleEngraveForm() {
		let form = document.getElementById('vizualizer-name-form'),
			nameField = document.getElementById('vizualizer-engrave-name'),
			name;
		form.addEventListener('submit', function(e) {
			e.preventDefault();
			name = nameField.value;
			document.getElementById('vizualizer-zoom-name').innerText = name;
			document.getElementById('vizualizer-zoom').style.display = 'flex';
			document.getElementById('vizualizer-animator-images').classList.add('zoomed');
			vizualizer.stepTo(9, 40);
			setTimeout(function() {
				document.getElementById('vizualizer-zoom').classList.add('active');
			}, 220);
		});

		document.querySelectorAll('.vizualizer-zoom-close')[0].addEventListener('click', function(e) {
			e.preventDefault();
			document.getElementById('vizualizer-zoom').classList.remove('active');
			document.getElementById('vizualizer-animator-images').classList.remove('zoomed');
			vizualizer.stepTo(0, 40);
			setTimeout(function() {
				document.getElementById('vizualizer-zoom').style.display = 'none';
			}, 400);
		});
	}

	/*
	* Handle changing the cut type
	*/
	function handleCutChange() {
		document.getElementById('vizualizer-cuts').addEventListener('click', function(e) {
			devLogger('Cut click ' + e.target.tagName);
			e.preventDefault();
			
			let anchor = e.target, i = 0;
			while(anchor.tagName !== 'A' && i < 100) {
				anchor = anchor.parentNode;
				i++;
			}

			document.querySelectorAll('#vizualizer-cuts .selected').forEach(function(e) {
				e.classList.remove('selected');
			});
			anchor.classList.add('selected');

			currentCut = anchor.getAttribute('data-value');
			devLogger('Cut selected ' + anchor.getAttribute('data-value'));
			loadCut(currentCut + '-' + currentColor).then(function() {
				vizualizer.init('vizualizer-animator-images');
			});
		})
	}

	/*
	* Hangle changing the color
	*/
	function handleColorChange() {
		document.getElementById('vizualizer-color-options').addEventListener('click', function(e) {
			e.preventDefault();
			let el = e.target.classList.contains('option') ? e.target : e.target.parentNode.classList.contains('option') ? e.target.parentNode : null;
			if(el) {
				currentColor = el.getAttribute('data-color');
				devLogger('Color selected ' + currentColor);
				document.querySelectorAll('#vizualizer-color-options .selected')[0].classList.remove('selected');
				el.classList.add('selected');
				document.getElementById('vizualizer-zoom').style.backgroundImage = 'url(https://res.cloudinary.com/etnva/image/upload/diamond-visualizer/zoomed/zoomed-' + currentColor + '-diamond.jpg)';
				loadCut(currentCut + '-' + currentColor).then(function() {
					vizualizer.init('vizualizer-animator-images');
				});
			}
		});
	}

	/*
	* Load the app
	*/
