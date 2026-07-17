/**
 * NetEase Music outchain iframe → MetingJS + APlayer 自动转换
 * 解决网易云 iframe 播放器在手机上无法显示的问题
 */
(function () {
  'use strict';

  // type 参数映射: 0=playlist, 1=album, 2=song, 3=playlist
  var TYPE_MAP = { '0': 'playlist', '1': 'album', '2': 'song', '3': 'playlist' };

  function parseParams(src) {
    var qs = (src || '').split('?')[1] || '';
    var params = {};
    qs.split('&').forEach(function (pair) {
      var kv = pair.split('=');
      if (kv.length === 2) {
        params[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1]);
      }
    });
    return params;
  }

  function createMetingElement(songId, type, auto) {
    var el = document.createElement('meting-js');
    el.setAttribute('server', 'netease');
    el.setAttribute('type', TYPE_MAP[type] || 'song');
    el.setAttribute('id', songId);
    el.setAttribute('auto', auto || '0');
    el.style.cssText = 'display:block;max-width:100%;margin:0.5em 0;';
    return el;
  }

  function convertIframes(root) {
    root = root || document;
    var iframes = root.querySelectorAll('iframe[src*="music.163.com/outchain/player"]');
    for (var i = 0; i < iframes.length; i++) {
      var iframe = iframes[i];
      var params = parseParams(iframe.getAttribute('src'));
      if (params.id) {
        var meting = createMetingElement(params.id, params.type, params.auto);
        iframe.parentNode.replaceChild(meting, iframe);
      }
    }
  }

  function onReady() {
    convertIframes();

    // Material for MkDocs instant navigation: 监听页面切换
    if (window.MutationObserver) {
      new MutationObserver(function (mutations) {
        for (var i = 0; i < mutations.length; i++) {
          var nodes = mutations[i].addedNodes;
          for (var j = 0; j < nodes.length; j++) {
            if (nodes[j].nodeType === 1 && nodes[j].querySelectorAll) {
              convertIframes(nodes[j]);
            }
          }
        }
      }).observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();
