module.exports = function(grunt) {

	// configure tasks
	grunt.initConfig({
	    clean: ["out/css", "out/js"],

	    connect: {
	        server: {
	            options: {
	                hostname: "jonsQuest",
	                port: 180,
	                open: true
	            }
	        }
	    },

	    concat_sourcemap: {
	        options: {
                sourcesContent: true
	        },

	        jonsQuestJs: {
	            dest: "out/js/jonsQuest.js",
	            src: [
                "js/physics/SAT.js",
	              "js/utils.js",
	        			"js/audio/audio.js",
	        			"js/graphics/graphics.js",
	        			"js/physics/physics.js",
	        			"js/engine/gameObject.js",
	        			"js/engine/gameItem.js",
                "js/engine/hud.js",
	        			"js/enemy/enemy.js",
	        			"js/level/level.js",
                "js/level/lvlComplete.js",
                "js/level/startScreen.js",
	        			"js/level/level1.js",
                "js/level/level2.js",        // TODO load new levels/assets dynamically?
                "js/level/level3.js",
	        			"js/engine/game.js",
	        			"js/hero/hero.js",
	        			"js/hero/heroGraphics.js",
	        			"js/hero/heroPhysics.js",
	        			"js/hero/heroInput.js",
	        			"js/main.js"
	            ]
	        },

	        css: {
	            dest: "out/css/jonsQuest.css",
	            src: "css/jonsQuest.css"
	        }
	    },

	    copy: {
	    	main: {
	    		files: [
	    			{
	    				expand: true,
	    				src: ["img/**", "audio/**"],
	    				dest: "out/"
	    			}
    			]
	    	}
	    },

	    watch: {
	        options: {
	            livereload: true
	        },

	        jonsQuestJs: {
	            files: ["<%= concat_sourcemap.jonsQuestJs.src %>"],
	            tasks: ["concat_sourcemap:jonsQuestJs"]
	        },

	        css: {
	            files: ["<%= concat_sourcemap.css.src %>"],
	            tasks: ["concat_sourcemap:css"]
	        }
	    },

	    uglify: {
	        jonsQuestJs: {
	            files: {
	                "<%= concat_sourcemap.jonsQuestJs.dest %>": ["<%= concat_sourcemap.jonsQuestJs.src %>"]
	            }
	        }
	    },

	    cssmin: {
	        "<%= concat_sourcemap.css.dest %>": "<%= concat_sourcemap.css.src %>"
	    }
	});

  // external tasks (plugins)
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-contrib-connect");
	grunt.loadNpmTasks("grunt-contrib-cssmin");
	grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-contrib-copy");
	grunt.loadNpmTasks("grunt-concat-sourcemap");
  
  // task runner options
	grunt.registerTask("default", ["concat_sourcemap", "connect", "watch"]);
	grunt.registerTask("srv", ["connect", "watch"]);
	grunt.registerTask("prd", ["uglify", "cssmin", "copy"]);
};
