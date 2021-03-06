/* Cactus Draw */
/* jshint browser:true */
/*global Modernizr:false, io:false, jQuery:true, Image, FileReader, confirm, alert */
var cactusUrl = (function () {
	"use strict";
	var ts = document.getElementsByTagName("script");
	return ts[ts.length-1].src;
}());

(function ($, window, document, undefined) {
	"use strict";
	var cactusdraw = function (that) {

		if (!Modernizr.canvas) {
			that.text("your browser doesn't support cactus draw");
			return;
		}

		var room = that.data("room") || "public";
		var writable = !!that.data("writable");

		that.html(
			'<div class="topbar">'+
				'<div class="topContent">'+
					'<a href="http://www.cactusdraw.com" target="_blank">'+
						'<img class="cactus" src="http://www.cactusdraw.com/cactus.png" width="14px" height="21px" alt="Cactus" />'+
					'</a>&nbsp;&nbsp;'+
					'<input type="color" class="color" value="#000000" placeholder="#000000" />&nbsp;&nbsp;'+
					'<input type="number" class="linewidth" value="2" />&nbsp;&nbsp;'+
					'<input type="file" class="files" /><input type="button" class="fakefiles" value="img" />&nbsp;&nbsp;'+
					'<input type="button" class="clear" value="clear" />&nbsp;&nbsp;'+
					'<input type="button" class="save" value="save" />'+
				'</div>'+
			'</div>'+
			'<canvas class="canvas" width="100" height="100"><p>Your browser doesn\'t support cactus draw</p></canvas>'
		);

		var $topbar = $(".topbar", that);
		var $color = $(".color", that);
		var $linewidth = $(".linewidth", that);
		var $clear = $(".clear", that);
		var $files = $(".files", that);
		var $fakefiles = $(".fakefiles", that);
		var $save = $(".save", that);

		var $canvas = $(".canvas", that);
		var canvas = $canvas.get(0);

		var ctx = canvas.getContext('2d');

		// Ensure we match the cactus draw server's url in spite of the widget's host
		var linkParser = document.createElement("a");
		linkParser.href = cactusUrl;
		var socketUrl = linkParser.protocol+'//'+linkParser.host+'/';
		var socket = io.connect(socketUrl);

		// Offset the window drawing position by the canvas's position so it'll draw on the canvas
		var canvasLeft = $canvas.offset().left;
		var canvasTop = $canvas.offset().top;

		//
		// drawing functions
		//

		var clear = function () {
			ctx.clearRect(0,0,canvas.width, canvas.height);
		};

		var drawImage = function(options, callback) {
			var img = new Image();
			img.onload = function(){
				ctx.drawImage(img, 0, 0);
				if (callback) {
					callback();
				}
			};
			img.src = options.image;
		};
		var draw = function (options) {
			ctx.strokeStyle = options.color;
			ctx.lineWidth = options.width;
			ctx.beginPath();
			ctx.moveTo(options.x1, options.y1);
			ctx.lineTo(options.x2, options.y2);
			ctx.lineCap = "round";
			ctx.stroke();
		};

		//
		// socket-io functions
		//

		// -server is "from server to client"
		// -client is "from client to server"
		socket.on('connect', function () {
			socket.emit("connect-client", room);
		});
		socket.on('line-server', function (data) {
			draw(data);
		});
		socket.on("drawing-server", function (drawing) {
			for (var i = 0; i < drawing.length; i++) {
				draw(drawing[i]);
			}
		});
		socket.on("image-server", function (data) {
			drawImage(data, function () {
				if (data.drawing) {
					for (var i = 0; i < data.drawing.length; i++) {
						draw(data.drawing[i]);
					}
				}
			});
		});
		socket.on('clear-server', function (/*data*/) {
			clear();
		});

		var drawSend = function (data) {
			socket.emit("line-client", data);
		};
		var drawImageSend = function (data) {
			socket.emit("image-client", data);
		};
		var clearSend = function () {
			socket.emit("clear-client");
		};

		//
		// mouse and touch move handlers
		//

		var doTheDraw = function (data) {
			draw(data);
			drawSend(data);
		};

		// xPos and yPos are previous point, drawing is 'mouse or touch is down' e.g. currently drawing
		var drawing = false, xPos, yPos;
		var userColor = (window.localStorage && window.localStorage[room+'-userColor']) || $color.val();
		var userWidth = (window.localStorage && window.localStorage[room+'-userWidth']) || parseFloat($linewidth.val());
		// If we pulled values from localStorage, we need to populate the interface
		$color.val(userColor);
		$linewidth.val(userWidth);

		var handleMove = function (x, y) {
			// Offset the window drawing position by the canvas's position so it'll draw on the canvas
			var x2 = x - canvasLeft,
				y2 = y - canvasTop;
			if (!drawing) {
				drawing = true;
			} else {
				doTheDraw({color: userColor, width: userWidth, x1: xPos, y1: yPos, x2: x2, y2: y2});
			}
			xPos = x2;
			yPos = y2;
		};

		if (!writable) {
			$topbar.hide();
			// Can't set $(".canvas").width() because jQuery is going to scale, not resize
			canvas.width = that.width();
			canvas.height = that.height();
			$canvas.css("cursor","auto");
			return; // Don't wire up events
		}

		if (Modernizr.touch) {
			// touch
			$canvas.bind('touchstart', function (/*e*/) {
				$canvas.bind('touchmove', function (event) {
					event.preventDefault();
					var e = event.originalEvent;
					handleMove(e.touches[0].pageX, e.targetTouches[0].pageY);
					return false;
				});
			});
			$(document).bind('touchend', function (/*event*/) {
				$canvas.unbind('touchmove');
				drawing = false;
			});
		}
		// mouse
		$canvas.mousedown(function (e) {
			if (e.button === 0) {
				$canvas.bind('mousemove', function (event) {
					event.preventDefault();
					handleMove(event.pageX, event.pageY);
					return false;
				});
				return false;
			}
		});
		$(document).mouseup(function (/*event*/) {
			$canvas.unbind('mousemove');
			drawing = false;
		});

		//
		// file upload
		//

		var doTheImage = function (imageData) {
			var options = {image: imageData};
			drawImage(options);
			drawImageSend(options);
		};

		var imageResize = function (img) {

			var maxWidth = canvas.width;
			var maxHeight = canvas.height;

			var imgWidth = img.width;
			var imgHeight = img.height;

			if (imgWidth > maxWidth) {
				imgHeight = Math.round(imgHeight * maxWidth/imgWidth);
				imgWidth = maxWidth;
			}
			if (imgHeight > maxHeight) {
				imgWidth = Math.round(imgWidth * maxHeight/imgHeight);
				imgHeight = maxHeight;
			}

			var data = null;

			if (imgWidth !== img.width || imgHeight !== img.height) {
				// resize
				var resizeCanvas = $("<canvas>").get(0);
				resizeCanvas.width = imgWidth;
				resizeCanvas.height = imgHeight;
				var resizeCanvasCtx = resizeCanvas.getContext('2d');
				resizeCanvasCtx.drawImage(img, 0, 0, imgWidth, imgHeight);
				data = resizeCanvas.toDataURL("image/jpeg");
			} else {
				// no need to resize
				data = img.src;
			}
			doTheImage(data);
		};

		var fileToImage = function(fileContent) {
			var resizeImg = new Image();
			resizeImg.onload = function () {
				imageResize(resizeImg);
			};
			resizeImg.src = fileContent;
		};

		var handleFile = function (f) {
			var reader = new FileReader();
			reader.onload = function (e) {
				fileToImage(e.target.result);
			};
			// Read in the image file as a data URL.
			reader.readAsDataURL(f);
		};

		var handleFileSelect = function (evt) {
			var files = evt.target.files, i, f, chosen;
			for (i = 0; i < files.length; i++) {
				f = files[i];
				// Only process image files.
				if (!f.type.match('image.*')) {
					continue;
				}
				handleFile(f);
				// clear the file control
				$files.val('');
				chosen = true;
				break; // Only grab the first one
			}
			if (!chosen) {
				alert("Pick an image file");
			}
			$files.val(''); // clear the file control
		};

		if (FileReader) {
			$files.change(handleFileSelect);
			$fakefiles.click(function (e) {
				if (e.button === 0) {
					$files.click(); // Shim from fake, stylable button to real button
					return false;
				}
			});
		} else {
			$files.hide();
			$fakefiles.hide();
		}

		//
		// other button handlers
		//

		$linewidth.change(function () {
			var val = parseFloat($(this).val());
			if (isNaN(val) || val < 1 || val > 100) {
				// Ignore invalid
				$(this).val(userWidth);
			} else {
				userWidth = val;
				if (window.localStorage) {
					window.localStorage.userWidth = val;
				}
			}
		});

		$color.change(function () {
			var val = $(this).val();
			// FRAGILE: presume it's a valid color
			userColor = val;
			if (window.localStorage) {
				window.localStorage.userColor = val;
			}
		});

		$clear.click(function (e) {
			if (e.button !== 0) {
				return;
			}
			if(confirm('are you sure you want to clear the image for all users?')) {
				clear();
				clearSend();
			}
			return false;
		});

		$save.click(function (e) {
			if (e.button !== 0) {
				return; // It wasn't a left click
			}
			// Setting a filename and default extension requires server interaction:
			// http://www.joeltrost.com/blog/2012/01/29/html5-canvas-save-a-jpeg-with-extension/
			var data = canvas.toDataURL();
			window.location.href = data.replace("image/png", "image/octet-stream");
			return false;
		});

		if (!Modernizr.inputtypes.color) {
			$color.colorPicker();
		}

		// If the frame resizes, resize the canvas
		var resizeCanvas = function () {
			// Can't set $(".canvas").width() because jQuery is going to scale, not resize
			var data = (ctx && canvas) ? canvas.toDataURL() : null;
			canvas.width = that.width();
			canvas.height = that.height() - $topbar.height();
			if (ctx && canvas && data) {
				drawImage({image:data});
			}
		};
		that.resize(resizeCanvas);
		resizeCanvas();

	};

	$.fn.cactusdraw = function () {
		this.each(function() {
			cactusdraw($(this));
		});
	};

	// FRAGILE: A bit weird for a plugin to launch itself,
	// FRAGILE: but must presume the class name for css
	// FRAGILE: so may as well just make it easier for users to consume
	$(document).ready(function () {
		$(".cactusdraw").cactusdraw();
	});
})(jQuery, window, window.document);
