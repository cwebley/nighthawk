/**
 * @file request.js
 * @author Wes Todd
 * @version 1.0
 * @module nighthawk
 */

/**
 * Request
 *
 * @constructor Request
 * @memberof module:nighthawk
 */
var Request = module.exports = function Request() {
	this.app = null;
	this.url = '';
	this.method = null;
	this.baseUrl = null;
	this.originalUrl = null;
	this.protocol = location.protocol;
	this.path = null;
};
