module.exports = function (grunt) {

  /**
   * Configuration.
   */

  grunt.initConfig({
    uglify: {
      default: {
        options: {
          preserveComments: 'some',
          sourceMap: 'angular-primus.min.map',
          sourceMappingURL: 'angular-primus.min.map'
        },
        files: {
          'angular-primus.min.js': 'angular-primus.js'
        }
      }
    }
  });

  /**
   * Tasks.
   */

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.registerTask('default', ['uglify']);
};