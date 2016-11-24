var gulp = require('gulp'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    coffee = require('gulp-coffee'),
    plumber = require('gulp-plumber');
insert = require('gulp-insert');

gulp.task('watch', function () {
    gulp.watch(['src/**/*.*', 'libs/**/*.js'], ["build"]);
});

gulp.task("build", function () {
    return gulp.src([
            'bower_components/stackframe/dist/stackframe.min.js',
            'bower_components/error-stack-parser/dist/error-stack-parser.min.js',

            'node_modules/underscore/underscore-min.js',

            'libs/Class.js',
            'libs/chai.js',

            'src/Utilities/StackedError.js',

            'src/Class/LoggableClass.js',
            'src/Class/Singleton.js',
            'src/Utilities/BetterLog.js',
            'src/Utilities/Mailer.js',
            'src/Utilities/Scrapy.js',
            'src/Utilities/GoogleSheet.js',
        
            'src/Collections/Collection.js',
            'src/Collections/LargeCollection.js',
            'src/Collections/DeferredCollection.js',
            'src/Collections/Collector.js',

            'src/helpers.js'
        ])
        .pipe(plumber())
        // .pipe(uglify())
        .pipe(concat('tools.min.js'))
        .pipe(gulp.dest('./'));
});