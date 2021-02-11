/* global VANILLA_VERSION */
(function () {
  if (!window.VANILLA_VERSION) {
    throw Error('VANILLA_VERSION not specified.');
  }

  var CODEPEN_PREFILL_CONFIG = {
    title: 'Vanilla framework example',
    head: "<meta name='viewport' content='width=device-width, initial-scale=1'>",
    stylesheets: [
      // link to latest Vanilla CSS
      // if it's a demo, use local build.css for better QA, otherwise use latest published Vanilla
      /demos\.haus$/.test(window.location.host)
        ? `${window.location.origin}/static/build/css/build.css`
        : 'https://assets.ubuntu.com/v1/vanilla-framework-version-' + VANILLA_VERSION + '.min.css',
      // link to example stylesheet (to set margin on body)
      'https://assets.ubuntu.com/v1/4653d9ba-example.css',
    ],
    tags: ['Vanilla framework'],
  };

  var CODEPEN_HEIGHT = 400;

  document.addEventListener('DOMContentLoaded', function () {
    var examples = document.querySelectorAll('.js-example');

    // IE11 doesn't support forEach on NodeList, CodePen doesn't support IE as well
    // so we don't want to load CodePen when forEach is not supported
    if (examples.forEach) {
      examples.forEach(renderExample);
    }
  });

  function renderExample(exampleElement) {
    var link = exampleElement.href;
    var request = new XMLHttpRequest();

    request.onreadystatechange = function () {
      if (request.status === 200 && request.readyState === 4) {
        var html = request.responseText;
        renderCodeBlocks(exampleElement, html);
        exampleElement.style.display = 'none';
      }
    };

    request.open('GET', link, true);
    request.send(null);
  }

  function createPreCode(source, lang) {
    var code = document.createElement('code');
    code.appendChild(document.createTextNode(source));

    var pre = document.createElement('pre');
    pre.classList.add('p-code-snippet__block');
    // FIXME: this doesn't work with multiple examples on a page, we need unique ids or another way of selecting panels to show/hide
    pre.id = 'panel-' + lang;
    pre.style.maxHeight = '300px';
    if (lang !== 'html') {
      pre.classList.add('u-hide');
    }

    if (lang) {
      pre.setAttribute('data-lang', lang);
      pre.classList.add('language-' + lang);
    }

    pre.appendChild(code);
    return pre;
  }

  function renderCodeBlocks(placementElement, html) {
    var bodyPattern = /<body[^>]*>((.|[\n\r])*)<\/body>/im;
    var titlePattern = /<title[^>]*>((.|[\n\r])*)<\/title>/im;
    var headPattern = /<head[^>]*>((.|[\n\r])*)<\/head>/im;

    var title = titlePattern.exec(html)[1].trim();
    var bodyHTML = bodyPattern.exec(html)[1].trim();
    var headHTML = headPattern.exec(html)[1].trim();

    var htmlSource = stripScriptsFromSource(bodyHTML);
    var jsSource = getScriptFromSource(bodyHTML);
    var cssSource = getStyleFromSource(headHTML);
    var externalScripts = getExternalScriptsFromSource(html);

    var height = placementElement.getAttribute('data-height') || CODEPEN_HEIGHT;

    var container = document.createElement('div');

    // Set attributes of code block to be parsed by CodePen embed script

    // hide code container by default, so it doesn't flash on page
    // before CodePen is rendered
    container.classList.add('p-code-snippet', 'codepen-example');

    // pass any external scripts to CodePen
    if (externalScripts.length) {
      CODEPEN_PREFILL_CONFIG.scripts = externalScripts;
    }

    var config = JSON.parse(JSON.stringify(CODEPEN_PREFILL_CONFIG));
    // update title in the config with title of the example page
    if (title) {
      config.title = title;
    }
    var header = document.createElement('div');
    header.classList.add('p-code-snippet__header');
    var titleEl = document.createElement('h5');
    titleEl.classList.add('p-code-snippet__title');
    titleEl.innerText = title;
    header.appendChild(titleEl);

    container.appendChild(header);

    //container.setAttribute('data-prefill', encodeURI(JSON.stringify(config)));
    //container.setAttribute('data-height', height);
    // For more options see CodePen docs
    // https://blog.codepen.io/documentation/prefill-embeds/
    //
    // For example:
    //container.setAttribute('data-theme-id', 'light');
    //container.setAttribute("data-default-tab", "html,result");

    // Build code block structure
    container.appendChild(createPreCode(htmlSource, 'html'));

    if (jsSource || cssSource) {
      var dropdownsEl = document.createElement('div');
      dropdownsEl.classList.add('p-code-snippet__dropdowns');
      var selectEl = document.createElement('select');
      selectEl.classList.add('p-code-snippet__dropdown');
      dropdownsEl.appendChild(selectEl);
      header.appendChild(dropdownsEl);
      var optionHTML = document.createElement('option');
      optionHTML.value = 'panel-html';
      optionHTML.innerText = 'HTML';
      selectEl.appendChild(optionHTML);
    }

    if (jsSource) {
      container.appendChild(createPreCode(jsSource, 'js'));
      var optionJS = document.createElement('option');
      optionJS.value = 'panel-js';
      optionJS.innerText = 'JS';
      selectEl.appendChild(optionJS);
    }

    if (cssSource) {
      container.appendChild(createPreCode(cssSource, 'css'));
      var optionCSS = document.createElement('option');
      optionCSS.value = 'panel-css';
      optionCSS.innerText = 'CSS';
      selectEl.appendChild(optionCSS);
    }

    placementElement.parentNode.insertBefore(container, placementElement);

    if (window.__CPEmbed) {
      // init codepen after examples code is rendered
      // window.__CPEmbed('.codepen-example');
    } else {
      // or show the code blocks as a fallback
      container.classList.remove('u-hide');
    }

    var iframe = renderIframe(container, html, height);

    // FIXME - hacky way that depends on separate script
    setupCodeSnippetDropdowns('.p-code-snippet__dropdown');
    Prism.highlightAll();
  }

  function renderIframe(container, html, height) {
    var iframe = document.createElement('iframe');
    iframe.width = '100%';
    iframe.height = height + 'px';
    iframe.frameBorder = 0;
    container.appendChild(iframe);
    //placementElement.parentNode.insertBefore(iframe, placementElement);
    var doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    return iframe;
    // // Wait for content to load before determining height
    // var resizeInterval = setInterval(
    //   function() {
    //     if (iframe.contentDocument.readyState == 'complete') {
    //       // remove any residual margin
    //       iframe.contentDocument.body.style.margin = 0;
    //       // add padding to see shadows pattern shadows
    //       iframe.contentDocument.body.style.padding = '.5rem .25rem';
    //       // Add extra spacing to catch edge cases
    //       const frameHeight = iframe.contentDocument.body.scrollHeight;
    //       iframe.height = frameHeight + "px";
    //       clearInterval(resizeInterval);
    //     }
    //   },
    //   100
    // );
    // setTimeout(function() {clearInterval(resizeInterval);}, 2000);
  }

  function getStyleFromSource(source) {
    var div = document.createElement('div');
    div.innerHTML = source;
    var style = div.querySelector('style');
    return style ? style.innerHTML.trim() : null;
  }

  function stripScriptsFromSource(source) {
    var div = document.createElement('div');
    div.innerHTML = source;
    var scripts = div.getElementsByTagName('script');
    var i = scripts.length;
    while (i--) {
      scripts[i].parentNode.removeChild(scripts[i]);
    }
    return div.innerHTML.trim();
  }

  function getScriptFromSource(source) {
    var div = document.createElement('div');
    div.innerHTML = source;
    var script = div.querySelector('script');
    return script ? script.innerHTML.trim() : null;
  }

  function getExternalScriptsFromSource(source) {
    var div = document.createElement('div');
    div.innerHTML = source;
    var scripts = div.querySelectorAll('script[src]');
    scripts = [].slice.apply(scripts).map(function (s) {
      return s.src;
    });
    return scripts;
  }
})();
