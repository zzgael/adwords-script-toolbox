var gulp = require('gulp'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    coffee = require('gulp-coffee'),
    plumber = require('gulp-plumber');
insert = require('gulp-insert');

gulp.task('watch', ["ybadcount", "adcore_connector"], function () {
    gulp.watch(['src/**/*.*', 'libs/**/*.js', 'scripts/**/*.*'], ["ybadcount", "adcore_connector"]);
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
        .pipe(concat('tools.js'))
        .pipe(gulp.dest('./htdocs/'));
});

gulp.task("build_scripts_coffee", ["build"], function () {
    return gulp.src([
            'scripts/adcore_connector/*.coffee'
        ])
        .pipe(plumber())
        .pipe(coffee({bare:true}))
        .pipe(concat('adcore_connector.js'))
        .pipe(gulp.dest('./htdocs/'));
});


/////////////////////////

gulp.task("ybadcount", ["build"], function () {
    return gulp.src([
            'htdocs/tools.js',
            'scripts/ybadcount.js'
        ])
        .pipe(plumber())
        .pipe(concat('ybadcount.js'))
        .pipe(gulp.dest('./htdocs/'));
});


gulp.task("adcore_connector", ["build_scripts_coffee"], function () {
    return gulp.src([
            'htdocs/tools.js',
            'htdocs/adcore_connector.js'
        ])
        .pipe(plumber())
        .pipe(concat('adcore_connector.js'))
        .pipe(gulp.dest('./htdocs/'));
});

