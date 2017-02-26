module.exports = function(grunt) {
	grunt.initConfig({
		clean: ['out/css', 'out/js'],

		connect: {
			dev: {
				options: {
					port: 8080
				}
			},

			srv: {
				options: {
					port: 8080,
					keepalive: true
				}
			}
		},

		concat_sourcemap: {
			options: {
				sourcesContent: true
			},

			js: {
				src: [
					'node_modules/sat/SAT.min.js',
					'js/utils.js',
					'js/audio/gameAudio.js',
					'js/graphics/graphics.js',
					'js/physics/physics.js',
					'js/engine/gameObject.js',
					'js/engine/gameItem.js',
					'js/engine/hud.js',
					'js/enemy/enemy.js',
					'js/level/level.js',
					'js/level/lvlComplete.js',
					'js/level/startScreen.js',
					'js/level/level1.js',
					'js/level/level2.js',        // TODO load new levels/assets dynamically?
					'js/level/level3.js',
					'js/engine/game.js',
					'js/hero/hero.js',
					'js/hero/heroGraphics.js',
					'js/hero/heroPhysics.js',
					'js/hero/heroInput.js',
					'js/main.js'
				],
				dest: 'out/js/jons-quest.js'
			},
			
			jsPrd1: {
				src: ['<%= concat_sourcemap.js.src %>', '!node_modules/sat/SAT.min.js'],
				dest: '<%= concat_sourcemap.js.dest %>'
			},
			
			jsPrd2: {
				src: ['node_modules/sat/SAT.min.js', '<%= concat_sourcemap.js.dest %>'],
				dest: '<%= concat_sourcemap.js.dest %>'
			},

			css: {
				src: [
					'css/jons-quest.css'
				],
				dest: 'out/css/jons-quest.css'
			}
		},
		
		babel: {
	        options: {
	            sourceMap: true,
	            presets: ['es2015']
	        },
	        
	        dist: {
	            files: {
	                '<%= concat_sourcemap.js.dest %>': '<%= concat_sourcemap.js.dest %>'
	            }
	        }
	    },

		copy: {
			main: {
				files: [{
					expand: true,
					src: ["img/**", "audio/**"],
					dest: "out/"
				}]
			}
		},
		
		watch: {
			options: {
				livereload: true
			},

			jonsQuestJs: {
				files: ['<%= concat_sourcemap.js.src %>'],
				tasks: ['concat_sourcemap:js']
			},

			css: {
				files: ['<%= concat_sourcemap.css.src %>'],
				tasks: ['concat_sourcemap:css']
			}
		},

		uglify: {
			options: {
				compress: {
					drop_console: true
				}
			},

			jonsQuestJs: {
				files: {
					'<%= concat_sourcemap.js.dest %>': '<%= concat_sourcemap.js.dest %>'
				}
			}
		},

		cssmin: {
			"<%= concat_sourcemap.css.dest %>": "<%= concat_sourcemap.css.src %>"
		}
	});

	grunt.loadNpmTasks('grunt-babel');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-concat-sourcemap');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('default', ['concat_sourcemap:js', 'concat_sourcemap:css', 'connect:dev', 'watch']);
	grunt.registerTask('prd', ['concat_sourcemap:jsPrd1', 'babel', 'uglify', 'concat_sourcemap:jsPrd2', 'cssmin', 'copy']);
	grunt.registerTask('srv', ['connect:srv']);
};