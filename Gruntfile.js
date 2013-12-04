module.exports = function (grunt) {

    grunt.initConfig({
        jablConfig: grunt.file.readJSON('jabl.json'),
        jade: {
            compile: {
                options: {
                    data: {
                        debug: false
                    }
                },
                files: [
                    {
                        expand: true,     // Enable dynamic expansion.
                        cwd: 'src/jade/public',      // Src matches are relative to this path.
                        src: ['**/*.jade'], // Actual pattern(s) to match.
                        dest: '_public/',   // Destination path prefix.
                        ext: '.html'    // Dest filepaths will have this extension.
                    }
                ]
            }
        },
        concat: {
            options: {
                separator: ''
            },
            angular: {
                src: [
                    'src/js/src/<%= jablConfig.angular.appModuleName.camelized %>/<%= jablConfig.angular.appModuleName.camelized %>.prefix',
                    'src/js/src/<%= jablConfig.angular.appModuleName.camelized %>/**/*.js',
                    'src/js/src/<%= jablConfig.angular.appModuleName.camelized %>/<%= jablConfig.angular.appModuleName.camelized %>.js',
                    'src/js/src/<%= jablConfig.angular.appModuleName.camelized %>/<%= jablConfig.angular.appModuleName.camelized %>.suffix'
                ],
                dest: '_public/js/<%= jablConfig.appTitle.camelized %>.js'
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= jablConfig.appTitle.original %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
            },
            jid: {
                files: {
                    '_public/js/<%= jablConfig.appTitle.camelized %>.min.js': ['<%= concat.angular.dest %>']
                }
            }
        },
        jshint: {
            beforeConcat: {
                src: ['gruntfile.js', 'src/js/src/<%= jablConfig.angular.appModuleName.camelized %>/**/*.js']
            },
            afterConcat: {
                src: [
                    '<%= concat.angular.dest %>'
                ]
            },
            options: {
                // options here to override JSHint defaults
                globals: {
                    jQuery: true,
                    console: true,
                    module: true,
                    document: true,
                    angular: true
                },
                globalstrict: false
            }
        },
        less: {
            jid: {
                files: {
                    "_public/css/<%= jablConfig.appTitle.camelized %>.css": "src/less/<%= jablConfig.appTitle.camelized %>.less"
                }
            }
        },
        connect: {
            server:{
                options: {
                    port: 9000,
                    base: '_public',
                    hostname: 'localhost',
                    keepalive: true,
                    livereload: true
                }
            }
        },
        watch: {
            options: {
                livereload: true
            },
            files: [
                'Gruntfile.js',
                'src/**/*'
            ],
            tasks: ['default']
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jade');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-notify');

    grunt.registerTask('default', ['jade', 'less', 'jshint:beforeConcat', 'concat', 'jshint:afterConcat', 'uglify']);
    grunt.registerTask('build', ['default']);
    grunt.registerTask('serve', ['connect']);
    grunt.registerTask('livereload', ['default', 'watch']);

};