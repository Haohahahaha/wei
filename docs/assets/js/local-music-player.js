/**
 * Local Music Player for MkDocs Material
 * Auto-initializes APlayer from .local-music elements
 *
 * Usage in Markdown:
 *   <div class="local-music"
 *        data-name="歌曲名"
 *        data-artist="演唱者"
 *        data-url="../music/song.mp3"
 *        data-cover="../pic/cover.jpg"
 *        data-lrc="../music/song.lrc"
 *        data-autoplay="false">
 *   </div>
 *
 * Attributes:
 *   data-name     (required)  Song title
 *   data-artist   (required)  Artist name
 *   data-url      (required)  Audio file path (mp3/flac/etc.)
 *   data-cover    (optional)  Cover image path
 *   data-lrc      (optional)  LRC lyrics file path
 *   data-autoplay (optional)  Autoplay, default false
 */

(function () {
    'use strict';

    // Track all APlayer instances for cleanup on navigation
    var players = [];

    function destroyAll() {
        for (var i = 0; i < players.length; i++) {
            try { players[i].destroy(); } catch (e) {}
        }
        players = [];
    }

    function initOne(container) {
        var name = container.getAttribute('data-name') || '未知歌曲';
        var artist = container.getAttribute('data-artist') || '未知';
        var url = container.getAttribute('data-url') || '';
        var cover = container.getAttribute('data-cover') || '';
        var lrc = container.getAttribute('data-lrc') || '';
        var autoplay = container.getAttribute('data-autoplay');

        if (!url) return;

        // APlayer lrc expects a string, not URL.
        // If data-lrc looks like a URL (contains '.' or '/'), fetch it as text.
        function createPlayer(lrcText) {
            var ap = new APlayer({
                container: container,
                autoplay: autoplay === 'true',
                preload: 'auto',
                lrcType: lrcText ? 1 : 0,
                audio: [{
                    name: name,
                    artist: artist,
                    url: url,
                    cover: cover,
                    lrc: lrcText || ''
                }]
            });
            players.push(ap);
        }

        if (lrc && /[/.]/.test(lrc)) {
            // Looks like a file path, fetch it
            fetch(lrc)
                .then(function (resp) { return resp.text(); })
                .then(function (text) { createPlayer(text); })
                .catch(function () { createPlayer(''); });
        } else {
            createPlayer(lrc);
        }
    }

    function scanAndInit(root) {
        root = root || document;
        var els = root.querySelectorAll('.local-music');
        for (var i = 0; i < els.length; i++) {
            // Skip already-initialized
            if (els[i].querySelector('.aplayer')) continue;
            initOne(els[i]);
        }
    }

    function onReady() {
        scanAndInit();

        // MkDocs instant navigation: watch for page switches
        if (window.MutationObserver) {
            new MutationObserver(function (mutations) {
                for (var i = 0; i < mutations.length; i++) {
                    var nodes = mutations[i].addedNodes;
                    for (var j = 0; j < nodes.length; j++) {
                        if (nodes[j].nodeType === 1 && nodes[j].querySelectorAll) {
                            scanAndInit(nodes[j]);
                        }
                    }
                }
            }).observe(document.body, { childList: true, subtree: true });
        }

        // MkDocs instant: cleanup before page unload
        if (document.addEventListener) {
            document.addEventListener('beforeunload', destroyAll);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onReady);
    } else {
        onReady();
    }
})();
