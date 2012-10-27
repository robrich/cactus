/*global grunt:false, module:true */
module.exports = function(grunt) {
	"use strict";

	grunt.loadNpmTasks('grunt-contrib');
	grunt.loadNpmTasks('grunt-css');
	grunt.loadNpmTasks('grunt-bump');

	// Project configuration.
	grunt.initConfig({
		pkg: '<json:package.json>',
		meta: {
			banner: '/* Cactus Draw - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
				'<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
				'* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>\n' +
				'* Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %>\n' +
				'* References Socket.IO (http://socket.io/)\n' +
				'* References Modernizr (http://modernizr.com/)\n' +
				'* References Really Simple Color Picker in jQuery (http://laktek.com/2008/10/27/really-simple-color-picker-in-jquery/)\n' +
				'* Requires jQuery (http://jquery.com/)\n' +
				'*/'
		},
		clean: {
			temp: 'temp/',
			dist: 'dist/'
		},
		test: {
			files: ['test/**/*.js']
		},
		lint: {
			files: ['grunt.js', 'src/app.js', 'src/www/!(modernizr|socket).js']
		},
		csslint: {
			www: {
				src: 'src/www/*.css',
				rules: {
					"box-model": false,
					"universal-selector": false
				}
			}
		},
		concat: {
			www: {
				src: ['<banner:meta.banner>','src/www/!(cactus).js','src/www/cactus*.js'],
				dest: 'dist/www/cactusdraw.js'
			},
			app: {
				src: ['<banner:meta.banner>','src/app.js'],
				dest: 'temp/app.js'
			},
			css: {
				src: ['<banner:meta.banner>','<config:csslint.www.src>'],
				dest: 'dist/www/cactusdraw.css'
			}
		},
		min: {
			www: {
				src: ['<banner:meta.banner>','<config:concat.www.dest>'],
				dest: 'dist/www/cactusdraw.min.js'
			},
			app: {
				src: ['<banner:meta.banner>','<config:concat.app.dest>'],
				dest: 'dist/app.js'
			}
		},
		cssmin: {
			www: {
				src: ['<banner:meta.banner>','<config:csslint.www.src>'],
				dest: 'dist/www/cactusdraw.min.css'
			}
		},
		copy: {
			www: {
				files: {
					'dist/www/': [
						'src/www/*.html',
						'src/www/*.jpg',
						'src/www/*.png',
						'src/www/*.gif'
					]
				}
			},
			app: {
				files: {
					'dist/node_modules/express/': 'src/node_modules/express/**',
					'dist/node_modules/socket.io/': 'src/node_modules/socket.io/**'
				}
			},
			main: {
				files: {
					'dist/': [
						'README.md',
						'package.json'
					]
				}
			}
		},
		watch: {
			files: '<config:lint.files>',
			tasks: 'default'
		},
		jshint: {
			options: {
				curly: true,
				eqeqeq: true,
				immed: true,
				latedef: true,
				newcap: true,
				noarg: true,
				sub: true,
				undef: true,
				boss: true,
				eqnull: true
			}
		}
	});

	// Default task.
	grunt.registerTask('default', 'clean lint csslint test concat min cssmin copy');
	grunt.registerTask('full', 'bump default');

	// regular command:
	// > grunt.cmd
	// to also bump the version:
	// > grunt.cmd full
};