[Cactus Draw](http://cactusdraw.com/)
=====================================

Cactus Draw is an open-source collaborative drawing app that grew out of [DesertJS](http://desertjs.org/) Hackathon.

How to Use
----------

1. Reference jQuery (such as on [Google's CDN](https://developers.google.com/speed/libraries/devguide#jquery))

2. Reference the css file: [http://cactusdraw.com/cactusdraw.min.css](http://cactusdraw.com/cactusdraw.min.css)
or [http://cactusdraw.com/cactusdraw.css](http://cactusdraw.com/cactusdraw.css)

3. Reference the javascript file: [http://cactusdraw.com/cactusdraw.min.js](http://cactusdraw.com/cactusdraw.min.js)
or [http://cactusdraw.com/cactusdraw.js](http://cactusdraw.com/cactusdraw.js)

4. Create a div:

   a. class="cactusdraw"

   b. data-room="some-unique-name"

   c. data-writable="true"

   Make the canvas read-only by setting data-writable="false"

   d. other styles to taste (width, height, border, etc)

Sample
------

	<div class="cactusdraw" data-room="public" data-writable="true"></div>
	<script src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js"></script>
	<link rel="stylesheet" href="http://cactusdraw.com/cactusdraw.css" type="text/css" />
	<script src="http://cactusdraw.com/cactusdraw.js"></script>

## License
Copyright (c) 2012-2015 Rob Richardson
Licensed under the MIT license.
