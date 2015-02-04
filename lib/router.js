/**
 * @file router.js
 * @author Wes Todd
 * @version 1.0
 * @module nighthawk
 */

// Requirements
var BaseRouter = require('router'),
	util = require('util'),
	Request = require('./request'),
	Response = require('./response'),
	supported = require('./supports-push-state');

/**
 * Router
 *
 * @constructor Router
 * @memberof module:nighthawk
 * @augments module:router.Router
 * @param {Object} [options]
 * @param {String} [options.base] - The base path for this router to match against
 */
var Router = module.exports = function Router(options) {
	if (!(this instanceof Router)) {
		return new Router(options);
	}

	// Options is optional
	options = options || {};

	// Set the base path
	this.base(options.base || null);

	// Call parent constructor
	return BaseRouter.call(this, options);
};
util.inherits(Router, BaseRouter);

/**
 * Set the base path for this router
 *
 * @function base
 * @memberof module:nighthawk.Router
 * @instance
 * @param {String} path - The new base path
 */
Router.prototype.base = function(path) {
	this._base = path;
};

/**
 * Start listening for route chagnes
 *
 * @function listen
 * @memberof module:nighthawk.Router
 * @instance
 * @param {Object} [options]
 * @param {Boolean} [options.popstate] - Should we bind to the popstate event?
 * @param {Boolean} [options.interceptClicks] - Should we bind to the window's click event?
 * @param {Boolean} [options.dispatch] - Should we dispatch a route right away?
 */
Router.prototype.listen = function(options) {
	// Default options
	options = options || {};

	// Watch for popstate?
	if (supported && options.popstate !== false) {
		window.addEventListener('popstate', this.onPopstate.bind(this), false);
	}
	
	// Intercept all clicks?
	if (supported && options.interceptClicks !== false) {
		window.addEventListener('click', this.onClick.bind(this), false);
	}

	// Dispatch at start?
	if (options.dispatch !== false) {
		this._processRequest({
			pathname: location.pathname,
			search: location.search ,
			hash: location.hash
		}, true);
	}
};

/**
 * Handler for the popstate event
 *
 * @function onPopstate
 * @memberof module:nighthawk.Router
 * @instance
 * @param {Event} e
 */
Router.prototype.onPopstate = function(e) {
	this._processRequest(e.state || {
		pathname: location.pathname,
		search: location.search,
		hash: location.hash
	}, true);
};

/**
 * Handler for all click events
 *
 * @function onClick
 * @memberof module:nighthawk.Router
 * @instance
 * @param {Event} e
 */
Router.prototype.onClick = function(e) {
	// Cross browser event
	e = e || window.event;

	// Check we are just a normal click
	if (which(e) !== 1 || e.metaKey || e.ctrlKey || e.shiftKey || e.defaultPrevented) {
		return;
	}

	// Find link up the dom tree
	var el = isLink(e.target);

	// Not a link
	if (!el) {
		return;
	}

	// Ignore if tag has
	// 1. "download" attribute
	// 2. rel="external" attribute
	// 3. target attribute
	if (el.getAttribute('download') || el.getAttribute('rel') === 'external' || el.target) {
		return;
	}

	// Get the link href
	var link = el.getAttribute('href');

	// ensure this is not a hash for the same path
	if (el.pathname === location.pathname && (el.hash || link === '#')) {
		return;
	}

	// Check for mailto: in the href
	if (link && link.indexOf('mailto:') > -1) {
		return;
	}

	// Only for same origin
	if (!sameOrigin(link)) {
		return;
	}

	// Make sure the base is present if set
	if (this._base && el.pathname.indexOf(this._base) !== 0) {
		return;
	}

	// We are all good to parse the route
	e.preventDefault();

	// Run the route matching
	this._processRequest({
		pathname: el.pathname,
		search: el.search,
		hash: el.hash
	});
};

/**
 * Process a url
 *
 * @function onClick
 * @memberof module:nighthawk.Router
 * @instance
 * @private
 * @param {Object} url - The new url for the page
 * @param {String} url.pathname - The path part of the url
 * @param {String} url.search - The search part of the url
 * @param {String} url.hash - The hash part of the url
 * @param {Boolean} replace - Should this replace or push?
 */
Router.prototype._processRequest = function(url, replace) {
	// Normalize the url object
	url.search = url.search || '';
	url.hash = url.hash || '';

	// Create the request object
	var req = new Request();
	req.app = this;
	req.method = 'GET';
	req.originalUrl = url.pathname + url.search + url.hash; 
	req.baseUrl = this._base; 
	req.path = url.pathname; 

	// Strip the base off before routing
	var path = url.pathname;
	if (this._base) {
		path = path.replace(this._base, '');
	}
	req.url = (path === '' ? '/' : path) + url.search + url.hash; 

	// Create the response object
	var res = new Response();
	res.app = this;

	// Push the state
	history[replace ? 'replaceState' : 'pushState'](url, null, req.originalUrl);

	// Run the route matching
	this(req, res, function(e) {
		console.log(404, e);
	});
};

// Is this element a link?
function isLink(el) {
	while (el && 'A' !== el.nodeName) {
		el = el.parentNode;
	}
	if (!el || 'A' !== el.nodeName) {
		return;
	}
	return el;
}

// Get the button
function which(e) {
	return e.which === null ? e.button : e.which;
}

// Internal request
var isInternal = new RegExp('^(?:(?:http[s]?:\/\/)?' + location.host.replace(/\./g, '\\.') + ')?\/', 'i');
function sameOrigin(url) {
	return !!isInternal.test(url);
}
