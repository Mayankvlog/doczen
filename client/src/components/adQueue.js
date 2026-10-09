var pendingAds = [];
var activeAd = null;

function finishAd(request, error) {
  if (request.finished) return;
  request.finished = true;
  clearTimeout(request.timeout);
  clearTimeout(request.retryTimer);

  // Clear render check timer if it exists
  if (request.renderCheckTimer) {
    clearInterval(request.renderCheckTimer);
    request.renderCheckTimer = null;
  }

  if (
    request.config &&
    request.config.key &&
    window.atOptions &&
    window.atOptions.key === request.config.key
  ) {
    delete window.atOptions;
  }

  if ((error || request.cancelled) && request.script) request.script.remove();

  if (window._adActive[request.slotKey] === request.token) {
    window._adActive[request.slotKey] = false;
    if (!request.cancelled) {
      if (error) request.onerror(error);
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
    window.atOptions &&
    window.atOptions.key === request.config.key
  ) {
    delete window.atOptions;
  }
}

function retryAd(request, error, attempt) {
  if (request.finished || request.attempt !== attempt) return;
  clearTimeout(request.timeout);
  if (request.renderCheckTimer) {
    clearInterval(request.renderCheckTimer);
    request.renderCheckTimer = null;
  }
  request.script.remove();
  clearAdConfig(request);

  if (request.attempts < 2 && !request.cancelled) {
    console.warn(
      '[adQueue] Ad script attempt failed; retrying once:',
      request.src,
      error
    );
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
  if (request.config && request.config.key) {
    window.atOptions = Object.assign({}, request.config);
    console.log('[adQueue] Setting atOptions:', request.config);
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

  // Add ad rendering detection
  var renderCheckCount = 0;

  script.onload = function() {
    if (request.finished || request.attempt !== attempt) return;
    console.log('[adQueue] Ad script loaded successfully:', request.src);

    // Check if ad rendered content into the container
    request.renderCheckTimer = setInterval(function() {
      renderCheckCount++;
      if (request.finished) {
        clearInterval(request.renderCheckTimer);
        return;
      }

      var container = request.container;
      if (!container || !document.documentElement.contains(container)) {
        clearInterval(request.renderCheckTimer);
        finishAd(request, new Error('Container removed from DOM'));
        return;
      }

      // Check if container has any content (iframe, div, img, etc.)
      var hasContent = false;
      var children = container.children;
      for (var i = 0; i < children.length; i++) {
        var child = children[i];
        if (child.tagName === 'IFRAME' || child.tagName === 'IMG' ||
            child.tagName === 'DIV' || child.tagName === 'A') {
          // Check if it has actual content (not just empty)
          if (child.src || child.innerHTML.trim() ||
              child.style.backgroundImage || child.offsetWidth > 0) {
            hasContent = true;
            break;
          }
        }
      }

      if (hasContent) {
        console.log('[adQueue] Ad rendered successfully in container');
        clearInterval(request.renderCheckTimer);
        finishAd(request);
      } else if (renderCheckCount >= 10) {
        // After 5 seconds (10 checks * 500ms), if no content, treat as failed
        console.warn('[adQueue] Ad did not render content after timeout');
        clearInterval(request.renderCheckTimer);
        finishAd(request, new Error('Ad script loaded but did not render'));
      }
    }, 500);
  };

  script.onerror = function() {
    if (request.renderCheckTimer) clearInterval(request.renderCheckTimer);
    retryAd(request, new Error('Ad script failed to load'), attempt);
  };

  request.timeout = setTimeout(function() {
    if (request.renderCheckTimer) clearInterval(request.renderCheckTimer);
    retryAd(request, new Error('Ad script load timed out'), attempt);
  }, 15000);

  try {
    request.container.appendChild(script);
  } catch (error) {
    if (request.renderCheckTimer) clearInterval(request.renderCheckTimer);
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

  if (!src || !container) return undefined;

  try {
    if (!window._adActive) window._adActive = {};
    var slotKey = src + '::' + (container.id || 'default');
    if (window._adActive[slotKey]) return undefined;

    var token = {};
    var request = {
      src: src,
      config: config,
      dataCfasync: options.dataCfasync !== undefined ? options.dataCfasync : false,
      container: container,
      slotKey: slotKey,
      token: token,
      onerror: function(error) {
        console.error('[adQueue] Ad script failed:', src, error);
        if (options.onerror) options.onerror(error);
      },
      onload: function() {
        if (options.onload) options.onload();
      },
      script: null,
      attempts: 0,
      attempt: 0,
      cancelled: false,
      finished: false,
      timeout: null,
      retryTimer: null,
      renderCheckTimer: null,
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
        if (request.renderCheckTimer) {
          clearInterval(request.renderCheckTimer);
          request.renderCheckTimer = null;
        }
        clearAdConfig(request);
        runNextAd();
      } else if (activeAd === request) {
        finishAd(request);
      }
    };
  } catch (error) {
    console.error('[adQueue] Load ad error:', error);
    if (options.onerror) options.onerror(error);
    return undefined;
  }
}
