var pendingAds = [];
var activeAd = null;
var globalConfigLock = null;
// Give the ad network enough time to resolve invoke.js -> watch script -> creative.
// Rendered creatives are detected immediately (MutationObserver / load handler);
// this timer only guards the genuine no-fill case.
var RENDER_TIMEOUT = 20000;

function finishAd(request, error, noFill) {
  if (request.finished) return;
  request.finished = true;
  clearTimeout(request.timeout);
  clearTimeout(request.retryTimer);
  clearTimeout(request.renderTimer);
  if (request.renderObserver) request.renderObserver.disconnect();
  if (request.renderLoadHandler) {
    request.container.removeEventListener('load', request.renderLoadHandler, true);
  }

  if (
    request.config &&
    request.config.key &&
    globalConfigLock === request.config.key
  ) {
    delete window.atOptions;
    globalConfigLock = null;
  }

  if ((error || request.cancelled) && request.script) request.script.remove();

  if (window._adActive[request.slotKey] === request.token) {
    window._adActive[request.slotKey] = false;
    if (!request.cancelled) {
      if (noFill) request.onempty();
      else if (error) request.onerror(error);
      else request.onload();
    }
  }

  if (activeAd === request) activeAd = null;
  runNextAd();
}

function clearAdConfig(request) {
  if (
    request.config &&
    request.config.key &&
    globalConfigLock === request.config.key
  ) {
    delete window.atOptions;
    globalConfigLock = null;
  }
}

function retryAd(request, error, attempt) {
  if (request.finished || request.attempt !== attempt) return;
  clearTimeout(request.timeout);
  if (request.script) request.script.remove();
  clearAdConfig(request);

  if (request.attempts < 2 && !request.cancelled) {
    request.retryTimer = setTimeout(function() {
      if (request.finished || request.cancelled || activeAd !== request) {
        finishAd(request);
        return;
      }
      startAdAttempt(request);
    }, 500);
    return;
  }

  finishAd(request, error);
}

function startAdAttempt(request) {
  request.attempts += 1;
  request.attempt += 1;
  var attempt = request.attempt;

  // Set atOptions BEFORE script loading - critical for ad rendering
  // Use global lock to prevent race conditions between multiple ads
  if (request.config && request.config.key) {
    globalConfigLock = request.config.key;
    window.atOptions = Object.assign({}, request.config);
  }

  var script = document.createElement('script');
  request.script = script;
  script.src = request.src;
  script.async = true;
  if (request.dataCfasync !== undefined) {
    script.setAttribute('data-cfasync', String(request.dataCfasync));
  } else {
    script.setAttribute('data-cfasync', 'false');
  }

  script.onload = function() {
    if (request.finished || request.attempt !== attempt) return;
    clearTimeout(request.timeout);

    var isSized = function(el) {
      var rect = el.getBoundingClientRect();
      var width = rect.width || parseFloat(el.getAttribute('width')) || parseFloat(el.style.width) || 0;
      var height = rect.height || parseFloat(el.getAttribute('height')) || parseFloat(el.style.height) || 0;
      return width > 1 && height > 1;
    };

    var hasRenderedCreative = function() {
      var container = request.container;
      if (!container) return false;

      // iframe creative (banner / sidebar / iframe format)
      var frames = container.querySelectorAll('iframe');
      for (var i = 0; i < frames.length; i++) {
        if (isSized(frames[i])) return true;
      }

      // image creative
      var images = container.querySelectorAll('img');
      for (var j = 0; j < images.length; j++) {
        var image = images[j];
        var imageRect = image.getBoundingClientRect();
        if (
          image.complete &&
          image.naturalWidth > 1 &&
          image.naturalHeight > 1 &&
          imageRect.width > 1 &&
          imageRect.height > 1
        ) {
          return true;
        }
      }

      // clickable (anchor) creative
      var links = container.querySelectorAll('a');
      for (var k = 0; k < links.length; k++) {
        if (isSized(links[k])) return true;
      }

      // Adsterra injects node-based creatives (e.g. native <div class="container-KEY__bn">
      // or banner wrappers). Treat any sized non-script node as a rendered creative so
      // such fills are not mis-reported as "no fill".
      var children = container.children;
      for (var m = 0; m < children.length; m++) {
        var child = children[m];
        if (child.tagName === 'SCRIPT') continue;
        if (child.tagName === 'INS' || isSized(child)) return true;
      }

      return false;
    };

    var finishIfRendered = function() {
      if (request.finished || request.attempt !== attempt) return;
      if (hasRenderedCreative()) {
        finishAd(request);
      }
    };

    finishIfRendered();
    if (request.finished) return;

    request.renderLoadHandler = finishIfRendered;
    request.container.addEventListener('load', request.renderLoadHandler, true);

    if (typeof MutationObserver !== 'undefined') {
      request.renderObserver = new MutationObserver(finishIfRendered);
      request.renderObserver.observe(request.container, { childList: true, subtree: true, attributes: true });
    }

    request.renderTimer = setTimeout(function() {
      if (request.finished || request.attempt !== attempt) return;
      if (hasRenderedCreative()) {
        finishAd(request);
        return;
      }
      finishAd(request, null, true);
    }, RENDER_TIMEOUT);
  };

  script.onerror = function() {
    retryAd(request, new Error('Ad script failed to load'), attempt);
  };

  request.timeout = setTimeout(function() {
    if (request.finished || request.attempt !== attempt) return;
    retryAd(request, new Error('Ad script load timed out'), attempt);
  }, 20000);

  try {
    request.container.appendChild(script);
  } catch (error) {
    retryAd(request, error, attempt);
  }
}

function runNextAd() {
  if (activeAd || pendingAds.length === 0) return;

  var request = pendingAds.shift();
  if (request.cancelled || window._adActive[request.slotKey] !== request.token) {
    runNextAd();
    return;
  }

  if (!document.documentElement.contains(request.container)) {
    finishAd(request, new Error('Container not in DOM'));
    return;
  }

  activeAd = request;
  startAdAttempt(request);
}

export function loadAd(options) {
  var src = options.src;
  var config = options.config;
  var container = options.container;
  var dataCfasync = options.dataCfasync !== undefined ? options.dataCfasync : options['data-cfasync'];

  if (!src || !container) return undefined;
  if (process.env.REACT_APP_ADS_ENABLED === 'false') {
    if (options.onempty) options.onempty();
    return undefined;
  }

  try {
    if (!window._adActive) window._adActive = {};
    var slotKey = src + '::' + (container.id || 'default') + '::' + Date.now() + '::' + Math.random().toString(36).substr(2, 9);
    if (window._adActive[slotKey]) return undefined;

    var token = {};
    var request = {
      src: src,
      config: config,
      dataCfasync: dataCfasync !== undefined ? dataCfasync : false,
      container: container,
      slotKey: slotKey,
      token: token,
      onerror: function(error) {
        if (options.onerror) options.onerror(error);
      },
      onload: function() {
        if (options.onload) options.onload();
      },
      onempty: function() {
        if (options.onempty) options.onempty();
      },
      script: null,
      attempts: 0,
      attempt: 0,
      cancelled: false,
      finished: false,
      timeout: null,
      retryTimer: null,
      renderTimer: null,
      renderObserver: null,
      renderLoadHandler: null,
    };

    window._adActive[slotKey] = token;
    pendingAds.push(request);
    Promise.resolve().then(runNextAd);

    return function cleanup() {
      if (window._adActive[slotKey] !== token) return;
      window._adActive[slotKey] = false;
      request.cancelled = true;

      var queuedIndex = pendingAds.indexOf(request);
      if (queuedIndex !== -1) {
        pendingAds.splice(queuedIndex, 1);
        request.finished = true;
        clearTimeout(request.retryTimer);
        clearAdConfig(request);
        runNextAd();
      } else if (activeAd === request) {
        finishAd(request);
      }
    };
  } catch (error) {
    if (options.onerror) options.onerror(error);
    return undefined;
  }
}
