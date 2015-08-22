/*jshint node:true */

'use strict';

var gulp = require('gulp');
var gulpIf = require('gulp-if');
var gutil = require('gulp-util');
var csslint = require('gulp-csslint');
var header = require('gulp-header');
var jshint = require('gulp-jshint');
var minifyCss = require('gulp-minify-css');
//var recess = require('gulp-recess');
var uglify = require('gulp-uglify');

var exec = require('child_process').exec;
var through2 = require('through2');

// csslint options: https://github.com/stubbornella/csslint/wiki/Rules-by-ID
// false means off, 2 means error, else warning: https://github.com/gruntjs/grunt-contrib-csslint

var paths = {
	js: ['**/*.js', '!**/node_modules/**', '!**/dist/**/*.js'],
	jshint: ['Gulpfile.js', 'app.js', 'public/cactusdraw.js'],
	css: ['public/*.css'],
	img: ['public/*.gif', 'public/*.png', 'public/*.jpg'],
	html: 'public/*.html',
	pkg: 'package.json',
	dist: '../dist',
	distClient: '../dist/public'
};

var gitHash;
var headerText;

function buildHeader() {
	if (!headerText) {
		var now = new Date();
		var copyrightHeader = 'Copyright '+now.getFullYear()+' Rob Richardson, All Rights Reserved';
		headerText = '/*! '+copyrightHeader+'\r\n	Hash: '+gitHash+'\r\n	Build date: '+now.toISOString()+' */\r\n';
	}
	return headerText;
}

gulp.on('err', function (e) {
	console.log();
	var msg = e && e.err && e.err.message || JSON.stringify(e);
	console.log('Gulp build failed: '+msg);
	process.exit(1);
});

gulp.task('gitHash', function (cb) {
	exec('git log -1 --format=%h', function (error, stdout, stderr) {
		if (stderr) {
			gutil.log(stderr);
		}
		if (stdout) {
			stdout = stdout.trim(); // Trim trailing cr-lf
		}
		if (error) {
			gutil.log('git errored with exit code '+error.code);
			return cb(error);
		}
		if (!stdout) {
			return cb(new Error('git log retured no results'));
		}
		gitHash = stdout;
		gutil.log("git hash: '"+gutil.colors.yellow(gitHash)+"'");
		cb(null);
	});
});

var jshintsuccess = true;
var jshintReporter = function () {
	return through2.obj(function (file, enc, cb) {
		if (!file.jshint.success) {
			jshintsuccess = false;
			file.jshint.results.forEach(function (r) {
				if (r && r.error) {
					var err = r.error;
					gutil.log('['+gutil.colors.red('JSHint')+'] '+
						gutil.colors.cyan(file.path.replace(file.cwd,''))+' '+
						gutil.colors.red('[')+gutil.colors.yellow('L'+err.line+':C'+err.character)+gutil.colors.red(']')+' '+
						err.code+':'+err.reason+' \''+(err.evidence||'').trim()+'\'');
				}
			});
		}
		cb(null, file);
	});
};

var csslintsuccess = true;
var csslintReporter = function () {
	return through2.obj(function (file, enc, cb) {
		if (!file.csslint.success) {
			csslintsuccess = false;
			file.csslint.results.forEach(function (r) {
				if (r && r.error) {
					var err = r.error;
					gutil.log('['+gutil.colors.red('CSSLint')+'] '+
						gutil.colors.cyan(file.path.replace(file.cwd,''))+' '+
						gutil.colors.red('[')+gutil.colors.yellow(
							err.line ? ('L'+err.line+':C'+err.col) : 'GENERAL'
						)+gutil.colors.red(']')+' '+
						err.rule.id+':'+err.rule.desc+' '+
						(err.evidence ? ('\''+(err.evidence||'').trim()+'\'') : '')
					);
				}
			});
		}
		cb(null, file);
	});
};

gulp.task('jshint', function(cb) {
	gulp.src(paths.jshint)
		.pipe(jshint('.jshintrc'))
		.pipe(jshintReporter())
		.on('end', function () {
			if (jshintsuccess) {
				cb(null);
			} else {
				cb(new Error('JSHint failed'));
			}
		});
});

gulp.task('jsmin', ['gitHash'], function() {
	return gulp.src(paths.js)
		.pipe(uglify())
		.pipe(gulpIf(/cactusdraw\.js/, header(buildHeader())))
		.pipe(gulp.dest(paths.dist));
});

gulp.task('csslint', function(cb) {
	// csslint doesn't like bootstrap, so can't lint Site.css -- really don't like that
	gulp.src(paths.css)
		.pipe(csslint('./.csslintrc'))
		.pipe(csslintReporter())
		.on('end', function () {
			if (csslintsuccess) {
				cb(null);
			} else {
				cb(new Error('CSSLint failed'));
			}
		});
});

gulp.task('cssrecess', function () {
	return gulp.src(['Web/**/*.css', 'Web/**/*.less', '!**/libs/**', '!**/m/**'])
		/*.pipe(recess({
			noIDs: false,
			strictPropertyOrder: false,
			noUnderscores: false,
			noOverqualifying: false,
			noUniversalSelectors: false
		}))*/;
});

gulp.task('cssmin', ['gitHash'], function () {
	return gulp.src(paths.css)
		.pipe(minifyCss())
		.pipe(header(buildHeader()))
		.pipe(gulp.dest(paths.distClient));
});

gulp.task('imgmin', function () {
	return gulp.src(paths.img)
		.pipe(gulp.dest(paths.distClient));
});

gulp.task('htmlmin', function () {
	return gulp.src(paths.html)
		.pipe(gulp.dest(paths.distClient));
});

gulp.task('pkg', function () {
	return gulp.src(paths.pkg)
		.pipe(gulp.dest(paths.dist));
});

gulp.task('default', ['jshint', 'csslint', 'jsmin', 'cssmin', 'imgmin', 'htmlmin', 'pkg']);
