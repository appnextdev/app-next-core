const gulp = require('gulp'),
      concat = require('gulp-concat'),
      minify = require('gulp-minify'),
      ts = require('gulp-typescript')

function save()
{
    return gulp.dest('dist')
}
 
gulp.task('build-modules', () =>
{
    const project = ts.createProject('tsconfig.json'),
          files = project.src().pipe(project())

    return files.js.pipe(save())
})

gulp.task('build-lib', () =>
{
    const files = gulp.src
    ([
        'node_modules/garden-loader/dist/garden-loader.js',
        'dist/app-next-core-modules.js',
        'build/lib-bootstrap.js'
    ])

    return files.pipe(concat('app-next-core.js'))
                .pipe(save())
})

gulp.task('minify-build', () =>
{
    const files = gulp.src
    ([
        'dist/app-next-core-modules.js',
        'dist/app-next-core.js'
    ])

    return files.pipe(minify({ ext: { src: '.js', min: '.min.js' } }))
                .pipe(save())
})

gulp.task('build', gulp.series('build-modules', 'build-lib', 'minify-build'))