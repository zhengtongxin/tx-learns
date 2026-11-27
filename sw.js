/* Offline reading: pages are fetched fresh when online and kept for when the network is gone. Nothing else is stored, and /api/ is never touched. */
var CACHE='txl-v1';
self.addEventListener('install',function(){self.skipWaiting()});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==CACHE}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('fetch',function(e){
  var r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin||u.pathname.indexOf('/api/')===0||u.pathname==='/sw.js')return;
  var page=r.mode==='navigate'||/\.html?$/.test(u.pathname)||u.pathname==='/';
  if(page){
    e.respondWith(fetch(r).then(function(res){if(res.ok){var c=res.clone();caches.open(CACHE).then(function(x){x.put(r,c)})}return res}).catch(function(){return caches.match(r).then(function(m){return m||caches.match('/tracks.html')})}));
    return}
  e.respondWith(caches.match(r).then(function(m){
    var net=fetch(r).then(function(res){if(res.ok){var c=res.clone();caches.open(CACHE).then(function(x){x.put(r,c)})}return res}).catch(function(){return m});
    return m||net}));
});
