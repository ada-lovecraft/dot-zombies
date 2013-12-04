'use strict';

// Set the jasmine fixture path
// jasmine.getFixtures().fixturesPath = 'base/';

describe('dotZombie', function() {

    var module;
    var dependencies;
    dependencies = [];

    var hasModule = function(module) {
        return dependencies.indexOf(module) >= 0;
    };

    beforeEach(function() {

        // Get module
        module = angular.module('dotZombie');
        dependencies = module.requires;
    });

    it('should load config module', function() {
        expect(hasModule('dotZombie.config')).toBeTruthy();
    });

    it('should load controllers module', function() {
        expect(hasModule('dotZombie.controllers')).toBeTruthy();
    });

    it('should load filters module', function() {
        expect(hasModule('dotZombie.filters')).toBeTruthy();
    });

    it('should load directives module', function() {
        expect(hasModule('dotZombie.directives')).toBeTruthy();
    });

    it('should load services module', function() {
        expect(hasModule('dotZombie.services')).toBeTruthy();
    });

});
