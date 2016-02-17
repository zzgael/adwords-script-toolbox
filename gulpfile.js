var gulp = require('gulp'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    plumber = require('gulp-plumber');

gulp.task('watch',["build"], function() {
  gulp.watch(['src/**/*.js','libs/**/*.js'],["build"]);
});

gulp.task("build",function () {
  return gulp.src([
    'node_modules/underscore/underscore-min.js',

    'libs/Class.js',
    'libs/Singleton.js',
    'libs/BetterLog.js',
    'libs/LoggableClass.js',

    'src/Scrapy.js',
    'src/GoogleSheet.js',
    'src/Collections/Collection.js',
    'src/Collections/DeferredCollection.js'
  ])
    .pipe(plumber())
    .pipe(uglify())
    .pipe(concat('tools.js'))
    .pipe(gulp.dest('./'));
});
