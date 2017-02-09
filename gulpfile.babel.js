'use strict';

import config from './config.json';

import gulp from 'gulp';
import sass from 'gulp-sass';
import autoprefixer from 'gulp-autoprefixer';
import sourcemaps from 'gulp-sourcemaps';
import cleanCSS from 'gulp-clean-css';
import pug from 'gulp-pug';
import babel from 'gulp-babel';
import clean from 'gulp-clean';
import browserify from 'browserify';
import babelify from 'babelify';
import source from 'vinyl-source-stream';
import watchify from 'watchify';
import uglify from 'gulp-uglify';
import pump from 'pump';
import util from 'gulp-util';
import concat from 'gulp-concat';
import connect from 'gulp-connect-php';
import browserSync from 'browser-sync';
import gulpCopy from 'gulp-copy';
import gulpRename from 'gulp-rename';

// compile sass files
gulp.task('compile-sass', ()=>{
	return gulp.src(config.paths.styles.src)
		.pipe(sourcemaps.init())
		.pipe(sass().on('error', sass.logError))
		.pipe(autoprefixer())
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest(config.paths.styles.dest));
});

// concat pure.css and generated css file // refine later...
gulp.task('styles', ['compile-sass'], ()=>{

	return gulp.src([ config.paths.styles.purecss, config.paths.styles.dest + "/main.css"])
		.pipe(concat('main.css'))
		.pipe(gulp.dest(config.paths.css))

})


// minify css
gulp.task("minify-css", ()=>{
	return gulp.src(config.paths.css + "/**/*.css")
		.pipe(cleanCSS({processImport: false}))
		.pipe(gulp.dest(config.paths.css))
});


gulp.task("copy", ()=>{
	return gulp.src(config.paths.copyfiles.src)
		// .pipe(gulpCopy(config.paths.copyfiles.dest))
		.pipe(gulp.dest(config.paths.copyfiles.dest))
})


// remove unwanted files
gulp.task("clean", ()=>{
	return gulp.src(config.paths.cleanfiles, {read:false})
		.pipe(clean())
});


// compile index. pug php
gulp.task("pug-main", ()=>{
	// return gulp.src("./src/pug/index.php.pug")
	return gulp.src("./src/pug/index.pug")
	.pipe(pug({
		pretty: true
	}))
	// .pipe(gulpRename("index.php"))
	.pipe(gulp.dest("./deploy"));
});

// compile main js in build
gulp.task('bundle-js-main', ()=>{
	return browserify({entries: config.paths.main.src, debug:true })
	// .transform(riotify, {"template":"pug", "ext":'.pug',"type":"es6", sourceMaps:true})
	.transform(babelify, {presets:"es2015"})
	.bundle()
	.pipe(source(config.paths.main.jsfilename))
	.pipe(gulp.dest(config.paths.main.dest))
});



// compress main js
gulp.task('compress-js', ()=>{
	return pump([
		gulp.src(config.paths.js + "/**/*.js"),
		uglify(),
		gulp.dest(config.paths.js)
	] );
})



// server
gulp.task('php', ()=>{
	return connect.server({
		base: "./deploy",
		port: 8005
		// keepalive: true
	})
})

gulp.task('browser-sync', ['php'], ()=>{
	return browserSync.init({
		proxy: 'localhost:8005',
		port: 8888,
		open: false
		// natify: false
	}, ()=>{
		gulp.src(config.paths.css + "**/*.css")
			.pipe(browserSync.stream())		
	})
})

gulp.task("server", ['browser-sync'])


// watch folders/files
gulp.task('watch-main', (gulpCallback)=>{
	gulp.watch([config.paths.pug.src], ['pug-main']);
	gulp.watch([config.paths.styles.src], ['styles']);
	gulp.watch(["./src/**/*.js"], ['bundle-js-main']);
	gulp.watch([config.paths.watchfiles]).on('change', browserSync.reload );

	gulp.watch(config.paths.css + "**/*.css", ()=>{
		gulp.src(config.paths.css + "**/*.css")
			.pipe(browserSync.stream())
	})

	gulpCallback()

});



// development 
gulp.task("default", ['bundle-js-main', 'pug-main', 'styles', 'server', 'watch-main']);

// minify / clean up
gulp.task("minify", ['clean', 'compress-js', 'minify-css']);




