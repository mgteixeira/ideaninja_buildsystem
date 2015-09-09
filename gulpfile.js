var gulp = require('gulp'),
    gutil = require('gulp-util'),
    browserify = require('gulp-browserify'),
    compass = require('gulp-compass'),
    connect = require('gulp-connect'),
    gulpif = require('gulp-if'),
    uglify = require('gulp-uglify'),
    minifyHTML = require('gulp-minify-html'),
    concat = require('gulp-concat');
    path = require('path');
    save = require('gulp-save');
    sitemap = require('gulp-sitemap');
    ejs = require("gulp-ejs");
    imagemin = require('gulp-imagemin');
    pngquant = require('imagemin-pngquant');
    robots = require('gulp-robots');
    runSequence = require('run-sequence');
    var clean = require('gulp-clean');
 

var env,
    jsSources,
    sassSources,
    htmlSources,
    outputDir,
    sassStyle;

env = 'production';
//env = 'development';

if (env==='development') {
  outputDir = 'builds/development/';
  sassStyle = 'expanded';
} else {
  outputDir = 'builds/production/';
  sassStyle = 'compressed';
}

jsSources = [
  'components/scripts/jquery.js',
  'components/scripts/jqloader.js',
  'components/scripts/transitions-bootstrap.js',
  'components/scripts/modal-bootstrap.js',
  'components/scripts/script.js'
];

sassSources = ['components/sass/style.scss'];
htmlSources = [outputDir + '*.html'];


gulp.task('js', function() {
  gulp.src(jsSources)    //keywords

    .pipe(concat('script.js'))
    .pipe(browserify())
    .on('error', gutil.log)
    .pipe(gulpif(env === 'production', uglify()))
    .pipe(gulp.dest(outputDir + 'js'))
    .pipe(connect.reload())
});

//creating robots.txt
gulp.task('robots', function () {
    gulp.src(outputDir + '*.html')
        .pipe(robots({ 
          useragent: '*', 
          out: outputDir + 'robots.txt'
          }))
});

//optimizes images
gulp.task('images', function () {
    return gulp.src('components/images/**/*.*')
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()]
        }))
        .pipe(gulp.dest(outputDir +'images'));

});

//Enables compass with Susy and Breakpoint
gulp.task('compass', function() {
  gulp.src(sassSources)
    .pipe(compass({
      sass: 'components/sass',
      css: outputDir + 'css',
      image: outputDir + 'images',
      style: sassStyle,
      require: ['susy', 'breakpoint']
    })
    .on('error', gutil.log))
//    .pipe(gulp.dest( outputDir + 'css'))
    .pipe(connect.reload())
});

gulp.task('watch', function() {
  gulp.watch(jsSources, ['js']);
  gulp.watch(['components/images/**/*.*','components/images/**/**/*.*'] , ['images']);
  gulp.watch(['components/sass/*.scss', 'components/sass/*/*.scss'], ['compass']);
  gulp.watch(outputDir +'*.html', ['sitemap']);
  gulp.watch(['templates/*.ejs','templates/partials/*.ejs'], function() {
    runSequence(
      ['ejs'],
      'html');
    }
  );
});

gulp.task('connect', function() {
  connect.server({
    root: outputDir,
    livereload: true
  });
});

//Reloads server and if production minifies 
gulp.task('html', function() {
  return gulp.src(outputDir + '*.html')
    .pipe(gulpif(env === 'production', minifyHTML()))
    .pipe(gulpif(env === 'production', gulp.dest(outputDir)))
    .pipe(connect.reload())
});

//compiles EJS
gulp.task('ejs', function(){
    return gulp.src("templates/*.ejs")
    .pipe(ejs({
          compileDebug: true,
          client: true    
      }))
  .pipe(gulp.dest(outputDir)); 
}); 


//create Sitemap

gulp.task('sitemap', function () {
    return gulp.src(outputDir + '*.html')
        .pipe(sitemap({
            siteUrl: 'http://ideaninja.io'
        }))
        .pipe(gulp.dest(outputDir));
});


gulp.task('move', function() {
  return gulp.src('components/scripts/countable.js')
  .pipe(gulp.dest(outputDir+ 'js'))
});


gulp.task('clean', function () {
    return gulp.src(['outputDir' + '*.*', outputDir + '**/*.*'])
        .pipe(clean({force: true}))
  });

gulp.task('default', function(callback) {
  runSequence('clean', 
              ['ejs', 'images','compass', 'move','js'],
              'html', 
              ['robots','sitemap', 'connect'],
              'watch',
              callback);
});